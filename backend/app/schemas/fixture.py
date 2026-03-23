from pydantic import BaseModel, ConfigDict
from typing import Optional


class FixtureBase(BaseModel):
    asset_tag: str
    fixture_type: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    wattage: Optional[float] = None
    lumens: Optional[float] = None
    cct: Optional[float] = None
    shielding: Optional[str] = None
    tilt: Optional[float] = None
    mount_height: Optional[float] = None
    uplight_rating: Optional[str] = None
    bug_rating: Optional[str] = None
    installation_status: Optional[str] = None
    notes: Optional[str] = None
    site_id: Optional[int] = None
    zone_id: Optional[int] = None


class FixtureCreate(FixtureBase):
    pass


class FixtureRead(FixtureBase):
    model_config = ConfigDict(from_attributes=True)
    id: int