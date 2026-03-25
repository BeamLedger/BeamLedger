from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime, timezone


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String, nullable=False, index=True)  # fixture_added, compliance_evaluated, report_generated, import_completed, comment_added, fixture_updated, fixture_deleted
    entity_type = Column(String, nullable=True)  # fixture, report, import, site, zone
    entity_id = Column(String, nullable=True)
    summary = Column(String, nullable=False)
    details = Column(Text, nullable=True)  # JSON string with extra context

    user = relationship("User")
