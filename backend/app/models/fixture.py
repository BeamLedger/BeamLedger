from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from ..database import Base


class Fixture(Base):
    __tablename__ = "fixtures"

    id = Column(Integer, primary_key=True, index=True)
    asset_tag = Column(String, unique=True, index=True, nullable=False)
    fixture_type = Column(String, nullable=False)
    manufacturer = Column(String, nullable=True)
    model = Column(String, nullable=True)
    wattage = Column(Float, nullable=True)
    lumens = Column(Float, nullable=True)
    cct = Column(Float, nullable=True)  # Correlated Color Temperature (Kelvin)
    shielding = Column(String, nullable=True)
    tilt = Column(Float, nullable=True)  # tilt angle in degrees
    mount_height = Column(Float, nullable=True)
    uplight_rating = Column(String, nullable=True)  # e.g. U0, U1, etc.
    bug_rating = Column(String, nullable=True)      # e.g. B2-U0-G1
    installation_status = Column(String, default="existing")
    notes = Column(String, nullable=True)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="SET NULL"), nullable=True)
    zone_id = Column(Integer, ForeignKey("zones.id", ondelete="SET NULL"), nullable=True)

    site = relationship("Site", back_populates="fixtures")
    zone = relationship("Zone", back_populates="fixtures")
    replacement_plan = relationship("ReplacementPlan", back_populates="fixture", uselist=False, cascade="all, delete-orphan")