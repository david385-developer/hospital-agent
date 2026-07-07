# backend/app/services/crewai_service.py
import asyncio
import time
import logging
from datetime import datetime
from typing import Dict, Any, List
import uuid
import os

from app.database.mongodb import get_database
from app.models.analysis import (
    EmergencyAnalysisResult,
    PriorityClassificationResult,
    BedAllocationResult,
    DoctorSummaryResult,
    RiskReviewResult,
    TimelineStep
)
from app.crew.hospital_crew import run_hospital_crew, AGENT_NAMES
from crewai import LLM
from app.config import settings

logger = logging.getLogger("hospital_ops.crewai_service")

# Helper to execute async db operations from sync callbacks
def run_db_update(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    if loop.is_running():
        asyncio.run_coroutine_threadsafe(coro, loop)
    else:
        loop.run_until_complete(coro)

async def update_timeline_status(analysis_id: str, agent_name: str, status: str, output: str = None):
    """
    Updates the execution status of a single agent step in the MongoDB analysis timeline.
    """
    db = get_database()
    now = datetime.utcnow()
    
    update_fields = {}
    if status == "running":
        update_fields["execution_timeline.$[elem].status"] = "running"
        update_fields["execution_timeline.$[elem].start_time"] = now
    elif status == "complete":
        update_fields["execution_timeline.$[elem].status"] = "complete"
        update_fields["execution_timeline.$[elem].end_time"] = now
        update_fields["execution_timeline.$[elem].output"] = output
        
    try:
        await db["ai_analyses"].update_one(
            {"analysis_id": analysis_id},
            {"$set": update_fields},
            array_filters=[{"elem.agent_name": agent_name}]
        )
        logger.info(f"Timeline updated: {agent_name} -> {status}")
    except Exception as e:
        logger.error(f"Failed to update timeline status for {agent_name}: {e}")

async def run_hospital_ops_workflow(patient_id: str, triggered_by: str) -> Dict[str, Any]:
    """
    Executes the 6-agent sequential workflow for a patient using run_hospital_crew.
    """
    start_time_sec = time.time()
    analysis_id = str(uuid.uuid4())
    db = get_database()
    
    # 1. Fetch patient details
    patient = await db["patients"].find_one({"patient_id": patient_id})
    if not patient:
        raise ValueError(f"Patient with ID {patient_id} not found.")
        
    # 2. Fetch current bed statistics for scanning recommended bed
    beds = await db["beds"].find({}).to_list(length=100)
    available_beds_list = [
        {"bed_id": b["bed_id"], "ward_type": b["ward_type"], "status": b["status"]}
        for b in beds if b["status"] == "Available"
    ]
    
    # 3. Initialize initial analysis document with waiting state for 6 agents
    initial_timeline = [
        TimelineStep(agent_name=name, status="waiting") for name in AGENT_NAMES
    ]
    
    analysis_doc = {
        "analysis_id": analysis_id,
        "patient_id": patient_id,
        "triggered_by": triggered_by,
        "emergency_analysis": {"severity_level": "LOW", "emergency_assessment": "Pending analysis..."},
        "report_analysis": {"summary": "Pending analysis..."},
        "priority_classification": {"priority": "LOW", "reasoning": "Pending analysis..."},
        "bed_allocation": {"recommended_bed_id": None, "ward_type": "None", "allocation_reasoning": "Pending analysis..."},
        "doctor_summary": {"summary": "Pending analysis..."},
        "risk_review": {"risk_level": "NORMAL", "alerts": [], "recommendations": []},
        "coordination": {"summary": "Pending analysis..."},
        "execution_timeline": [step.model_dump() for step in initial_timeline],
        "total_duration": 0.0,
        "created_at": datetime.utcnow()
    }
    
    await db["ai_analyses"].insert_one(analysis_doc)
    logger.info(f"Initialized database analysis record: {analysis_id}")
    
    # 4. Configure Groq LLM
    if settings.groq_api_key:
        os.environ["GROQ_API_KEY"] = settings.groq_api_key
        
    llm = LLM(
        model="groq/llama-3.1-8b-instant",
        temperature=0.3,
        max_tokens=2048,
        api_key=settings.groq_api_key
    )
    
    # 5. Execute crew workflow
    logger.info(f"Triggering CrewAI execution for patient {patient_id}...")
    loop = asyncio.get_event_loop()
    
    try:
        # Run blocking CrewAI execution in thread pool
        result = await loop.run_in_executor(None, run_hospital_crew, patient, llm)
        logger.info("CrewAI execution completed successfully.")
    except Exception as e:
        logger.error(f"Error during CrewAI execution: {e}")
        await db["ai_analyses"].update_many(
            {"analysis_id": analysis_id, "execution_timeline.status": {"$ne": "complete"}},
            {"$set": {"execution_timeline.$.status": "complete", "execution_timeline.$.output": f"Workflow failed: {str(e)}"}}
        )
        raise e
        
    # 6. Extract outcomes of each step from result
    outputs = {}
    if hasattr(result, "tasks_output") and result.tasks_output:
        for i, task_out in enumerate(result.tasks_output):
            if i < len(AGENT_NAMES):
                outputs[AGENT_NAMES[i]] = getattr(task_out, "raw", str(task_out))
    elif isinstance(result, dict) and "tasks_output" in result:
        for i, task_out in enumerate(result["tasks_output"]):
            if i < len(AGENT_NAMES):
                outputs[AGENT_NAMES[i]] = str(task_out.get("raw", task_out)) if isinstance(task_out, dict) else str(task_out)
    else:
        out_str = getattr(result, "raw", str(result))
        for name in AGENT_NAMES:
            outputs[name] = out_str
            
    # Ensure all 6 agent names have some text
    for name in AGENT_NAMES:
        if name not in outputs:
            outputs[name] = "Completed analysis."
            
    # Update timeline to complete
    now = datetime.utcnow()
    completed_timeline = [
        TimelineStep(
            agent_name=name,
            status="complete",
            start_time=now,
            end_time=now,
            output=outputs[name]
        ).model_dump()
        for name in AGENT_NAMES
    ]
    
    # Parse outputs for each agent
    # Agent 1: Emergency Intake Agent
    raw_a1 = outputs.get("Emergency Intake Agent", "")
    severity = "MEDIUM"
    if "CRITICAL" in raw_a1.upper():
        severity = "CRITICAL"
    elif "HIGH" in raw_a1.upper():
        severity = "HIGH"
    elif "LOW" in raw_a1.upper():
        severity = "LOW"
    emergency_analysis = EmergencyAnalysisResult(
        severity_level=severity,
        emergency_assessment=raw_a1
    ).model_dump()
    
    # Agent 2: Medical Report Analyzer
    raw_a2 = outputs.get("Medical Report Analyzer", "")
    report_analysis = {
        "summary": raw_a2,
        "findings": raw_a2,
        "raw_output": raw_a2
    }
    
    # Agent 3: Triage Priority Agent
    raw_a3 = outputs.get("Triage Priority Agent", "")
    priority = "MEDIUM"
    if "CRITICAL" in raw_a3.upper():
        priority = "CRITICAL"
    elif "HIGH" in raw_a3.upper():
        priority = "HIGH"
    elif "LOW" in raw_a3.upper():
        priority = "LOW"
    priority_classification = PriorityClassificationResult(
        priority=priority,
        reasoning=raw_a3
    ).model_dump()
    
    # Agent 4: Resource Allocation Agent
    raw_a4 = outputs.get("Resource Allocation Agent", "")
    recommended_bed_id = None
    ward_type = "General"
    if "ICU" in raw_a4:
        ward_type = "ICU"
    elif "EMR" in raw_a4 or "EMERGENCY" in raw_a4.upper():
        ward_type = "Emergency"
        
    for bed in available_beds_list:
        if bed["bed_id"] in raw_a4:
            recommended_bed_id = bed["bed_id"]
            ward_type = bed["ward_type"]
            break
            
    bed_allocation = BedAllocationResult(
        recommended_bed_id=recommended_bed_id,
        ward_type=ward_type,
        allocation_reasoning=raw_a4
    ).model_dump()
    
    # Agent 5: Risk Monitor Agent
    raw_a5 = outputs.get("Risk Monitor Agent", "")
    risk_level = "NORMAL"
    if "CRITICAL" in raw_a5.upper():
        risk_level = "CRITICAL"
    elif "WARNING" in raw_a5.upper() or "WARN" in raw_a5.upper():
        risk_level = "WARNING"
        
    alerts = []
    recommendations = []
    for line in raw_a5.split("\n"):
        line_clean = line.strip().strip("-*• ")
        if not line_clean:
            continue
        if "alert" in line.lower() or "warning" in line.lower() or "risk" in line.lower():
            alerts.append(line_clean)
        elif "recommend" in line.lower() or "should" in line.lower() or "action" in line.lower():
            recommendations.append(line_clean)
            
    if not alerts:
        alerts = [f"Summary alert: {raw_a5[:150]}..."]
    if not recommendations:
        recommendations = ["Monitor hospital bed ratios and coordinate with ward leads."]
        
    risk_review = RiskReviewResult(
        risk_level=risk_level,
        alerts=alerts,
        recommendations=recommendations
    ).model_dump()
    
    # Agent 6: Care Coordination Agent
    raw_a6 = outputs.get("Care Coordination Agent", "")
    coordination = {
        "summary": raw_a6,
        "care_briefing": raw_a6,
        "raw_output": raw_a6
    }
    doctor_summary = DoctorSummaryResult(
        summary=raw_a6
    ).model_dump()
    
    total_duration = round(time.time() - start_time_sec, 2)
    
    # Update analysis document with final structured data
    await db["ai_analyses"].update_one(
        {"analysis_id": analysis_id},
        {
            "$set": {
                "emergency_analysis": emergency_analysis,
                "report_analysis": report_analysis,
                "priority_classification": priority_classification,
                "bed_allocation": bed_allocation,
                "doctor_summary": doctor_summary,
                "risk_review": risk_review,
                "coordination": coordination,
                "execution_timeline": completed_timeline,
                "total_duration": total_duration
            }
        }
    )
    
    # Auto-update patient priority and emergency_notes
    patient_updates = {"updated_at": datetime.utcnow()}
    patient_updates["emergency_notes"] = f"[AI Triage: {severity}] {patient.get('emergency_notes', '')}"
    
    await db["patients"].update_one(
        {"patient_id": patient_id},
        {"$set": patient_updates}
    )
    
    final_doc = await db["ai_analyses"].find_one({"analysis_id": analysis_id})
    final_doc["_id"] = str(final_doc["_id"])
    return final_doc


def get_llm():
    from langchain_groq import ChatGroq
    from app.config import settings
    return ChatGroq(
        model="llama-3.1-8b-instant",
        groq_api_key=getattr(settings, "GROQ_API_KEY", getattr(settings, "groq_api_key", "")),
        temperature=0.3,
        max_tokens=2048
    )

