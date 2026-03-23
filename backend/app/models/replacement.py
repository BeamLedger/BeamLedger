from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class ReplacementPlan(Base):
    __tablename__ = "replacement_plans"

    id = Column(Integer, primary_key=True, index=True)
    fixture_id = Column(Integer, ForeignKey("fixtures.id", ondelete="CASCADE"), nullable=False)
    proposed_type = Column(String, nullable=False)
    estimated_wattage_reduction = Column(Float, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    status = Column(String, default="planned")  # planned, in-progress, completed

    fixture = relationship("Fixture", back_populates="replacement_plan")