import io
import csv
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.utils.security import hash_password
from app.models.user import User
from app.models.organization import Organization
from app.models.membership import Membership
from app.models.site import Site


@pytest.fixture(scope="module")
def client_with_data():
    # Reset DB
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Create user
    user = User(email="u@example.com", full_name="User", hashed_password=hash_password("password"))
    db.add(user)
    db.commit()
    db.refresh(user)
    # Create org and membership
    org = Organization(name="Org", description="Test org")
    db.add(org)
    db.commit()
    db.refresh(org)
    membership = Membership(user_id=user.id, organization_id=org.id, role="owner")
    db.add(membership)
    db.commit()
    # Create site
    site = Site(name="Site", description="", organization_id=org.id)
    db.add(site)
    db.commit()
    db.refresh(site)
    org_id = org.id
    site_id = site.id
    db.close()
    with TestClient(app) as c:
        # Authenticate user
        res = c.post("/auth/token", data={"username": "u@example.com", "password": "password"})
        token = res.json()["access_token"]
        c.headers.update({"Authorization": f"Bearer {token}"})
        yield c, org_id, site_id


def test_csv_import_export(client_with_data):
    client, org_id, site_id = client_with_data
    # Create CSV content
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        'asset_tag','fixture_type','manufacturer','model','wattage','lumens','cct','shielding','tilt','mount_height','uplight_rating','bug_rating','installation_status','notes','site_id','zone_id'
    ])
    writer.writeheader()
    writer.writerow({
        'asset_tag': 'IMP-001',
        'fixture_type': 'Test',
        'manufacturer': 'ACME',
        'model': 'ModelX',
        'wattage': '50',
        'lumens': '500',
        'cct': '2700',
        'shielding': 'full cutoff',
        'tilt': '0',
        'mount_height': '5',
        'uplight_rating': 'U0',
        'bug_rating': 'B1-U0-G1',
        'installation_status': 'existing',
        'notes': 'Imported',
        'site_id': str(site_id),
        'zone_id': ''
    })
    csv_bytes = io.BytesIO(output.getvalue().encode('utf-8'))
    files = {'file': ('fixtures.csv', csv_bytes, 'text/csv')}
    res = client.post(f"/fixtures/import-csv?organization_id={org_id}", files=files)
    assert res.status_code == 201
    data = res.json()
    assert data['imported'] == 1
    # Export CSV
    res = client.get(f"/fixtures/export-csv?site_id={site_id}")
    assert res.status_code == 200
    assert 'text/csv' in res.headers['content-type']