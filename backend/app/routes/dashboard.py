# backend/app/routes/dashboard.py
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.database.mongodb import get_database
from app.middleware.auth_middleware import get_current_user

logger = logging.getLogger("hospital_ops.routes.dashboard")
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=dict)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """
    Returns high-level statistics for the main operational dashboard.
    Includes bed counts grouped by ward/status, triage queue size, and recent activity logs.
    """
    db = get_database()
    
    try:
        # 1. Total Patients
        total_patients = await db["patients"].count_documents({})
        
        # 2. Emergency Queue count (under active evaluation)
        queue_count = await db["patients"].count_documents({"status": {"$in": ["Under Review", "Admitted"]}})
        
        # 3. Beds Counts
        beds_cursor = db["beds"].find({})
        beds = await beds_cursor.to_list(length=100)
        
        beds_stat = {
            "ICU": {"total": 0, "available": 0, "occupied": 0, "maintenance": 0},
            "Emergency": {"total": 0, "available": 0, "occupied": 0, "maintenance": 0},
            "General": {"total": 0, "available": 0, "occupied": 0, "maintenance": 0}
        }
        
        for bed in beds:
            ward = bed["ward_type"]
            status_val = bed["status"].lower() # available, occupied, maintenance
            
            if ward in beds_stat:
                beds_stat[ward]["total"] += 1
                if status_val in beds_stat[ward]:
                    beds_stat[ward][status_val] += 1
                elif status_val == "available":
                    beds_stat[ward]["available"] += 1
                elif status_val == "occupied":
                    beds_stat[ward]["occupied"] += 1
                elif status_val == "maintenance":
                    beds_stat[ward]["maintenance"] += 1
                    
        # 4. Recent analyses
        analyses_cursor = db["ai_analyses"].find({}).sort("created_at", -1).limit(5)
        recent_analyses = await analyses_cursor.to_list(length=5)
        
        formatted_analyses = []
        for analysis in recent_analyses:
            # Join with patient name
            patient_id = analysis["patient_id"]
            patient = await db["patients"].find_one({"patient_id": patient_id})
            patient_name = patient["name"] if patient else "Unknown Patient"
            
            formatted_analyses.append({
                "analysis_id": analysis["analysis_id"],
                "patient_id": patient_id,
                "patient_name": patient_name,
                "severity": analysis["emergency_analysis"].get("severity_level", "LOW"),
                "risk_level": analysis["risk_review"].get("risk_level", "NORMAL"),
                "total_duration": analysis.get("total_duration", 0),
                "created_at": analysis["created_at"].isoformat()
            })
            
        # 5. Compile response data
        stats = {
            "total_patients": total_patients,
            "queue_count": queue_count,
            "beds_summary": beds_stat,
            "recent_analyses": formatted_analyses
        }
        
        return {
            "success": True,
            "data": stats,
            "message": "Dashboard metrics successfully compiled"
        }
    except Exception as e:
        logger.error(f"Error compiling dashboard metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compile dashboard metrics"
        )
