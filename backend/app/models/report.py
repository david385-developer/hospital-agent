# backend/app/models/report.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ReportBase(BaseModel):
    patient_id: str = Field(...)
    filename: str = Field(...)
    file_url: str = Field(..., description="Cloudinary secure URL")
    extracted_text: str = Field(...)
    ai_processed: bool = Field(default=False)

class ReportCreate(BaseModel):
    patient_id: str

class ReportResponse(ReportBase):
    report_id: str
    uploaded_by: str
    upload_date: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class ReportInDB(ReportBase):
    report_id: str
    uploaded_by: str
    upload_date: datetime = Field(default_factory=datetime.utcnow)
