# backend/app/routes/ai_analysis.py
import json
import time
import uuid
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query, Body
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.database.mongodb import db, get_database
from app.services.crewai_service import get_llm, run_hospital_ops_workflow
from app.middleware.auth_middleware import get_current_user, RoleChecker

logger = logging.getLogger("hospital_ops.routes.ai_analysis")
router = APIRouter(prefix="/ai", tags=["AI Orchestration"])

class AnalyzeRequest(BaseModel):
    patient_id: str

# Role checker configurations
allow_trigger = RoleChecker(["Admin", "Doctor"])
allow_view = RoleChecker(["Admin", "Doctor", "Nurse", "Receptionist"])


def parse_agent_output(agent_key: str, raw_output: str, db_sync) -> dict:
    if agent_key == "emergency_analysis":
        severity = "MEDIUM"
        if "CRITICAL" in raw_output.upper():
            severity = "CRITICAL"
        elif "HIGH" in raw_output.upper():
            severity = "HIGH"
        elif "LOW" in raw_output.upper():
            severity = "LOW"
        return {
            "severity_level": severity,
            "emergency_assessment": raw_output,
            "severity": severity,
            "assessment": raw_output
        }
    elif agent_key == "report_analysis":
        return {
            "summary": raw_output,
            "findings": raw_output,
            "raw_output": raw_output
        }
    elif agent_key == "priority_classification":
        priority = "MEDIUM"
        if "CRITICAL" in raw_output.upper():
            priority = "CRITICAL"
        elif "HIGH" in raw_output.upper():
            priority = "HIGH"
        elif "LOW" in raw_output.upper():
            priority = "LOW"
        return {
            "priority": priority,
            "priority_level": priority,
            "reasoning": raw_output
        }
    elif agent_key == "bed_allocation":
        recommended_bed_id = None
        ward_type = "General"
        if "ICU" in raw_output:
            ward_type = "ICU"
        elif "EMR" in raw_output or "EMERGENCY" in raw_output.upper():
            ward_type = "Emergency"
            
        try:
            available_beds = list(db_sync["beds"].find({"status": "Available"}))
            for b in available_beds:
                if b.get("bed_id", "") in raw_output:
                    recommended_bed_id = b["bed_id"]
                    ward_type = b.get("ward_type", ward_type)
                    break
            if not recommended_bed_id:
                import re
                match = re.search(r'(ICU|EMR|GEN|EMERGENCY|GENERAL)-\d+', raw_output, re.IGNORECASE)
                if match:
                    recommended_bed_id = match.group(0).upper()
                elif available_beds:
                    for b in available_beds:
                        if b.get("ward_type", "").upper() == ward_type.upper():
                            recommended_bed_id = b["bed_id"]
                            break
                    if not recommended_bed_id and available_beds:
                        recommended_bed_id = available_beds[0]["bed_id"]
                        ward_type = available_beds[0].get("ward_type", "General")
        except Exception as ex:
            logger.warning(f"Error checking available beds: {ex}")
            
        return {
            "recommended_bed_id": recommended_bed_id or "ICU-101",
            "bedId": recommended_bed_id or "ICU-101",
            "ward_type": ward_type,
            "ward": ward_type,
            "allocation_reasoning": raw_output,
            "reasoning": raw_output
        }
    elif agent_key == "risk_review":
        risk_level = "NORMAL"
        if "CRITICAL" in raw_output.upper():
            risk_level = "CRITICAL"
        elif "WARNING" in raw_output.upper() or "WARN" in raw_output.upper():
            risk_level = "WARNING"
            
        alerts = []
        recommendations = []
        for line in raw_output.split("\n"):
            line_clean = line.strip().strip("-*• ")
            if not line_clean:
                continue
            if "alert" in line.lower() or "warning" in line.lower() or "risk" in line.lower():
                alerts.append(line_clean)
            elif "recommend" in line.lower() or "should" in line.lower() or "action" in line.lower():
                recommendations.append(line_clean)
                
        if not alerts:
            alerts = [f"Summary alert: {raw_output[:150]}..."]
        if not recommendations:
            recommendations = ["Monitor hospital bed ratios and coordinate with ward leads."]
            
        return {
            "risk_level": risk_level,
            "riskLevel": risk_level,
            "alerts": alerts,
            "recommendations": recommendations,
            "raw_output": raw_output
        }
    elif agent_key == "coordination":
        assigned_doctor = "Dr. Smith"
        for line in raw_output.split("\n"):
            if "doctor" in line.lower() or "dr." in line.lower() or "assigned" in line.lower():
                import re
                match = re.search(r'(Dr\.\s+[A-Za-z]+(?:\s+[A-Za-z]+)?)', line, re.IGNORECASE)
                if match:
                    assigned_doctor = match.group(1)
                    break
        return {
            "assigned_doctor": assigned_doctor,
            "care_briefing": raw_output,
            "summary": raw_output,
            "raw_output": raw_output
        }
    return {"raw_output": raw_output}


