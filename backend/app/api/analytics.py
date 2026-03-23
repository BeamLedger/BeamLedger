from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .deps import get_current_user
from ..models.user import User
from ..models.membership import Membership
from ..models.organization import Organization
from ..models.site import Site
from ..models.fixture import Fixture
from ..models.rule import Rule
from ..services.compliance import evaluate_fixture

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/organization/{org_id}")
def organization_analytics(org_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify membership
    membership = db.query(Membership).filter(Membership.organization_id == org_id, Membership.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized")
    rule = db.query(Rule).filter(Rule.organization_id == org_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="No compliance rule configured for organization")
    # Fetch fixtures for organization
    fixtures = db.query(Fixture).join(Site).filter(Site.organization_id == org_id).all()
    total = len(fixtures)
    pass_count = warn_count = fail_count = 0
    glare_risk = 0
    uplight_risk = 0
    for fx in fixtures:
        status_str, reasons = evaluate_fixture(fx, rule)
        if status_str == 'pass':
            pass_count += 1
        elif status_str == 'warn':
            warn_count += 1
        else:
            fail_count += 1
        # Identify risks
        if 'shielding' in reasons:
            glare_risk += 1
        if 'tilt' in reasons:
            uplight_risk += 1
    return {
        'total_fixtures': total,
        'pass': pass_count,
        'warn': warn_count,
        'fail': fail_count,
        'glare_risk': glare_risk,
        'uplight_risk': uplight_risk,
    }