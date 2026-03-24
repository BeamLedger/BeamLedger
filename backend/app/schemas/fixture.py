from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class FixtureBase(BaseModel):
    asset_tag: str
    fixture_name: Optional[str] = None
    fixture_type: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    wattage: Optional[float] = None
    lumens: Optional[float] = None
    cct: Optional[float] = None
    cri: Optional[float] = None
    quantity: int = 1
    space_type: Optional[str] = None
    space_area: Optional[float] = None
    applicable_standards: Optional[str] = None
    shielding: Optional[str] = None
    tilt: Optional[float] = None
    mount_height: Optional[float] = None
    uplight_rating: Optional[str] = None
    bug_rating: Optional[str] = None
    installation_status: Optional[str] = None
    import_source: Optional[str] = "manual"
    notes: Optional[str] = None
    site_id: Optional[int] = None
    zone_id: Optional[int] = None


class FixtureCreate(FixtureBase):
    pass


class FixtureRead(FixtureBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    imported_at: Optional[datetime] = None


# ── Search / Filter schemas ──────────────────────────────────────────────────

class FixtureSearchParams(BaseModel):
    query: Optional[str] = None
    compliance_status: Optional[List[str]] = None  # pass/fail/exempt/data_error
    standards: Optional[List[str]] = None
    import_source: Optional[List[str]] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    sort_by: Optional[str] = "imported_at"  # compliance_score, imported_at, fixture_name
    sort_dir: Optional[str] = "desc"  # asc, desc
    page: int = 1
    page_size: int = 50


class FixtureSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    fixtures: List[FixtureRead]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Compliance result schemas ────────────────────────────────────────────────

class ComplianceResultSchema(BaseModel):
    id: str
    fixture_id: str
    standard: str
    standard_name: str
    code_section: str
    status: str
    allowed_lpd: Optional[float] = None
    calculated_lpd: Optional[float] = None
    delta: Optional[float] = None
    efficacy: Optional[float] = None
    min_efficacy: Optional[float] = None
    notes: str


class FixtureEvaluationSchema(BaseModel):
    fixture_id: str
    overall_status: str
    compliance_score: int
    results: List[ComplianceResultSchema]


# ── Import result schemas ────────────────────────────────────────────────────

class ImportRowError(BaseModel):
    row: int
    field: Optional[str] = None
    error: str
    severity: str = "error"  # "error" | "warning"


class ImportResult(BaseModel):
    imported: int
    skipped: int
    errors: List[ImportRowError]
    warnings: List[ImportRowError]
    audit_id: Optional[int] = None


class ImportAuditRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    timestamp: Optional[datetime] = None
    user_id: Optional[int] = None
    organization_id: Optional[int] = None
    file_name: str
    file_type: str
    row_count: int
    imported_count: int
    skipped_count: int
    error_count: int
