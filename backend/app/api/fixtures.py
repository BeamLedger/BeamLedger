from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from typing import List
from ..schemas.fixture import FixtureCreate, FixtureRead
from ..models.fixture import Fixture
from ..models.site import Site
from ..models.zone import Zone
from ..models.rule import Rule
from ..models.membership import Membership
from ..models.user import User
from ..database import get_db
from .deps import get_current_user
from ..services.compliance import evaluate_fixture
import csv
from io import StringIO, BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter


router = APIRouter(prefix="/fixtures", tags=["fixtures"])


def verify_fixture_membership(db: Session, fixture: Fixture, user_id: int):
    org_id = None
    if fixture.site_id:
        site = db.query(Site).filter(Site.id == fixture.site_id).first()
        org_id = site.organization_id
    elif fixture.zone_id:
        zone = db.query(Zone).filter(Zone.id == fixture.zone_id).first()
        site = db.query(Site).filter(Site.id == zone.site_id).first()
        org_id = site.organization_id
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fixture not associated with site or zone")
    membership = db.query(Membership).filter(Membership.organization_id == org_id, Membership.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this fixture")


def get_fixture_or_404(db: Session, fixture_id: int) -> Fixture:
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if not fixture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fixture not found")
    return fixture


def _get_org_id_for_fixture(db: Session, fixture: Fixture) -> int:
    if fixture.site_id:
        site = db.query(Site).filter(Site.id == fixture.site_id).first()
        return site.organization_id
    zone = db.query(Zone).filter(Zone.id == fixture.zone_id).first()
    site = db.query(Site).filter(Site.id == zone.site_id).first()
    return site.organization_id


# ── Collection routes ────────────────────────────────────────────────────────

@router.get("/", response_model=List[FixtureRead])
def list_fixtures(
    site_id: int = Query(None),
    zone_id: int = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if site_id is None and zone_id is None:
        raise HTTPException(status_code=400, detail="Either site_id or zone_id must be provided")
    if site_id:
        site = db.query(Site).filter(Site.id == site_id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        membership = db.query(Membership).filter(Membership.organization_id == site.organization_id, Membership.user_id == current_user.id).first()
        if not membership:
            raise HTTPException(status_code=403, detail="Not a member of this organization")
        fixtures = db.query(Fixture).filter(Fixture.site_id == site_id).all()
    else:
        zone = db.query(Zone).filter(Zone.id == zone_id).first()
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")
        site = db.query(Site).filter(Site.id == zone.site_id).first()
        membership = db.query(Membership).filter(Membership.organization_id == site.organization_id, Membership.user_id == current_user.id).first()
        if not membership:
            raise HTTPException(status_code=403, detail="Not a member of this organization")
        fixtures = db.query(Fixture).filter(Fixture.zone_id == zone_id).all()
    return fixtures


@router.post("/", response_model=FixtureRead, status_code=status.HTTP_201_CREATED)
def create_fixture(fixture_in: FixtureCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if fixture_in.site_id:
        site = db.query(Site).filter(Site.id == fixture_in.site_id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        org_id = site.organization_id
    elif fixture_in.zone_id:
        zone = db.query(Zone).filter(Zone.id == fixture_in.zone_id).first()
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")
        site = db.query(Site).filter(Site.id == zone.site_id).first()
        org_id = site.organization_id
    else:
        raise HTTPException(status_code=400, detail="Site_id or zone_id must be provided")
    membership = db.query(Membership).filter(Membership.organization_id == org_id, Membership.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    fixture = Fixture(**fixture_in.model_dump())
    db.add(fixture)
    db.commit()
    db.refresh(fixture)
    return fixture


# ── Static path routes (must be before /{fixture_id} to avoid path conflicts) ─

MAX_CSV_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_CSV_ROWS = 10_000


@router.post("/import-csv", status_code=status.HTTP_201_CREATED)
def import_fixtures(
    organization_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Import fixtures from a CSV file."""
    if file.content_type and file.content_type not in ("text/csv", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    membership = db.query(Membership).filter(Membership.organization_id == organization_id, Membership.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized")
    raw = file.file.read(MAX_CSV_SIZE + 1)
    if len(raw) > MAX_CSV_SIZE:
        raise HTTPException(status_code=400, detail=f"CSV file exceeds maximum size of {MAX_CSV_SIZE // (1024*1024)} MB")
    content = raw.decode('utf-8')
    reader = csv.DictReader(StringIO(content))
    imported = 0
    errors = []
    for idx, row in enumerate(reader, start=1):
        if idx > MAX_CSV_ROWS:
            errors.append({"row": idx, "error": f"Stopped: exceeded maximum of {MAX_CSV_ROWS} rows"})
            break
        try:
            site_id_val = row.get('site_id')
            zone_id_val = row.get('zone_id')
            site_id_int = None
            zone_id_int = None
            if site_id_val:
                site_id_int = int(site_id_val)
                site = db.query(Site).filter(Site.id == site_id_int).first()
                if not site or site.organization_id != organization_id:
                    raise ValueError(f"Invalid site_id {site_id_val}")
            elif zone_id_val:
                zone_id_int = int(zone_id_val)
                zone = db.query(Zone).filter(Zone.id == zone_id_int).first()
                if not zone:
                    raise ValueError(f"Invalid zone_id {zone_id_val}")
                site = db.query(Site).filter(Site.id == zone.site_id).first()
                if site.organization_id != organization_id:
                    raise ValueError("Zone not in organization")
            else:
                raise ValueError("Missing site_id or zone_id")
            fixture_data = {
                'asset_tag': row['asset_tag'],
                'fixture_type': row['fixture_type'],
                'manufacturer': row.get('manufacturer') or None,
                'model': row.get('model') or None,
                'wattage': float(row['wattage']) if row.get('wattage') else None,
                'lumens': float(row['lumens']) if row.get('lumens') else None,
                'cct': float(row['cct']) if row.get('cct') else None,
                'shielding': row.get('shielding') or None,
                'tilt': float(row['tilt']) if row.get('tilt') else None,
                'mount_height': float(row['mount_height']) if row.get('mount_height') else None,
                'uplight_rating': row.get('uplight_rating') or None,
                'bug_rating': row.get('bug_rating') or None,
                'installation_status': row.get('installation_status') or 'existing',
                'notes': row.get('notes') or None,
                'site_id': site_id_int,
                'zone_id': zone_id_int,
            }
            if db.query(Fixture).filter(Fixture.asset_tag == fixture_data['asset_tag']).first():
                raise ValueError(f"Asset tag {fixture_data['asset_tag']} already exists")
            fixture = Fixture(**fixture_data)
            db.add(fixture)
            db.commit()
            imported += 1
        except ValueError as e:
            db.rollback()
            errors.append({"row": idx, "error": str(e)})
        except Exception:
            db.rollback()
            errors.append({"row": idx, "error": "Failed to process row"})
    return {"imported": imported, "errors": errors}


@router.get("/export-csv")
def export_fixtures(
    organization_id: int = Query(None),
    site_id: int = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export fixtures as CSV. Must specify organization_id or site_id."""
    if not organization_id and not site_id:
        raise HTTPException(status_code=400, detail="organization_id or site_id must be provided")
    if site_id:
        site = db.query(Site).filter(Site.id == site_id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        membership = db.query(Membership).filter(Membership.organization_id == site.organization_id, Membership.user_id == current_user.id).first()
        if not membership:
            raise HTTPException(status_code=403, detail="Not authorized")
        fixtures = db.query(Fixture).filter(Fixture.site_id == site_id).all()
    else:
        membership = db.query(Membership).filter(Membership.organization_id == organization_id, Membership.user_id == current_user.id).first()
        if not membership:
            raise HTTPException(status_code=403, detail="Not authorized")
        fixtures = db.query(Fixture).join(Site).filter(Site.organization_id == organization_id).all()
    output = StringIO()
    fieldnames = [
        'id', 'asset_tag', 'fixture_type', 'manufacturer', 'model', 'wattage', 'lumens', 'cct',
        'shielding', 'tilt', 'mount_height', 'uplight_rating', 'bug_rating', 'installation_status',
        'notes', 'site_id', 'zone_id'
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for fx in fixtures:
        writer.writerow({
            'id': fx.id,
            'asset_tag': fx.asset_tag,
            'fixture_type': fx.fixture_type,
            'manufacturer': fx.manufacturer or '',
            'model': fx.model or '',
            'wattage': fx.wattage or '',
            'lumens': fx.lumens or '',
            'cct': fx.cct or '',
            'shielding': fx.shielding or '',
            'tilt': fx.tilt or '',
            'mount_height': fx.mount_height or '',
            'uplight_rating': fx.uplight_rating or '',
            'bug_rating': fx.bug_rating or '',
            'installation_status': fx.installation_status or '',
            'notes': fx.notes or '',
            'site_id': fx.site_id or '',
            'zone_id': fx.zone_id or '',
        })
    response = Response(content=output.getvalue(), media_type='text/csv')
    response.headers["Content-Disposition"] = "attachment; filename=fixtures.csv"
    return response


# ── Parameterized routes ─────────────────────────────────────────────────────

@router.get("/{fixture_id}", response_model=FixtureRead)
def read_fixture(fixture_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fixture = get_fixture_or_404(db, fixture_id)
    verify_fixture_membership(db, fixture, current_user.id)
    return fixture


@router.put("/{fixture_id}", response_model=FixtureRead)
def update_fixture(fixture_id: int, fixture_in: FixtureCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fixture = get_fixture_or_404(db, fixture_id)
    verify_fixture_membership(db, fixture, current_user.id)
    for field, value in fixture_in.model_dump().items():
        setattr(fixture, field, value)
    db.commit()
    db.refresh(fixture)
    return fixture


@router.delete("/{fixture_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fixture(fixture_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fixture = get_fixture_or_404(db, fixture_id)
    verify_fixture_membership(db, fixture, current_user.id)
    db.delete(fixture)
    db.commit()
    return


@router.get("/{fixture_id}/evaluate")
def evaluate_fixture_endpoint(fixture_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fixture = get_fixture_or_404(db, fixture_id)
    verify_fixture_membership(db, fixture, current_user.id)
    org_id = _get_org_id_for_fixture(db, fixture)
    rule = db.query(Rule).filter(Rule.organization_id == org_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="No compliance rule configured for organization")
    status_str, reasons = evaluate_fixture(fixture, rule)
    return {"status": status_str, "reasons": reasons}


@router.get("/{fixture_id}/report.pdf")
def download_fixture_report(
    fixture_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a PDF report for a fixture's compliance evaluation."""
    fixture = get_fixture_or_404(db, fixture_id)
    verify_fixture_membership(db, fixture, current_user.id)
    org_id = _get_org_id_for_fixture(db, fixture)
    rule = db.query(Rule).filter(Rule.organization_id == org_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="No compliance rule configured for organization")
    status_str, reasons = evaluate_fixture(fixture, rule)
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, "Fixture Report")
    y -= 30
    p.setFont("Helvetica", 12)
    fields = [
        ("Asset Tag", fixture.asset_tag),
        ("Type", fixture.fixture_type),
        ("Manufacturer", fixture.manufacturer),
        ("Model", fixture.model),
        ("Wattage", fixture.wattage),
        ("Lumens", fixture.lumens),
        ("CCT", fixture.cct),
        ("Shielding", fixture.shielding),
        ("Tilt", fixture.tilt),
        ("Mount Height", fixture.mount_height),
        ("Installation Status", fixture.installation_status),
    ]
    for name, value in fields:
        p.drawString(50, y, f"{name}: {value if value is not None else ''}")
        y -= 15
    p.drawString(50, y, f"Compliance Status: {status_str}")
    y -= 15
    p.drawString(50, y, "Reasons:")
    y -= 15
    for key, reason in reasons.items():
        p.drawString(60, y, f"- {key}: {reason}")
        y -= 15
    p.showPage()
    p.save()
    buffer.seek(0)
    return StreamingResponse(buffer, media_type='application/pdf', headers={"Content-Disposition": f"attachment; filename=fixture_{fixture_id}.pdf"})
