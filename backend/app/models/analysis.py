# backend/app/models/analysis.py
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class EmergencyAnalysisResult(BaseModel):
    severity_level: str = Field(..., pattern="^(CRITICAL|HIGH|MEDIUM|LOW)$")
    emergency_assessment: str

class PriorityClassificationResult(BaseModel):
    priority: str = Field(..., pattern="^(CRITICAL|HIGH|MEDIUM|LOW)$")
    reasoning: str

class BedAllocationResult(BaseModel):
    recommended_bed_id: Optional[str] = None
    ward_type: str = Field(..., pattern="^(ICU|Emergency|General|None)$")
    allocation_reasoning: str

class DoctorSummaryResult(BaseModel):
    summary: str

class RiskReviewResult(BaseModel):
    risk_level: str = Field(..., pattern="^(NORMAL|WARNING|CRITICAL)$")
    alerts: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

class TimelineStep(BaseModel):
    agent_name: str
    status: str = Field("waiting", pattern="^(waiting|running|complete)$")
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    output: Optional[str] = None

class AnalysisBase(BaseModel):
    patient_id: str
    emergency_analysis: EmergencyAnalysisResult
    report_analysis: Optional[Dict[str, Any]] = None
    priority_classification: PriorityClassificationResult
    bed_allocation: BedAllocationResult
    doctor_summary: Optional[DoctorSummaryResult] = None
    risk_review: RiskReviewResult
    coordination: Optional[Dict[str, Any]] = None
    execution_timeline: List[TimelineStep] = Field(default_factory=list)
    total_duration: float

class AnalysisResponse(AnalysisBase):
    analysis_id: str
    triggered_by: str
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class AnalysisInDB(AnalysisBase):
    analysis_id: str
    triggered_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
