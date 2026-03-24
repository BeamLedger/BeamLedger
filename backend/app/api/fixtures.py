from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from ..schemas.fixture import (
    FixtureCreate, FixtureRead, FixtureSearchParams, FixtureSearchResult,
    FixtureEvaluationSchema, ComplianceResultSchema,
    ImportRowError, ImportResult, ImportAuditRead,
)
from ..models.fixture import Fixture
from ..models.site import Site
from ..models.zone import Zone
from ..models.rule import Rule
from ..models.membership import Membership
from ..models.user import User
from ..models.import_audit import ImportAudit
from ..database import get_db
from .deps import get_current_user
from ..services.compliance import evaluate_fixture
from ..services.compliance_engine import (
    FixtureData, evaluate_fixture_full, compute_overall_status, compute_compliance_score,
)
import csv
import json
import math
from io import StringIO, BytesIO
from datetime import datetime, timezone
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False


router = APIRouter(prefix="/fixtures", tags=["fixtures"])

MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_ROWS = 10_000

REQUIRED_IMPORT_COLUMNS = {"asset_tag", "fixture_type", "wattage", "lumens"}
OPTIONAL_IMPORT_COLUMNS = {
    "fixture_name", "manufacturer", "model", "cct", "cri", "quantity",
    "space_type", "space_area", "applicable_standards", "shielding", "tilt",
    "mount_height", "uplight_rating", "bug_rating", "installation_status",
    "notes", "site_id", "zone_id",
}
ALL_IMPORT_COLUMNS = REQUIRED_IMPORT_COLUMNS | OPTIONAL_IMPORT_COLUMNS


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


def _fixture_to_data(fixture: Fixture) -> FixtureData:
    standards = []
    if fixture.applicable_standards:
        standards = [s.strip() for s in fixture.applicable_standards.split(",") if s.strip()]
    return FixtureData(
        id=str(fixture.id),
        fixture_name=fixture.fixture_name or fixture.asset_tag,
        fixture_type=fixture.fixture_type or "",
        manufacturer=fixture.manufacturer or "",
        wattage=fixture.wattage,
        lumen_output=fixture.lumens,
        cct=fixture.cct,
        cri=fixture.cri,
        quantity=fixture.quantity or 1,
        space_type=fixture.space_type or "",
        space_area=fixture.space_area,
        applicable_standards=standards,
        import_source=fixture.import_source or "manual",
    )


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


# ── Search endpoint ──────────────────────────────────────────────────────────

