from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..schemas.site import SiteCreate, SiteRead
from ..models.site import Site
from ..models.organization import Organization
from ..models.membership import Membership
from ..models.user import User
from ..database import get_db
from .deps import get_current_user


router = APIRouter(prefix="/sites", tags=["sites"])


def verify_org_membership(db: Session, org_id: int, user_id: int):
    membership = (
        db.query(Membership)
        .filter(Membership.organization_id == org_id, Membership.user_id == user_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")


def get_site_or_404(db: Session, site_id: int) -> Site:
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    return site


@router.get("/", response_model=List[SiteRead])
def list_sites(organization_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    verify_org_membership(db, organization_id, current_user.id)
    sites = db.query(Site).filter(Site.organization_id == organization_id).all()
    return sites


@router.post("/", response_model=SiteRead, status_code=status.HTTP_201_CREATED)
def create_site(site_in: SiteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    verify_org_membership(db, site_in.organization_id, current_user.id)
    site = Site(name=site_in.name, description=site_in.description, organization_id=site_in.organization_id)
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@router.get("/{site_id}", response_model=SiteRead)
def read_site(site_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    site = get_site_or_404(db, site_id)
    verify_org_membership(db, site.organization_id, current_user.id)
    return site


@router.put("/{site_id}", response_model=SiteRead)
def update_site(site_id: int, site_in: SiteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    site = get_site_or_404(db, site_id)
    verify_org_membership(db, site.organization_id, current_user.id)
    site.name = site_in.name
    site.description = site_in.description
    db.commit()
    db.refresh(site)
    return site


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(site_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    site = get_site_or_404(db, site_id)
    verify_org_membership(db, site.organization_id, current_user.id)
    db.delete(site)
    db.commit()
    return