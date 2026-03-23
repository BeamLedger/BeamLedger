#!/usr/bin/env python
"""
Seed the database with demo data for Outdoor Lighting Compliance SaaS.
Run with:

    docker-compose exec backend python scripts/seed_data.py

or locally with `python backend/scripts/seed_data.py` after setting DATABASE_URL.
"""
import os
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.organization import Organization
from app.models.membership import Membership
from app.models.site import Site
from app.models.zone import Zone
from app.models.fixture import Fixture
from app.models.rule import Rule
from app.models.replacement import ReplacementPlan
from app.utils.security import hash_password


def seed(db: Session):
    # Drop and create tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Create user
    user = User(email="admin@example.com", full_name="Admin User", hashed_password=hash_password("password"))
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create organization and membership
    org = Organization(name="Demo Municipality", description="Example city lighting program")
    db.add(org)
    db.commit()
    db.refresh(org)

    membership = Membership(user_id=user.id, organization_id=org.id, role="owner")
    db.add(membership)
    db.commit()

    # Create default rule
    rule = Rule(
        organization_id=org.id,
        name="Demo Ordinance",
        max_cct=3000,
        max_lumens=2000,
        require_full_cutoff=True,
        max_tilt=10.0,
    )
    db.add(rule)
    db.commit()

    # Create sites and zones
    site1 = Site(name="Downtown", description="City center", organization_id=org.id)
    site2 = Site(name="Park", description="Community park", organization_id=org.id)
    db.add_all([site1, site2])
    db.commit()
    db.refresh(site1)
    db.refresh(site2)

    # Zones
    zone_a = Zone(name="Zone A", description="Central plaza", site_id=site1.id)
    zone_b = Zone(name="Zone B", description="North trail", site_id=site2.id)
    db.add_all([zone_a, zone_b])
    db.commit()
    db.refresh(zone_a)
    db.refresh(zone_b)

    # Fixtures
    fixtures = [
        Fixture(
            asset_tag="FX-001",
            fixture_type="Street Light",
            manufacturer="Acme",
            model="SL100",
            wattage=100,
            lumens=1500,
            cct=2700,
            shielding="full cutoff",
            tilt=5.0,
            mount_height=6.0,
            uplight_rating="U0",
            bug_rating="B1-U0-G1",
            installation_status="existing",
            site_id=site1.id,
            zone_id=zone_a.id,
            notes="Compliant fixture",
        ),
        Fixture(
            asset_tag="FX-002",
            fixture_type="Flood Light",
            manufacturer="BrightCo",
            model="FL200",
            wattage=200,
            lumens=3000,
            cct=5000,
            shielding="partial",
            tilt=20.0,
            mount_height=8.0,
            uplight_rating="U2",
            bug_rating="B3-U2-G2",
            installation_status="existing",
            site_id=site2.id,
            zone_id=zone_b.id,
            notes="Non-compliant fixture",
        ),
    ]
    db.add_all(fixtures)
    db.commit()

    # Create a replacement plan for the non-compliant fixture
    non_compliant_fixture = fixtures[1]
    plan = ReplacementPlan(
        fixture_id=non_compliant_fixture.id,
        proposed_type="LED Full Cutoff",
        estimated_wattage_reduction=100.0,
        estimated_cost=250.0,
        status="planned",
    )
    db.add(plan)
    db.commit()

    print("Seed data inserted successfully.")


def main():
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()