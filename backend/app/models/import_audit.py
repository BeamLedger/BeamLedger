from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from ..database import Base
from datetime import datetime, timezone


class ImportAudit(Base):
    __tablename__ = "import_audits"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # "csv" | "xlsx"
    row_count = Column(Integer, default=0)
    imported_count = Column(Integer, default=0)
    skipped_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    error_details = Column(String, nullable=True)  # JSON string of error details
