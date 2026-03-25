"""ScheduledReport model — recurring report generation configuration."""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func

from ..database import Base


class ScheduledReport(Base):
    __tablename__ = "scheduled_reports"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(String, nullable=False, index=True)
    created_by = Column(String, nullable=False)
    report_type = Column(String, nullable=False)  # compliance, roi, activity
    frequency = Column(String, nullable=False)  # daily, weekly, monthly
    recipients = Column(Text, nullable=False)  # comma-separated emails
    filters = Column(Text, nullable=True)  # JSON string
    is_active = Column(Boolean, default=True, nullable=False)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
