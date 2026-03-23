from pydantic import BaseModel, ConfigDict
from typing import Optional


class RuleBase(BaseModel):
    organization_id: int
    name: Optional[str] = None
    max_cct: Optional[float] = None
    max_lumens: Optional[float] = None
    require_full_cutoff: Optional[bool] = None
    max_tilt: Optional[float] = None


class RuleCreate(RuleBase):
    pass


class RuleRead(RuleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int