# backend/app/models/bed.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class BedBase(BaseModel):
    bed_id: str = Field(..., description="Unique bed identifier, e.g., ICU-101")
    ward_type: str = Field(..., pattern="^(ICU|Emergency|General)$")
    bed_number: str = Field(...)
    status: str = Field("Available", pattern="^(Available|Occupied|Maintenance)$")
    assigned_patient_id: Optional[str] = None
    assigned_at: Optional[datetime] = None
    released_at: Optional[datetime] = None

class BedCreate(BedBase):
    pass

class BedUpdate(BaseModel):
    status: Optional[str] = None
    assigned_patient_id: Optional[str] = None
    assigned_at: Optional[datetime] = None
    released_at: Optional[datetime] = None

class BedResponse(BedBase):
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class BedInDB(BedBase):
    pass
