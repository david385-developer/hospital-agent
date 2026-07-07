# backend/app/models/patient.py
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class PatientBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., ge=0, le=150)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    contact: str = Field(...)
    symptoms: List[str] = Field(default_factory=list)
    emergency_notes: str = Field("")
    status: str = Field("Under Review", pattern="^(Admitted|Under Review|Discharged|Deceased)$")
    assigned_doctor: Optional[str] = None
    assigned_bed_id: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    contact: Optional[str] = None
    symptoms: Optional[List[str]] = None
    emergency_notes: Optional[str] = None
    status: Optional[str] = None
    assigned_doctor: Optional[str] = None
    assigned_bed_id: Optional[str] = None

class PatientResponse(PatientBase):
    patient_id: str
    admission_date: datetime
    created_by: str
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class PatientInDB(PatientBase):
    patient_id: str
    admission_date: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)
