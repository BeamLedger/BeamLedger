from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime, timezone


class Fixture(Base):
    __tablename__ = "fixtures"

    id = Column(Integer, primary_key=True, index=True)
    asset_tag = Column(String, unique=True, index=True, nullable=False)
    fixture_name = Column(String, nullable=True, index=True)
    fixture_type = Column(String, nullable=False)
    manufacturer = Column(String, nullable=True, index=True)
    model = Column(String, nullable=True)
    wattage = Column(Float, nullable=True)
    lumens = Column(Float, nullable=True)
    cct = Column(Float, nullable=True)
    cri = Column(Float, nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    space_type = Column(String, nullable=True, index=True)
    space_area = Column(Float, nullable=True)
    applicable_standards = Column(String, nullable=True)  # comma-separated StandardId values
    shielding = Column(String, nullable=True)
    tilt = Column(Float, nullable=True)
    mount_height = Column(Float, nullable=True)
    uplight_rating = Column(String, nullable=True)
    bug_rating = Column(String, nullable=True)
    installation_status = Column(String, default="existing")
    import_source = Column(String, default="manual")  # "manual" | "csv" | "xlsx"
    imported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes = Column(String, nullable=True)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="SET NULL"), nullable=True)
    zone_id = Column(Integer, ForeignKey("zones.id", ondelete="SET NULL"), nullable=True)

    site = relationship("Site", back_populates="fixtures")
    zone = relationship("Zone", back_populates="fixtures")
    replacement_plan = relationship("ReplacementPlan", back_populates="fixture", uselist=False, cascade="all, delete-orphan")
