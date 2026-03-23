from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..schemas.rule import RuleCreate, RuleRead
from ..models.rule import Rule
from ..models.membership import Membership
from ..models.user import User
from ..database import get_db
from .deps import get_current_user


router = APIRouter(prefix="/rules", tags=["rules"])


def verify_org_membership(db: Session, org_id: int, user_id: int):
    membership = db.query(Membership).filter(Membership.organization_id == org_id, Membership.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")


@router.get("/", response_model=List[RuleRead])
def list_rules(organization_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    verify_org_membership(db, organization_id, current_user.id)
    rules = db.query(Rule).filter(Rule.organization_id == organization_id).all()
    return rules


@router.post("/", response_model=RuleRead, status_code=status.HTTP_201_CREATED)
def create_rule(rule_in: RuleCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    verify_org_membership(db, rule_in.organization_id, current_user.id)
    rule = Rule(**rule_in.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def get_rule_or_404(db: Session, rule_id: int) -> Rule:
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.put("/{rule_id}", response_model=RuleRead)
def update_rule(rule_id: int, rule_in: RuleCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rule = get_rule_or_404(db, rule_id)
    verify_org_membership(db, rule.organization_id, current_user.id)
    for field, value in rule_in.model_dump().items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(rule_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rule = get_rule_or_404(db, rule_id)
    verify_org_membership(db, rule.organization_id, current_user.id)
    db.delete(rule)
    db.commit()
    return