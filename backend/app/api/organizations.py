from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..schemas.organization import OrganizationCreate, OrganizationRead
from ..models.organization import Organization
from ..models.membership import Membership
from ..models.user import User
from ..database import get_db
from .deps import get_current_user


router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/", response_model=List[OrganizationRead])
def list_organizations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orgs = (
        db.query(Organization)
        .join(Membership)
        .filter(Membership.user_id == current_user.id)
        .all()
    )
    return orgs


@router.post("/", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
def create_organization(org_in: OrganizationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = Organization(name=org_in.name, description=org_in.description)
    db.add(org)
    db.commit()
    db.refresh(org)
    # Add membership as owner
    membership = Membership(user_id=current_user.id, organization_id=org.id, role="owner")
    db.add(membership)
    db.commit()
    return org


def get_organization_or_404(db: Session, org_id: int) -> Organization:
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org


def verify_user_membership(db: Session, org_id: int, user_id: int):
    membership = (
        db.query(Membership)
        .filter(Membership.organization_id == org_id, Membership.user_id == user_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")


@router.get("/{org_id}", response_model=OrganizationRead)
def read_organization(org_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = get_organization_or_404(db, org_id)
    verify_user_membership(db, org_id, current_user.id)
    return org


@router.put("/{org_id}", response_model=OrganizationRead)
def update_organization(org_id: int, org_in: OrganizationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = get_organization_or_404(db, org_id)
    verify_user_membership(db, org_id, current_user.id)
    org.name = org_in.name
    org.description = org_in.description
    db.commit()
    db.refresh(org)
    return org


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization(org_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = get_organization_or_404(db, org_id)
    verify_user_membership(db, org_id, current_user.id)
    db.delete(org)
    db.commit()
    return