@router.post("/search", response_model=FixtureSearchResult)
def search_fixtures(
    params: FixtureSearchParams,
    organization_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = db.query(Membership).filter(
        Membership.organization_id == organization_id,
        Membership.user_id == current_user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Base query: all fixtures in the organization
    query = db.query(Fixture).join(Site, Fixture.site_id == Site.id).filter(
        Site.organization_id == organization_id
    )

    # Text search across multiple fields
    if params.query and params.query.strip():
        search_term = f"%{params.query.strip()}%"
        query = query.filter(
            or_(
                Fixture.asset_tag.ilike(search_term),
                Fixture.fixture_name.ilike(search_term),
                Fixture.manufacturer.ilike(search_term),
                Fixture.fixture_type.ilike(search_term),
                Fixture.model.ilike(search_term),
                Fixture.space_type.ilike(search_term),
                Fixture.applicable_standards.ilike(search_term),
                Fixture.notes.ilike(search_term),
            )
        )

    # Filter by import source
    if params.import_source:
        query = query.filter(Fixture.import_source.in_(params.import_source))

    # Filter by standards
    if params.standards:
        std_filters = [Fixture.applicable_standards.ilike(f"%{s}%") for s in params.standards]
        query = query.filter(or_(*std_filters))

    # Filter by date range
    if params.date_from:
        try:
            dt_from = datetime.fromisoformat(params.date_from)
            query = query.filter(Fixture.imported_at >= dt_from)
        except ValueError:
            pass
    if params.date_to:
        try:
            dt_to = datetime.fromisoformat(params.date_to)
            query = query.filter(Fixture.imported_at <= dt_to)
        except ValueError:
            pass

    # Get total before pagination
    total = query.count()

    # Sorting
    sort_col = {
        "imported_at": Fixture.imported_at,
        "fixture_name": Fixture.fixture_name,
        "wattage": Fixture.wattage,
        "lumens": Fixture.lumens,
        "asset_tag": Fixture.asset_tag,
    }.get(params.sort_by, Fixture.imported_at)

    if params.sort_dir == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    # Pagination
    page_size = min(max(params.page_size, 1), 200)
    page = max(params.page, 1)
    total_pages = max(math.ceil(total / page_size), 1)
    offset = (page - 1) * page_size
    fixtures = query.offset(offset).limit(page_size).all()

    return FixtureSearchResult(
        fixtures=fixtures,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ── Import CSV/XLSX ──────────────────────────────────────────────────────────

def _parse_csv_rows(raw_bytes: bytes) -> tuple:
    """Parse CSV content. Returns (rows: list[dict], error: str|None)."""
    try:
        content = raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            content = raw_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            return [], "File encoding not supported. Use UTF-8."
    reader = csv.DictReader(StringIO(content))
    if not reader.fieldnames:
        return [], "CSV has no header row."
    rows = []
    for row in reader:
        rows.append(dict(row))
        if len(rows) > MAX_ROWS:
            break
    return rows, None


def _parse_xlsx_rows(raw_bytes: bytes) -> tuple:
    """Parse XLSX content. Returns (rows: list[dict], error: str|None)."""
    if not HAS_OPENPYXL:
        return [], "XLSX support requires the openpyxl library."
    try:
        wb = openpyxl.load_workbook(BytesIO(raw_bytes), read_only=True, data_only=True)
        ws = wb.active
        if ws is None:
            return [], "XLSX file has no active worksheet."
        row_iter = ws.iter_rows(values_only=True)
        headers_raw = next(row_iter, None)
        if not headers_raw:
            return [], "XLSX has no header row."
        headers = [str(h).strip().lower() if h else "" for h in headers_raw]
        rows = []
        for values in row_iter:
            row = {}
            for i, val in enumerate(values):
                if i < len(headers) and headers[i]:
                    row[headers[i]] = str(val).strip() if val is not None else ""
            rows.append(row)
            if len(rows) > MAX_ROWS:
                break
        wb.close()
        return rows, None
    except Exception as e:
        return [], f"Failed to parse XLSX: {str(e)}"


def _validate_row(
    idx: int,
    row: dict,
    db: Session,
    organization_id: int,
    seen_tags: set,
) -> tuple:
    """
    Validate a single import row. Returns (fixture_data: dict|None, errors: list, warnings: list).
    Rejects rows with missing required fields — never interpolates.
    """
    errors: List[ImportRowError] = []
    warnings: List[ImportRowError] = []

    # Required field checks
    asset_tag = row.get("asset_tag", "").strip()
    if not asset_tag:
        errors.append(ImportRowError(row=idx, field="asset_tag", error="Missing required field: asset_tag"))
    fixture_type = row.get("fixture_type", "").strip()
    if not fixture_type:
        errors.append(ImportRowError(row=idx, field="fixture_type", error="Missing required field: fixture_type"))

    # Numeric required fields
    wattage = None
    wattage_raw = row.get("wattage", "").strip()
    if not wattage_raw:
        errors.append(ImportRowError(row=idx, field="wattage", error="Missing required field: wattage"))
    else:
        try:
            wattage = float(wattage_raw)
            if wattage < 0:
                errors.append(ImportRowError(row=idx, field="wattage", error=f"Wattage must be non-negative, got {wattage}"))
            elif wattage > 100000:
                warnings.append(ImportRowError(row=idx, field="wattage", error=f"Unusually high wattage: {wattage}W", severity="warning"))
        except ValueError:
            errors.append(ImportRowError(row=idx, field="wattage", error=f"Invalid numeric value for wattage: '{wattage_raw}'"))

    lumens = None
    lumens_raw = row.get("lumens", "").strip()
    if not lumens_raw:
        errors.append(ImportRowError(row=idx, field="lumens", error="Missing required field: lumens"))
    else:
        try:
            lumens = float(lumens_raw)
            if lumens < 0:
                errors.append(ImportRowError(row=idx, field="lumens", error=f"Lumens must be non-negative, got {lumens}"))
        except ValueError:
            errors.append(ImportRowError(row=idx, field="lumens", error=f"Invalid numeric value for lumens: '{lumens_raw}'"))

    # Duplicate asset_tag check
    if asset_tag:
        if asset_tag in seen_tags:
            errors.append(ImportRowError(row=idx, field="asset_tag", error=f"Duplicate asset_tag in file: '{asset_tag}'"))
        elif db.query(Fixture).filter(Fixture.asset_tag == asset_tag).first():
            errors.append(ImportRowError(row=idx, field="asset_tag", error=f"Asset tag '{asset_tag}' already exists in database"))
        else:
            seen_tags.add(asset_tag)

    # Site/zone validation
    site_id_val = row.get("site_id", "").strip()
    zone_id_val = row.get("zone_id", "").strip()
    site_id_int = None
    zone_id_int = None

    if site_id_val:
        try:
            site_id_int = int(site_id_val)
            site = db.query(Site).filter(Site.id == site_id_int).first()
            if not site or site.organization_id != organization_id:
                errors.append(ImportRowError(row=idx, field="site_id", error=f"Invalid site_id {site_id_val} for this organization"))
                site_id_int = None
        except ValueError:
            errors.append(ImportRowError(row=idx, field="site_id", error=f"Invalid site_id: '{site_id_val}'"))
    elif zone_id_val:
        try:
            zone_id_int = int(zone_id_val)
            zone = db.query(Zone).filter(Zone.id == zone_id_int).first()
            if not zone:
                errors.append(ImportRowError(row=idx, field="zone_id", error=f"Invalid zone_id {zone_id_val}"))
                zone_id_int = None
            else:
                site = db.query(Site).filter(Site.id == zone.site_id).first()
                if site.organization_id != organization_id:
                    errors.append(ImportRowError(row=idx, field="zone_id", error="Zone not in organization"))
                    zone_id_int = None
        except ValueError:
            errors.append(ImportRowError(row=idx, field="zone_id", error=f"Invalid zone_id: '{zone_id_val}'"))
    else:
        errors.append(ImportRowError(row=idx, field="site_id", error="Missing site_id or zone_id"))

    # Optional numeric fields
    def parse_optional_float(field_name: str) -> Optional[float]:
        raw = row.get(field_name, "").strip()
        if not raw or raw.lower() == "none":
            return None
        try:
            return float(raw)
        except ValueError:
            warnings.append(ImportRowError(row=idx, field=field_name, error=f"Invalid numeric value for {field_name}: '{raw}'", severity="warning"))
            return None

    def parse_optional_int(field_name: str, default: int = 1) -> int:
        raw = row.get(field_name, "").strip()
        if not raw or raw.lower() == "none":
            return default
        try:
            return int(float(raw))
        except ValueError:
            warnings.append(ImportRowError(row=idx, field=field_name, error=f"Invalid integer for {field_name}: '{raw}', using default {default}", severity="warning"))
            return default

    # Space type + applicable_standards warning if missing
    space_type = row.get("space_type", "").strip() or None
    applicable_standards = row.get("applicable_standards", "").strip() or None
    if not space_type:
        warnings.append(ImportRowError(row=idx, field="space_type", error="Missing space_type — LPD compliance cannot be evaluated", severity="warning"))
    if not applicable_standards:
        warnings.append(ImportRowError(row=idx, field="applicable_standards", error="Missing applicable_standards — no compliance evaluation will be performed", severity="warning"))

    if errors:
        return None, errors, warnings

    fixture_data = {
        "asset_tag": asset_tag,
        "fixture_name": row.get("fixture_name", "").strip() or None,
        "fixture_type": fixture_type,
        "manufacturer": row.get("manufacturer", "").strip() or None,
        "model": row.get("model", "").strip() or None,
        "wattage": wattage,
        "lumens": lumens,
        "cct": parse_optional_float("cct"),
        "cri": parse_optional_float("cri"),
        "quantity": parse_optional_int("quantity", 1),
        "space_type": space_type,
        "space_area": parse_optional_float("space_area"),
        "applicable_standards": applicable_standards,
        "shielding": row.get("shielding", "").strip() or None,
        "tilt": parse_optional_float("tilt"),
        "mount_height": parse_optional_float("mount_height"),
        "uplight_rating": row.get("uplight_rating", "").strip() or None,
        "bug_rating": row.get("bug_rating", "").strip() or None,
        "installation_status": row.get("installation_status", "").strip() or "existing",
        "notes": row.get("notes", "").strip() or None,
        "site_id": site_id_int,
        "zone_id": zone_id_int,
    }

    return fixture_data, errors, warnings


@router.post("/import", status_code=status.HTTP_201_CREATED, response_model=ImportResult)
def import_fixtures(
    organization_id: int = Query(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Import fixtures from CSV or XLSX with full validation and audit logging."""
    membership = db.query(Membership).filter(
        Membership.organization_id == organization_id,
        Membership.user_id == current_user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Determine file type
    filename = file.filename or "unknown"
    is_xlsx = filename.lower().endswith(".xlsx")
    is_csv = filename.lower().endswith(".csv")
    if not is_csv and not is_xlsx:
        ct = file.content_type or ""
        if "spreadsheet" in ct or "xlsx" in ct:
            is_xlsx = True
        elif "csv" in ct or "text" in ct:
            is_csv = True
        else:
            raise HTTPException(status_code=400, detail="File must be CSV or XLSX")

    # Read file
    raw = file.file.read(MAX_UPLOAD_SIZE + 1)
    if len(raw) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum size of {MAX_UPLOAD_SIZE // (1024*1024)} MB")

    # Parse
    if is_xlsx:
        rows, parse_error = _parse_xlsx_rows(raw)
        file_type = "xlsx"
    else:
        rows, parse_error = _parse_csv_rows(raw)
        file_type = "csv"

    if parse_error:
        raise HTTPException(status_code=400, detail=parse_error)

    if len(rows) > MAX_ROWS:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum of {MAX_ROWS} rows")

    if not rows:
        raise HTTPException(status_code=400, detail="File contains no data rows")

    # Validate column schema
    first_row_keys = {k.strip().lower() for k in rows[0].keys() if k}
    missing_required = REQUIRED_IMPORT_COLUMNS - first_row_keys
    if missing_required:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(sorted(missing_required))}. Required: {', '.join(sorted(REQUIRED_IMPORT_COLUMNS))}",
        )

    # Process rows
    imported = 0
    skipped = 0
    all_errors: List[ImportRowError] = []
    all_warnings: List[ImportRowError] = []
    seen_tags: set = set()

    for idx, row in enumerate(rows, start=1):
        # Normalize keys
        normalized = {k.strip().lower(): v for k, v in row.items() if k}

        fixture_data, row_errors, row_warnings = _validate_row(idx, normalized, db, organization_id, seen_tags)
        all_warnings.extend(row_warnings)

        if row_errors:
            all_errors.extend(row_errors)
            skipped += 1
            continue

        try:
            fixture_data["import_source"] = file_type
            fixture_data["imported_at"] = datetime.now(timezone.utc)
            fixture = Fixture(**fixture_data)
            db.add(fixture)
            db.flush()
            imported += 1
        except Exception as e:
            db.rollback()
            all_errors.append(ImportRowError(row=idx, error=f"Database error: {str(e)}"))
            skipped += 1

    # Commit all successful rows
    if imported > 0:
        db.commit()

    # Create audit log
    audit = ImportAudit(
        user_id=current_user.id,
        organization_id=organization_id,
        file_name=filename,
        file_type=file_type,
        row_count=len(rows),
        imported_count=imported,
        skipped_count=skipped,
        error_count=len(all_errors),
        error_details=json.dumps([e.model_dump() for e in all_errors[:500]]) if all_errors else None,
    )
    db.add(audit)
    db.commit()

    return ImportResult(
        imported=imported,
        skipped=skipped,
        errors=all_errors,
        warnings=all_warnings,
        audit_id=audit.id,
    )


# Keep legacy endpoint for backward compatibility
@router.post("/import-csv", status_code=status.HTTP_201_CREATED)
def import_fixtures_csv_legacy(
    organization_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Legacy CSV import endpoint. Redirects to new import pipeline."""
    return import_fixtures(organization_id=organization_id, file=file, current_user=current_user, db=db)


# ── Error report download ────────────────────────────────────────────────────

@router.get("/import-audit/{audit_id}/error-report")
def download_error_report(
    audit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download a CSV error report for a specific import audit."""
    audit = db.query(ImportAudit).filter(ImportAudit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Import audit not found")

    membership = db.query(Membership).filter(
        Membership.organization_id == audit.organization_id,
        Membership.user_id == current_user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized")

    errors = []
    if audit.error_details:
        try:
            errors = json.loads(audit.error_details)
        except json.JSONDecodeError:
            errors = []

    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=["row", "field", "error", "severity"])
    writer.writeheader()
    for err in errors:
        writer.writerow({
            "row": err.get("row", ""),
            "field": err.get("field", ""),
            "error": err.get("error", ""),
            "severity": err.get("severity", "error"),
        })

    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=import_errors_{audit_id}.csv"
    return response


# ── Import audit log ─────────────────────────────────────────────────────────

@router.get("/import-audits", response_model=List[ImportAuditRead])
def list_import_audits(
    organization_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = db.query(Membership).filter(
        Membership.organization_id == organization_id,
        Membership.user_id == current_user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized")

    audits = (
        db.query(ImportAudit)
        .filter(ImportAudit.organization_id == organization_id)
        .order_by(ImportAudit.timestamp.desc())
        .limit(100)
        .all()
    )
    return audits


# ── Export CSV ────────────────────────────────────────────────────────────────

@router.get("/export-csv")
def export_fixtures(
    organization_id: int = Query(None),
    site_id: int = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
        "id", "asset_tag", "fixture_name", "fixture_type", "manufacturer", "model",
        "wattage", "lumens", "cct", "cri", "quantity", "space_type", "space_area",
        "applicable_standards", "shielding", "tilt", "mount_height", "uplight_rating",
        "bug_rating", "installation_status", "import_source", "imported_at", "notes",
        "site_id", "zone_id",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for fx in fixtures:
        writer.writerow({f: getattr(fx, f, "") or "" for f in fieldnames})

    response = Response(content=output.getvalue(), media_type="text/csv")
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


# ── Compliance evaluation ────────────────────────────────────────────────────

@router.get("/{fixture_id}/evaluate", response_model=FixtureEvaluationSchema)
def evaluate_fixture_endpoint(
    fixture_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fixture = get_fixture_or_404(db, fixture_id)
    verify_fixture_membership(db, fixture, current_user.id)

    fixture_data = _fixture_to_data(fixture)

    if not fixture_data.applicable_standards:
        # Fallback to legacy rule-based evaluation
        org_id = _get_org_id_for_fixture(db, fixture)
        rule = db.query(Rule).filter(Rule.organization_id == org_id).first()
        if rule:
            status_str, reasons = evaluate_fixture(fixture, rule)
            results = [ComplianceResultSchema(
                id=f"{fixture.id}_legacy",
                fixture_id=str(fixture.id),
                standard="LEGACY",
                standard_name="Organization Rule",
                code_section="Custom Rule",
                status="pass" if status_str == "pass" else "fail",
                notes="; ".join(f"{k}: {v}" for k, v in reasons.items()) if reasons else "All checks passed.",
            )]
            return FixtureEvaluationSchema(
                fixture_id=str(fixture.id),
                overall_status=status_str,
                compliance_score=100 if status_str == "pass" else 0,
                results=results,
            )

    results = evaluate_fixture_full(fixture_data)
    overall = compute_overall_status(results)
    score = compute_compliance_score(results)

    return FixtureEvaluationSchema(
        fixture_id=str(fixture.id),
        overall_status=overall,
        compliance_score=score,
        results=[
            ComplianceResultSchema(
                id=r.id,
                fixture_id=r.fixture_id,
                standard=r.standard,
                standard_name=r.standard_name,
                code_section=r.code_section,
                status=r.status,
                allowed_lpd=r.allowed_lpd,
                calculated_lpd=r.calculated_lpd,
                delta=r.delta,
                efficacy=r.efficacy,
                min_efficacy=r.min_efficacy,
                notes=r.notes,
            )
            for r in results
        ],
    )


# ── Batch evaluation ─────────────────────────────────────────────────────────

@router.post("/evaluate-batch")
def evaluate_batch(
    organization_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Evaluate all fixtures in an organization."""
    membership = db.query(Membership).filter(
        Membership.organization_id == organization_id,
        Membership.user_id == current_user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized")

    fixtures = db.query(Fixture).join(Site).filter(Site.organization_id == organization_id).all()
    evaluations = []
    for fx in fixtures:
        fd = _fixture_to_data(fx)
        if not fd.applicable_standards:
            continue
        results = evaluate_fixture_full(fd)
        overall = compute_overall_status(results)
        score = compute_compliance_score(results)
        evaluations.append({
            "fixture_id": str(fx.id),
            "asset_tag": fx.asset_tag,
            "fixture_name": fx.fixture_name,
            "overall_status": overall,
            "compliance_score": score,
            "results": [
                {
                    "id": r.id,
                    "standard": r.standard,
                    "standard_name": r.standard_name,
                    "code_section": r.code_section,
                    "status": r.status,
                    "allowed_lpd": r.allowed_lpd,
                    "calculated_lpd": r.calculated_lpd,
                    "delta": r.delta,
                    "efficacy": r.efficacy,
                    "min_efficacy": r.min_efficacy,
                    "notes": r.notes,
                }
                for r in results
            ],
        })

    return {"evaluations": evaluations, "total": len(evaluations)}


# ── PDF Report ────────────────────────────────────────────────────────────────

@router.get("/{fixture_id}/report.pdf")
def download_fixture_report(
    fixture_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fixture = get_fixture_or_404(db, fixture_id)
    verify_fixture_membership(db, fixture, current_user.id)

    fixture_data = _fixture_to_data(fixture)
    results = evaluate_fixture_full(fixture_data) if fixture_data.applicable_standards else []
    overall = compute_overall_status(results) if results else "N/A"

    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50

    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, "Fixture Compliance Report")
    y -= 30

    p.setFont("Helvetica", 12)
    fields = [
        ("Asset Tag", fixture.asset_tag),
        ("Name", fixture.fixture_name),
        ("Type", fixture.fixture_type),
        ("Manufacturer", fixture.manufacturer),
        ("Model", fixture.model),
        ("Wattage", fixture.wattage),
        ("Lumens", fixture.lumens),
        ("CCT", fixture.cct),
        ("CRI", fixture.cri),
        ("Quantity", fixture.quantity),
        ("Space Type", fixture.space_type),
        ("Space Area (ft²)", fixture.space_area),
        ("Standards", fixture.applicable_standards),
        ("Overall Status", overall.upper()),
    ]
    for name, value in fields:
        p.drawString(50, y, f"{name}: {value if value is not None else ''}")
        y -= 15

    y -= 10
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Compliance Results:")
    y -= 15
    p.setFont("Helvetica", 10)

    for r in results:
        if y < 60:
            p.showPage()
            y = height - 50
            p.setFont("Helvetica", 10)
        p.drawString(60, y, f"[{r.status.upper()}] {r.standard_name} — {r.code_section}")
        y -= 12
        # Wrap notes
        notes = r.notes
        while notes and y > 40:
            line = notes[:100]
            p.drawString(70, y, line)
            notes = notes[100:]
            y -= 12
        y -= 5

    p.showPage()
    p.save()
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=fixture_{fixture_id}_report.pdf"},
    )
