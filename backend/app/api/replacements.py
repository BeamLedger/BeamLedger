from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from ..schemas.replacement import ReplacementPlanCreate, ReplacementPlanRead
from ..models.replacement import ReplacementPlan
from ..models.fixture import Fixture
from ..models.site import Site
from ..models.zone import Zone
from ..models.membership import Membership
from ..models.user import User
from ..database import get_db
from .deps import get_current_user


router = APIRouter(prefix="/replacement-plans", tags=["replacement_plans"])


def get_org_id_from_fixture(db: Session, fixture: Fixture) -> int:
    if fixture.site_id:
        site = db.query(Site).filter(Site.id == fixture.site_id).first()
        return site.organization_id
    elif fixture.zone_id:
        zone = db.query(Zone).filter(Zone.id == fixture.zone_id).first()
        site = db.query(Site).filter(Site.id == zone.site_id).first()
        return site.organization_id
    raise HTTPException(status_code=400, detail="Fixture missing site and zone")


def verify_membership_for_fixture(db: Session, fixture: Fixture, user_id: int):
    org_id = get_org_id_from_fixture(db, fixture)
    membership = db.query(Membership).filter(Membership.organization_id == org_id, Membership.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to access fixture")


@router.get("/", response_model=List[ReplacementPlanRead])
def list_replacements(
    organization_id: int = Query(None),
    site_id: int = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(ReplacementPlan)
    if site_id:
        # filter by fixtures in site
        fixtures = db.query(Fixture).filter(Fixture.site_id == site_id).all()
        fixture_ids = [f.id for f in fixtures]
        query = query.filter(ReplacementPlan.fixture_id.in_(fixture_ids))
        # verify membership
        site = db.query(Site).filter(Site.id == site_id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        membership = db.query(Membership).filter(Membership.organization_id == site.organization_id, Membership.user_id == current_user.id).first()
        if not membership:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif organization_id:
        # filter by fixtures belonging to organization
        fixtures = db.query(Fixture).join(Site).filter(Site.organization_id == organization_id).all()
        fixture_ids = [f.id for f in fixtures]
        query = query.filter(ReplacementPlan.fixture_id.in_(fixture_ids))
        membership = db.query(Membership).filter(Membership.organization_id == organization_id, Membership.user_id == current_user.id).first()
        if not membership:
            raise HTTPException(status_code=403, detail="Not authorized")
    else:
        # return only user's organizations replacement plans
        memberships = db.query(Membership).filter(Membership.user_id == current_user.id).all()
        org_ids = [m.organization_id for m in memberships]
        fixtures = db.query(Fixture).join(Site).filter(Site.organization_id.in_(org_ids)).all()
        fixture_ids = [f.id for f in fixtures]
        query = query.filter(ReplacementPlan.fixture_id.in_(fixture_ids))
    return query.all()


@router.post("/", response_model=ReplacementPlanRead, status_code=status.HTTP_201_CREATED)
def create_replacement_plan(plan_in: ReplacementPlanCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fixture = db.query(Fixture).filter(Fixture.id == plan_in.fixture_id).first()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    verify_membership_for_fixture(db, fixture, current_user.id)
    plan = ReplacementPlan(**plan_in.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def get_plan_or_404(db: Session, plan_id: int) -> ReplacementPlan:
    plan = db.query(ReplacementPlan).filter(ReplacementPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Replacement plan not found")
    return plan


@router.put("/{plan_id}", response_model=ReplacementPlanRead)
def update_plan(plan_id: int, plan_in: ReplacementPlanCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = get_plan_or_404(db, plan_id)
    # verify membership based on fixture
    fixture = db.query(Fixture).filter(Fixture.id == plan.fixture_id).first()
    verify_membership_for_fixture(db, fixture, current_user.id)
    for field, value in plan_in.model_dump().items():
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    return plan