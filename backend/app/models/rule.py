from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, default="Default Rule")
    max_cct = Column(Float, nullable=True)        # Maximum allowed CCT (Kelvin)
    max_lumens = Column(Float, nullable=True)     # Maximum allowed lumens
    require_full_cutoff = Column(Boolean, default=False)  # Whether shield is required
    max_tilt = Column(Float, nullable=True)       # Maximum tilt angle in degrees

    organization = relationship("Organization", back_populates="rules")