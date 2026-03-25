"""API key management, webhooks, and bulk evaluation endpoints."""

import hashlib
import hmac
import secrets
import json
from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Header, status, Request
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..database import get_db
from .deps import get_current_user
from ..models.user import User
from ..models.membership import Membership
from ..models.api_key import ApiKey
from ..models.webhook import Webhook
from ..services.compliance_engine import (
    FixtureData, evaluate_fixture_full, compute_overall_status, compute_compliance_score,
)

router = APIRouter(prefix="/integrations", tags=["integrations"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class ApiKeyCreate(BaseModel):
    name: str
    organization_id: int


class ApiKeyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    key_prefix: str
    name: str
    organization_id: int
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None


class ApiKeyCreated(ApiKeyRead):
    """Returned only on creation — includes the full key."""
    full_key: str


class WebhookCreate(BaseModel):
    organization_id: int
    url: str
    events: List[str]  # ["import_complete", "compliance_evaluated", "fixture_failed"]
    secret: Optional[str] = None


class WebhookRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    organization_id: int
    url: str
    events: str
    is_active: bool
    created_at: datetime


class BulkFixtureInput(BaseModel):
    fixture_type: str
    wattage: Optional[float] = None
    lumen_output: Optional[float] = None
    cct: Optional[float] = None
    cri: Optional[float] = None
    quantity: int = 1
    space_type: Optional[str] = None
    space_area: Optional[float] = None
    applicable_standards: Optional[List[str]] = None


class BulkEvalRequest(BaseModel):
    fixtures: List[BulkFixtureInput]


class BulkResultItem(BaseModel):
    index: int
    overall_status: str
    compliance_score: int
    results: List[dict]


class BulkEvalResponse(BaseModel):
    evaluated: int
    items: List[BulkResultItem]


# ── Helpers ──────────────────────────────────────────────────────────────────

VALID_EVENTS = {"import_complete", "compliance_evaluated", "fixture_failed"}


def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def _verify_org_admin(db: Session, org_id: int, user_id: int):
    m = db.query(Membership).filter(
        Membership.organization_id == org_id,
        Membership.user_id == user_id,
    ).first()
    if not m or m.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return m


def _verify_org_member(db: Session, org_id: int, user_id: int):
    m = db.query(Membership).filter(
        Membership.organization_id == org_id,
        Membership.user_id == user_id,
    ).first()
    if not m:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    return m


def authenticate_api_key(
    db: Session,
    x_api_key: str,
) -> ApiKey:
    """Validate an API key and return the ApiKey record."""
    key_hash = _hash_key(x_api_key)
    api_key = db.query(ApiKey).filter(
        ApiKey.key_hash == key_hash,
        ApiKey.is_active == True,
    ).first()
    if not api_key:
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")
    api_key.last_used_at = datetime.now(timezone.utc)
    db.commit()
    return api_key


# ── API Key endpoints ────────────────────────────────────────────────────────

@router.post("/api-keys", response_model=ApiKeyCreated)
def create_api_key(
    body: ApiKeyCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new API key for an organization. Admin only."""
    _verify_org_admin(db, body.organization_id, user.id)

    raw_key = f"bl_k_{secrets.token_urlsafe(32)}"
    key_hash = _hash_key(raw_key)
    prefix = raw_key[:12] + "..."

    api_key = ApiKey(
        key_hash=key_hash,
        key_prefix=prefix,
        name=body.name,
        organization_id=body.organization_id,
        created_by=user.id,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    return ApiKeyCreated(
        id=api_key.id,
        key_prefix=api_key.key_prefix,
        name=api_key.name,
        organization_id=api_key.organization_id,
        is_active=api_key.is_active,
        created_at=api_key.created_at,
        last_used_at=api_key.last_used_at,
        full_key=raw_key,
    )


@router.get("/api-keys/{org_id}", response_model=List[ApiKeyRead])
def list_api_keys(
    org_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List API keys for an organization."""
    _verify_org_member(db, org_id, user.id)
    keys = db.query(ApiKey).filter(ApiKey.organization_id == org_id).order_by(ApiKey.created_at.desc()).all()
    return keys


@router.delete("/api-keys/{key_id}")
def revoke_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Revoke (deactivate) an API key."""
    key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    _verify_org_admin(db, key.organization_id, user.id)
    key.is_active = False
    db.commit()
    return {"detail": "API key revoked"}


# ── Webhook endpoints ────────────────────────────────────────────────────────

@router.post("/webhooks", response_model=WebhookRead)
def create_webhook(
    body: WebhookCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Register a webhook URL for event notifications."""
    _verify_org_admin(db, body.organization_id, user.id)

    invalid = set(body.events) - VALID_EVENTS
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid events: {invalid}. Valid: {VALID_EVENTS}")

    wh = Webhook(
        organization_id=body.organization_id,
        url=body.url,
        secret=body.secret,
        events=",".join(body.events),
        created_by=user.id,
    )
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh


@router.get("/webhooks/{org_id}", response_model=List[WebhookRead])
def list_webhooks(
    org_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List webhooks for an organization."""
    _verify_org_member(db, org_id, user.id)
    return db.query(Webhook).filter(Webhook.organization_id == org_id).order_by(Webhook.created_at.desc()).all()


@router.delete("/webhooks/{webhook_id}")
def delete_webhook(
    webhook_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete a webhook."""
    wh = db.query(Webhook).filter(Webhook.id == webhook_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook not found")
    _verify_org_admin(db, wh.organization_id, user.id)
    db.delete(wh)
    db.commit()
    return {"detail": "Webhook deleted"}


# ── Bulk evaluation (API-key or JWT auth) ────────────────────────────────────

@router.post("/evaluate-bulk", response_model=BulkEvalResponse)
def evaluate_bulk(
    body: BulkEvalRequest,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    """
    Bulk evaluate fixtures without persisting. Accepts JWT or API key auth.
    POST an array of fixture objects, receive compliance results.
    """
    # If API key provided, validate it (already handled by middleware or manually)
    if x_api_key:
        authenticate_api_key(db, x_api_key)

    items: List[BulkResultItem] = []
    for idx, fx_input in enumerate(body.fixtures):
        standards = fx_input.applicable_standards or []
        fd = FixtureData(
            fixture_id=f"bulk-{idx}",
            fixture_type=fx_input.fixture_type,
            wattage=fx_input.wattage,
            lumen_output=fx_input.lumen_output,
            cct=fx_input.cct,
            cri=fx_input.cri,
            quantity=fx_input.quantity,
            space_type=fx_input.space_type,
            space_area=fx_input.space_area,
            applicable_standards=standards,
        )
        results = evaluate_fixture_full(fd)
        overall = compute_overall_status(results)
        score = compute_compliance_score(results)

        items.append(BulkResultItem(
            index=idx,
            overall_status=overall,
            compliance_score=score,
            results=[
                {
                    "standard": r.standard,
                    "standard_name": r.standard_name,
                    "code_section": r.code_section,
                    "status": r.status,
                    "allowed_lpd": r.allowed_lpd,
                    "calculated_lpd": r.calculated_lpd,
                    "delta": r.delta,
                    "efficacy": r.efficacy,
                    "min_efficacy": r.min_efficacy,
                    "notes": r.notes,
                }
                for r in results
            ],
        ))

    return BulkEvalResponse(evaluated=len(items), items=items)
