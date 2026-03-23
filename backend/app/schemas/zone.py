from pydantic import BaseModel, ConfigDict
from typing import Optional


class ZoneBase(BaseModel):
    name: str
    description: Optional[str] = None
    site_id: int


class ZoneCreate(ZoneBase):
    pass


class ZoneRead(ZoneBase):
    model_config = ConfigDict(from_attributes=True)
    id: int