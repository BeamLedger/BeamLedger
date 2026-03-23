from pydantic import BaseModel, ConfigDict
from typing import Optional


class SiteBase(BaseModel):
    name: str
    description: Optional[str] = None
    organization_id: int


class SiteCreate(SiteBase):
    pass


class SiteRead(SiteBase):
    model_config = ConfigDict(from_attributes=True)
    id: int