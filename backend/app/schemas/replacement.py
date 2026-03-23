from pydantic import BaseModel, ConfigDict
from typing import Optional


class ReplacementPlanBase(BaseModel):
    fixture_id: int
    proposed_type: str
    estimated_wattage_reduction: Optional[float] = None
    estimated_cost: Optional[float] = None
    status: Optional[str] = None


class ReplacementPlanCreate(ReplacementPlanBase):
    pass


class ReplacementPlanRead(ReplacementPlanBase):
    model_config = ConfigDict(from_attributes=True)
    id: int