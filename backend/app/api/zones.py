from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..schemas.zone import ZoneCreate, ZoneRead
from ..models.zone import Zone
from ..models.site import Site
from ..models.membership import Membership
from ..models.user import User
from ..database import get_db
from .deps import get_current_user


router = APIRouter(prefix="/zones", tags=["zones"])


def verify_site_membership(db: Session, site_id: int, user_id: int):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    membership = (
        db.query(Membership)
        .filter(Membership.organization_id == site.organization_id, Membership.user_id == user_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")


def get_zone_or_404(db: Session, zone_id: int) -> Zone:
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
    return zone


@router.get("/", response_model=List[ZoneRead])
def list_zones(site_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    verify_site_membership(db, site_id, current_user.id)
    zones = db.query(Zone).filter(Zone.site_id == site_id).all()
    return zones


@router.post("/", response_model=ZoneRead, status_code=status.HTTP_201_CREATED)
def create_zone(zone_in: ZoneCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    verify_site_membership(db, zone_in.site_id, current_user.id)
    zone = Zone(name=zone_in.name, description=zone_in.description, site_id=zone_in.site_id)
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.get("/{zone_id}", response_model=ZoneRead)
def read_zone(zone_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    zone = get_zone_or_404(db, zone_id)
    verify_site_membership(db, zone.site_id, current_user.id)
    return zone


@router.put("/{zone_id}", response_model=ZoneRead)
def update_zone(zone_id: int, zone_in: ZoneCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    zone = get_zone_or_404(db, zone_id)
    verify_site_membership(db, zone.site_id, current_user.id)
    zone.name = zone_in.name
    zone.description = zone_in.description
    zone.site_id = zone_in.site_id
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_zone(zone_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    zone = get_zone_or_404(db, zone_id)
    verify_site_membership(db, zone.site_id, current_user.id)
    db.delete(zone)
    db.commit()
    return