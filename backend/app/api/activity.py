"""Activity feed & audit trail endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from io import StringIO
import csv
import json

from ..database import get_db
from .deps import get_current_user
from ..models.user import User
from ..models.membership import Membership
from ..models.activity_log import ActivityLog
from ..models.comment import Comment
from ..models.fixture import Fixture
from ..models.fixture_change import FixtureChange
from ..models.site import Site

router = APIRouter(prefix="/activity", tags=["activity"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class ActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    timestamp: datetime
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    summary: str
    details: Optional[str] = None


class CommentCreate(BaseModel):
    content: str


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fixture_id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class FixtureChangeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fixture_id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    timestamp: datetime
    field_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _verify_org_membership(db: Session, org_id: int, user_id: int):
    m = db.query(Membership).filter(
        Membership.organization_id == org_id,
        Membership.user_id == user_id,
    ).first()
    if not m:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")
    return m


def _get_org_for_fixture(db: Session, fixture_id: int) -> int:
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    if fixture.site_id:
        site = db.query(Site).filter(Site.id == fixture.site_id).first()
        return site.organization_id
    raise HTTPException(status_code=400, detail="Fixture not associated with a site")


# ── Activity Feed ────────────────────────────────────────────────────────────

@router.get("/feed/{org_id}", response_model=List[ActivityRead])
def get_activity_feed(
    org_id: int,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get activity feed for an organization."""
    _verify_org_membership(db, org_id, user.id)
    q = db.query(ActivityLog).filter(ActivityLog.organization_id == org_id)
    if action:
        q = q.filter(ActivityLog.action == action)
    logs = q.order_by(ActivityLog.timestamp.desc()).offset(offset).limit(limit).all()

    results = []
    for log in logs:
        user_email = None
        if log.user_id:
            u = db.query(User).filter(User.id == log.user_id).first()
            user_email = u.email if u else None
        results.append(ActivityRead(
            id=log.id,
            timestamp=log.timestamp,
            user_id=log.user_id,
            user_email=user_email,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            summary=log.summary,
            details=log.details,
        ))
    return results


@router.get("/feed/{org_id}/export")
def export_audit_trail(
    org_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Export full audit trail as CSV."""
    _verify_org_membership(db, org_id, user.id)
    logs = db.query(ActivityLog).filter(
        ActivityLog.organization_id == org_id
    ).order_by(ActivityLog.timestamp.desc()).all()

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Timestamp", "User ID", "Action", "Entity Type", "Entity ID", "Summary", "Details"])
    for log in logs:
        writer.writerow([
            log.timestamp.isoformat() if log.timestamp else "",
            log.user_id or "",
            log.action,
            log.entity_type or "",
            log.entity_id or "",
            log.summary,
            log.details or "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_trail.csv"},
    )


# ── Comments ─────────────────────────────────────────────────────────────────

@router.post("/fixtures/{fixture_id}/comments", response_model=CommentRead)
def add_comment(
    fixture_id: int,
    body: CommentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Add a comment to a fixture."""
    org_id = _get_org_for_fixture(db, fixture_id)
    _verify_org_membership(db, org_id, user.id)

    comment = Comment(
        fixture_id=fixture_id,
        user_id=user.id,
        organization_id=org_id,
        content=body.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    from ..services.activity import log_activity
    log_activity(
        db, org_id, "comment_added",
        f"Comment added on fixture #{fixture_id}",
        user_id=user.id, entity_type="fixture", entity_id=str(fixture_id),
    )

    return CommentRead(
        id=comment.id,
        fixture_id=comment.fixture_id,
        user_id=comment.user_id,
        user_email=user.email,
        content=comment.content,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
    )


@router.get("/fixtures/{fixture_id}/comments", response_model=List[CommentRead])
def get_comments(
    fixture_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get all comments on a fixture."""
    org_id = _get_org_for_fixture(db, fixture_id)
    _verify_org_membership(db, org_id, user.id)

    comments = db.query(Comment).filter(
        Comment.fixture_id == fixture_id
    ).order_by(Comment.created_at.desc()).all()

    results = []
    for c in comments:
        u = db.query(User).filter(User.id == c.user_id).first() if c.user_id else None
        results.append(CommentRead(
            id=c.id,
            fixture_id=c.fixture_id,
            user_id=c.user_id,
            user_email=u.email if u else None,
            content=c.content,
            created_at=c.created_at,
            updated_at=c.updated_at,
        ))
    return results


# ── Change History ───────────────────────────────────────────────────────────

@router.get("/fixtures/{fixture_id}/changes", response_model=List[FixtureChangeRead])
def get_fixture_changes(
    fixture_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get field-level change history for a fixture."""
    org_id = _get_org_for_fixture(db, fixture_id)
    _verify_org_membership(db, org_id, user.id)

    changes = db.query(FixtureChange).filter(
        FixtureChange.fixture_id == fixture_id
    ).order_by(FixtureChange.timestamp.desc()).all()

    results = []
    for ch in changes:
        u = db.query(User).filter(User.id == ch.user_id).first() if ch.user_id else None
        results.append(FixtureChangeRead(
            id=ch.id,
            fixture_id=ch.fixture_id,
            user_id=ch.user_id,
            user_email=u.email if u else None,
            timestamp=ch.timestamp,
            field_name=ch.field_name,
            old_value=ch.old_value,
            new_value=ch.new_value,
        ))
    return results