@router.post("/analyze-emergency")
def analyze_emergency(
    patient_id: Optional[str] = Query(None, description="Patient ID to analyze"),
    request: Optional[AnalyzeRequest] = Body(default=None),
    current_user: dict = Depends(allow_trigger)
):
    """
    Kicks off the 6-agent clinical workflow for the specified patient ID, streaming SSE updates in real-time.
    Runs each CrewAI agent sequentially, updating MongoDB after each completion.
    """
    target_patient_id = patient_id or (request.patient_id if request else None)
    if not target_patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="patient_id parameter is required"
        )

    def generator():
        start_time_total = time.time()
        analysis_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        # 1. Create analysis record in MongoDB collection "ai_analyses" with status "in_progress"
        initial_doc = {
            "analysis_id": analysis_id,
            "patient_id": target_patient_id,
            "triggered_by": current_user.get("email", "unknown"),
            "status": "in_progress",
            "agent_results": {},
            "execution_timeline": [],
            "total_duration": 0.0,
            "created_at": now
        }
        
        try:
            db["ai_analyses"].insert_one(initial_doc)
            logger.info(f"Created SSE analysis record {analysis_id} for patient {target_patient_id}")
        except Exception as e:
            logger.error(f"Failed to insert initial analysis record: {e}")
            
        # 2. Fetch the patient from MongoDB
        patient = db["patients"].find_one({"patient_id": target_patient_id})
        if not patient:
            error_msg = f"Patient {target_patient_id} not found in database."
            logger.error(error_msg)
            err_event = {
                "type": "agent_error",
                "agent_name": "System",
                "agent_key": "system",
                "error": error_msg
            }
            yield f"data: {json.dumps(err_event)}\n\n"
            return

        # Initialize LLM
        try:
            llm = get_llm()
        except Exception as e:
            logger.error(f"Failed to initialize LLM via get_llm: {e}")
            from crewai import LLM
            from app.config import settings
            llm = LLM(
                model="groq/llama-3.1-8b-instant",
                temperature=0.3,
                max_tokens=2048,
                api_key=getattr(settings, "GROQ_API_KEY", getattr(settings, "groq_api_key", ""))
            )

        # 6 agents configuration
        agents_config = [
            {
                "name": "Emergency Intake Agent",
                "key": "emergency_analysis",
                "module": "app.agents.emergency_agent",
                "func": "get_emergency_agent",
                "description": f"Process emergency intake for patient {target_patient_id}. Use Patient_Database_Lookup tool with patient_id='{target_patient_id}' to get patient record. Then use Symptom_Severity_Analyzer tool with the patient's symptoms as JSON list. Combine results into intake assessment.",
                "expected_output": "Structured intake assessment including severity level and emergency analysis."
            },
            {
                "name": "Medical Report Analyzer",
                "key": "report_analysis",
                "module": "app.agents.report_agent",
                "func": "get_report_agent",
                "description": f"Search medical reports for patient {target_patient_id} using Medical_Report_RAG_Search tool. Search for 'patient {target_patient_id} diagnosis symptoms vital signs'. Then search for 'treatment recommendations medications'. Extract and compile all clinical findings.",
                "expected_output": "Compiled clinical findings from medical reports."
            },
            {
                "name": "Triage Priority Agent",
                "key": "priority_classification",
                "module": "app.agents.priority_agent",
                "func": "get_priority_agent",
                "description": f"Determine priority for patient {target_patient_id}. Use Hospital_Statistics_Query tool to check current hospital load. Use Patient_Database_Lookup tool for patient '{target_patient_id}'. Based on real data, assign CRITICAL/HIGH/MEDIUM/LOW priority with reasoning.",
                "expected_output": "Triage priority classification with detailed reasoning."
            },
            {
                "name": "Resource Allocation Agent",
                "key": "bed_allocation",
                "module": "app.agents.bed_allocation_agent",
                "func": "get_bed_allocation_agent",
                "description": f"Allocate a bed for patient {target_patient_id}. Use Hospital_Bed_Availability_Query to find available beds. Then use Bed_Assignment_Tool with JSON input {{\"bed_id\": \"THE_CHOSEN_BED\", \"patient_id\": \"{target_patient_id}\"}} to assign it. Confirm the assignment.",
                "expected_output": "Confirmed bed allocation and ward assignment with reasoning."
            },
            {
                "name": "Risk Monitor Agent",
                "key": "risk_review",
                "module": "app.agents.risk_review_agent",
                "func": "get_risk_agent",
                "description": f"Assess hospital risks. Use Hospital_Statistics_Query tool to get current stats. Check ICU occupancy, overall occupancy, queue length. If risks detected, use Alert_Generation_Tool with JSON {{\"alert_type\": \"...\", \"message\": \"...\", \"severity\": \"WARNING/CRITICAL\"}}.",
                "expected_output": "Risk assessment summary with generated alerts and recommendations."
            },
            {
                "name": "Care Coordination Agent",
                "key": "coordination",
                "module": "app.agents.coordination_agent",
                "func": "get_coordination_agent",
                "description": f"Coordinate care for patient {target_patient_id}. Use Doctor_Availability_Lookup to find available doctors. Select the best match. Then use Patient_Record_Update_Tool with JSON {{\"patient_id\": \"{target_patient_id}\", \"assigned_doctor\": \"SELECTED_DOCTOR\", \"status\": \"Admitted\"}}.",
                "expected_output": "Care coordination plan with assigned doctor and status update."
            }
        ]

        # 3. For each of the 6 agents in order:
        for cfg in agents_config:
            agent_name = cfg["name"]
            agent_key = cfg["key"]
            step_start = time.time()
            
            # a. Yield SSE event: {"type": "agent_start", "agent_name": "...", "agent_key": "..."}
            start_event = {
                "type": "agent_start",
                "agent_name": agent_name,
                "agent_key": agent_key
            }
            yield f"data: {json.dumps(start_event)}\n\n"
            
            try:
                # b. Import the agent function dynamically
                import importlib
                mod = importlib.import_module(cfg["module"])
                get_agent_fn = getattr(mod, cfg["func"])
                
                # c. Create a CrewAI Agent with the get_xxx_agent(llm) function
                agent_obj = get_agent_fn(llm)
                
                # d. Create a CrewAI Task with description that instructs the agent to use its tools
                from crewai import Task, Crew, Process
                task_obj = Task(
                    description=cfg["description"],
                    agent=agent_obj,
                    expected_output=cfg["expected_output"]
                )
                
                # e. Create a CrewAI Crew with single agent and single task, process=sequential
                crew_obj = Crew(
                    agents=[agent_obj],
                    tasks=[task_obj],
                    process=Process.sequential,
                    verbose=True
                )
                
                # f. Run crew.kickoff() synchronously
                logger.info(f"Kicking off agent: {agent_name}")
                raw_res = crew_obj.kickoff()
                
                # g. Parse the result
                raw_output = ""
                if hasattr(raw_res, "tasks_output") and raw_res.tasks_output:
                    raw_output = getattr(raw_res.tasks_output[0], "raw", str(raw_res.tasks_output[0]))
                elif isinstance(raw_res, dict) and "tasks_output" in raw_res:
                    t_out = raw_res["tasks_output"][0]
                    raw_output = str(t_out.get("raw", t_out)) if isinstance(t_out, dict) else str(t_out)
                else:
                    raw_output = getattr(raw_res, "raw", str(raw_res))
                    
                parsed_result = parse_agent_output(agent_key, raw_output, db)
                step_duration = round(time.time() - step_start, 2)
                
                # h. Update MongoDB: set agent_results.{key} and push to execution_timeline
                step_record = {
                    "agent_name": agent_name,
                    "agent_key": agent_key,
                    "status": "complete",
                    "start_time": datetime.utcfromtimestamp(step_start).isoformat(),
                    "end_time": datetime.utcnow().isoformat(),
                    "duration": step_duration,
                    "output": raw_output
                }
                
                db["ai_analyses"].update_one(
                    {"analysis_id": analysis_id},
                    {
                        "$set": {
                            f"agent_results.{agent_key}": parsed_result,
                            agent_key: parsed_result
                        },
                        "$push": {
                            "execution_timeline": step_record
                        }
                    }
                )
                
                # i. Yield SSE event: {"type": "agent_complete", "agent_name": "...", "agent_key": "...", "result": {...}, "duration": X.X}
                complete_event = {
                    "type": "agent_complete",
                    "agent_name": agent_name,
                    "agent_key": agent_key,
                    "result": parsed_result,
                    "duration": step_duration
                }
                yield f"data: {json.dumps(complete_event)}\n\n"
                
            except Exception as e:
                logger.error(f"Error executing agent {agent_name}: {e}")
                step_duration = round(time.time() - step_start, 2)
                error_msg = str(e)
                
                err_record = {
                    "agent_name": agent_name,
                    "agent_key": agent_key,
                    "status": "error",
                    "start_time": datetime.utcfromtimestamp(step_start).isoformat(),
                    "end_time": datetime.utcnow().isoformat(),
                    "duration": step_duration,
                    "output": f"Error: {error_msg}"
                }
                fallback_result = {"error": error_msg, "summary": f"Failed: {error_msg}", "raw_output": error_msg}
                
                try:
                    db["ai_analyses"].update_one(
                        {"analysis_id": analysis_id},
                        {
                            "$set": {
                                f"agent_results.{agent_key}": fallback_result,
                                agent_key: fallback_result
                            },
                            "$push": {
                                "execution_timeline": err_record
                            }
                        }
                    )
                except Exception as db_ex:
                    logger.error(f"Failed to update db on error: {db_ex}")
                
                # j. On error, yield: {"type": "agent_error", "agent_name": "...", "agent_key": "...", "error": "message"}
                err_event = {
                    "type": "agent_error",
                    "agent_name": agent_name,
                    "agent_key": agent_key,
                    "error": error_msg
                }
                yield f"data: {json.dumps(err_event)}\n\n"

        # 4. Update MongoDB with status "complete" and total_duration
        total_dur = round(time.time() - start_time_total, 2)
        try:
            db["ai_analyses"].update_one(
                {"analysis_id": analysis_id},
                {
                    "$set": {
                        "status": "complete",
                        "total_duration": total_dur
                    }
                }
            )
            
            # Update patient notes/priority
            anl_doc = db["ai_analyses"].find_one({"analysis_id": analysis_id})
            if anl_doc:
                sev = "HIGH"
                if "emergency_analysis" in anl_doc and isinstance(anl_doc["emergency_analysis"], dict):
                    sev = anl_doc["emergency_analysis"].get("severity_level", "HIGH")
                db["patients"].update_one(
                    {"patient_id": target_patient_id},
                    {
                        "$set": {
                            "updated_at": datetime.utcnow(),
                            "emergency_notes": f"[AI Triage: {sev}] {patient.get('emergency_notes', '')}"
                        }
                    }
                )
        except Exception as ex:
            logger.warning(f"Failed to update final database records: {ex}")

        # 5. Yield final event: {"type": "complete", "analysis_id": "...", "total_duration": X.X}
        final_event = {
            "type": "complete",
            "analysis_id": analysis_id,
            "total_duration": total_dur
        }
        yield f"data: {json.dumps(final_event)}\n\n"

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/analyses", response_model=dict)
async def list_analyses(
    patient_id: Optional[str] = None,
    current_user: dict = Depends(allow_view)
):
    """
    Retrieves a list of all completed or running analysis runs.
    """
    db_async = get_database()
    query = {}
    if patient_id:
        query["patient_id"] = patient_id
        
    try:
        cursor = db_async["ai_analyses"].find(query).sort("created_at", -1)
        analyses = await cursor.to_list(length=100)
        
        for item in analyses:
            item["_id"] = str(item["_id"])
            if "created_at" in item and hasattr(item["created_at"], "isoformat"):
                item["created_at"] = item["created_at"].isoformat()
            for step in item.get("execution_timeline", []):
                if step.get("start_time") and hasattr(step["start_time"], "isoformat"):
                    step["start_time"] = step["start_time"].isoformat()
                if step.get("end_time") and hasattr(step["end_time"], "isoformat"):
                    step["end_time"] = step["end_time"].isoformat()
                    
        return {
            "success": True,
            "data": analyses,
            "message": "Analyses logs retrieved successfully"
        }
    except Exception as e:
        logger.error(f"Error querying analyses: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analyses logs"
        )


@router.get("/analyses/{analysis_id}", response_model=dict)
async def get_analysis_details(
    analysis_id: str,
    current_user: dict = Depends(allow_view)
):
    """
    Retrieves full timeline and structural reports for a specific workflow analysis ID.
    """
    db_async = get_database()
    
    try:
        analysis = await db_async["ai_analyses"].find_one({"analysis_id": analysis_id})
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis log not found"
            )
            
        analysis["_id"] = str(analysis["_id"])
        if "created_at" in analysis and hasattr(analysis["created_at"], "isoformat"):
            analysis["created_at"] = analysis["created_at"].isoformat()
            
        for step in analysis.get("execution_timeline", []):
            if step.get("start_time") and hasattr(step["start_time"], "isoformat"):
                step["start_time"] = step["start_time"].isoformat()
            if step.get("end_time") and hasattr(step["end_time"], "isoformat"):
                step["end_time"] = step["end_time"].isoformat()
                
        return {
            "success": True,
            "data": analysis,
            "message": "Analysis details retrieved successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analysis details {analysis_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analysis details"
        )
