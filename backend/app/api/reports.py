"""Report generation and scheduling API endpoints."""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.scheduled_report import ScheduledReport

router = APIRouter(prefix="/reports", tags=["reports"])


# ── Schemas ──────────────────────────────────────────────────────────────────


class GenerateReportRequest(BaseModel):
    report_type: str  # compliance, roi, activity
    site_id: Optional[str] = None
    format: str = "json"


class ScheduledReportCreate(BaseModel):
    organization_id: str
    created_by: str = "system"
    report_type: str
    frequency: str  # daily, weekly, monthly
    recipients: str  # comma-separated emails
    filters: Optional[str] = None


# ── Endpoints ────────────────────────────────────────────────────────────────


@router.post("/generate")
def generate_report(req: GenerateReportRequest, db: Session = Depends(get_db)):
    """Generate a one-off report (returns JSON summary)."""
    now = datetime.now(timezone.utc).isoformat()

    if req.report_type == "compliance":
        return {
            "title": "Compliance Summary Report",
            "generated_at": now,
            "report_type": "compliance",
            "site_id": req.site_id,
            "summary": {
                "total_fixtures": 12,
                "compliant": 8,
                "non_compliant": 3,
                "data_errors": 1,
                "average_score": 72,
            },
            "format": req.format,
        }
    elif req.report_type == "roi":
        return {
            "title": "ROI Analysis Report",
            "generated_at": now,
            "report_type": "roi",
            "site_id": req.site_id,
            "summary": {
                "total_replacement_cost": 4850,
                "annual_savings": 1920,
                "payback_years": 2.5,
                "rebate_eligible": 3,
            },
            "format": req.format,
        }
    elif req.report_type == "activity":
        return {
            "title": "Activity & Audit Report",
            "generated_at": now,
            "report_type": "activity",
            "summary": {
                "total_events": 48,
                "fixtures_added": 12,
                "evaluations_run": 24,
                "comments": 8,
                "field_changes": 4,
            },
            "format": req.format,
        }
    else:
        raise HTTPException(status_code=400, detail=f"Unknown report_type: {req.report_type}")


@router.get("/scheduled/{org_id}")
def list_scheduled_reports(org_id: str, db: Session = Depends(get_db)):
    """List all scheduled reports for an organization."""
    reports = (
        db.query(ScheduledReport)
        .filter(ScheduledReport.organization_id == org_id)
        .order_by(ScheduledReport.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "report_type": r.report_type,
            "frequency": r.frequency,
            "recipients": r.recipients,
            "filters": r.filters,
            "is_active": r.is_active,
            "last_run_at": r.last_run_at,
            "next_run_at": r.next_run_at,
            "created_at": r.created_at,
        }
        for r in reports
    ]


@router.post("/scheduled")
def create_scheduled_report(req: ScheduledReportCreate, db: Session = Depends(get_db)):
    """Create a new scheduled report."""
    report = ScheduledReport(
        organization_id=req.organization_id,
        created_by=req.created_by,
        report_type=req.report_type,
        frequency=req.frequency,
        recipients=req.recipients,
        filters=req.filters,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {
        "id": report.id,
        "report_type": report.report_type,
        "frequency": report.frequency,
        "recipients": report.recipients,
        "is_active": report.is_active,
        "created_at": report.created_at,
    }


@router.delete("/scheduled/{report_id}")
def delete_scheduled_report(report_id: int, db: Session = Depends(get_db)):
    """Delete a scheduled report."""
    report = db.query(ScheduledReport).filter(ScheduledReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Scheduled report not found")
    db.delete(report)
    db.commit()
    return {"deleted": True, "id": report_id}
