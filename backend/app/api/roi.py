"""ROI Calculator & Cost-to-Comply endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from ..database import get_db
from .deps import get_current_user
from ..models.user import User
from ..models.membership import Membership
from ..models.fixture import Fixture
from ..models.site import Site
from ..services.cost_estimator import (
    estimate_fixture_cost, calculate_site_roi,
    get_all_pricing, get_pricing_for_type,
    FixtureCostEstimate, SiteROISummary, FixturePricing,
    DEFAULT_UTILITY_RATE, DEFAULT_ANNUAL_HOURS,
)
from ..services.compliance_engine import (
    FixtureData, evaluate_fixture_full, compute_overall_status,
)

router = APIRouter(prefix="/roi", tags=["roi"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class FixtureCostResponse(BaseModel):
    fixture_id: str
    fixture_type: str
    fixture_name: str
    current_wattage: float
    replacement_wattage: float
    quantity: int
    replacement_cost_min: float
    replacement_cost_max: float
    replacement_cost_avg: float
    annual_energy_current_kwh: float
    annual_energy_replacement_kwh: float
    annual_energy_savings_kwh: float
    annual_cost_current: float
    annual_cost_replacement: float
    annual_savings: float
    payback_years: Optional[float]
    dlc_listed: bool
    rebate_eligible: bool
    estimated_rebate_min: float
    estimated_rebate_max: float


class SiteROIResponse(BaseModel):
    total_fixtures: int
    failing_fixtures: int
    total_replacement_cost_min: float
    total_replacement_cost_max: float
    total_replacement_cost_avg: float
    total_annual_energy_current_kwh: float
    total_annual_energy_replacement_kwh: float
    total_annual_energy_savings_kwh: float
    total_annual_cost_current: float
    total_annual_cost_replacement: float
    total_annual_savings: float
    avg_payback_years: Optional[float]
    rebate_eligible_count: int
    estimated_total_rebate_min: float
    estimated_total_rebate_max: float
    fixture_estimates: List[FixtureCostResponse]


class PricingResponse(BaseModel):
    fixture_type: str
    min_price: float
    max_price: float
    avg_price: float
    typical_wattage: float
    dlc_listed: bool


class ROICalcRequest(BaseModel):
    utility_rate: float = DEFAULT_UTILITY_RATE
    annual_hours: float = DEFAULT_ANNUAL_HOURS


# ── Helpers ──────────────────────────────────────────────────────────────────

def _verify_org_member(db: Session, org_id: int, user_id: int):
    m = db.query(Membership).filter(
        Membership.organization_id == org_id,
        Membership.user_id == user_id,
    ).first()
    if not m:
        raise HTTPException(status_code=403, detail="Not a member of this organization")


def _fixture_to_data(f: Fixture) -> FixtureData:
    standards = []
    if f.applicable_standards:
        standards = [s.strip() for s in f.applicable_standards.split(",") if s.strip()]
    return FixtureData(
        fixture_id=str(f.id),
        fixture_type=f.fixture_type or "",
        wattage=f.wattage,
        lumen_output=f.lumens,
        cct=f.cct,
        cri=f.cri,
        quantity=f.quantity or 1,
        space_type=f.space_type,
        space_area=f.space_area,
        applicable_standards=standards,
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/pricing", response_model=List[PricingResponse])
def list_pricing(user: User = Depends(get_current_user)):
    """Get the built-in fixture pricing database."""
    return [
        PricingResponse(
            fixture_type=p.fixture_type,
            min_price=p.min_price,
            max_price=p.max_price,
            avg_price=p.avg_price,
            typical_wattage=p.typical_wattage,
            dlc_listed=p.dlc_listed,
        )
        for p in get_all_pricing()
    ]


@router.post("/site/{site_id}", response_model=SiteROIResponse)
def calculate_site_roi_endpoint(
    site_id: int,
    body: ROICalcRequest = ROICalcRequest(),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Calculate ROI for all failing fixtures at a site."""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    _verify_org_member(db, site.organization_id, user.id)

    fixtures = db.query(Fixture).filter(Fixture.site_id == site_id).all()
    total_count = len(fixtures)

    # Evaluate compliance and collect failing fixtures
    failing = []
    for f in fixtures:
        fd = _fixture_to_data(f)
        results = evaluate_fixture_full(fd)
        overall = compute_overall_status(results)
        if overall == "fail":
            failing.append({
                "fixture_id": str(f.id),
                "fixture_type": f.fixture_type or "Other",
                "fixture_name": f.fixture_name or f.fixture_type or "Unknown",
                "wattage": f.wattage or 0,
                "quantity": f.quantity or 1,
            })

    summary = calculate_site_roi(
        failing_fixtures=failing,
        total_fixture_count=total_count,
        utility_rate=body.utility_rate,
        annual_hours=body.annual_hours,
    )

    return SiteROIResponse(
        total_fixtures=summary.total_fixtures,
        failing_fixtures=summary.failing_fixtures,
        total_replacement_cost_min=summary.total_replacement_cost_min,
        total_replacement_cost_max=summary.total_replacement_cost_max,
        total_replacement_cost_avg=summary.total_replacement_cost_avg,
        total_annual_energy_current_kwh=summary.total_annual_energy_current_kwh,
        total_annual_energy_replacement_kwh=summary.total_annual_energy_replacement_kwh,
        total_annual_energy_savings_kwh=summary.total_annual_energy_savings_kwh,
        total_annual_cost_current=summary.total_annual_cost_current,
        total_annual_cost_replacement=summary.total_annual_cost_replacement,
        total_annual_savings=summary.total_annual_savings,
        avg_payback_years=summary.avg_payback_years,
        rebate_eligible_count=summary.rebate_eligible_count,
        estimated_total_rebate_min=summary.estimated_total_rebate_min,
        estimated_total_rebate_max=summary.estimated_total_rebate_max,
        fixture_estimates=[
            FixtureCostResponse(
                fixture_id=e.fixture_id,
                fixture_type=e.fixture_type,
                fixture_name=e.fixture_name,
                current_wattage=e.current_wattage,
                replacement_wattage=e.replacement_wattage,
                quantity=e.quantity,
                replacement_cost_min=e.replacement_cost_min,
                replacement_cost_max=e.replacement_cost_max,
                replacement_cost_avg=e.replacement_cost_avg,
                annual_energy_current_kwh=e.annual_energy_current_kwh,
                annual_energy_replacement_kwh=e.annual_energy_replacement_kwh,
                annual_energy_savings_kwh=e.annual_energy_savings_kwh,
                annual_cost_current=e.annual_cost_current,
                annual_cost_replacement=e.annual_cost_replacement,
                annual_savings=e.annual_savings,
                payback_years=e.payback_years,
                dlc_listed=e.dlc_listed,
                rebate_eligible=e.rebate_eligible,
                estimated_rebate_min=e.estimated_rebate_min,
                estimated_rebate_max=e.estimated_rebate_max,
            )
            for e in summary.fixture_estimates
        ],
    )
