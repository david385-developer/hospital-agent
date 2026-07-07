# backend/app/routes/agent_chat.py
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.services.intent_service import parse_intent, execute_action, generate_response
from app.database.mongodb import db, get_database
from app.middleware.auth_middleware import get_current_user

logger = logging.getLogger("hospital_ops.routes.agent_chat")
router = APIRouter(prefix="/agent", tags=["Agent Chat"])

def _get_async_db():
    """Helper to obtain async motor database instance."""
    try:
        return get_database()
    except Exception:
        return db

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = []

@router.post("/chat", response_model=dict)
async def agent_chat(request: ChatRequest, current_user=Depends(get_current_user)):
    try:
        history = [{"role": m.role, "content": m.content} for m in request.conversation_history]
        intent = parse_intent(request.message, history)
        result = execute_action(intent["action"], intent.get("params", {}), current_user)
        response_text = generate_response(request.message, intent["action"], result)
        updated_stats = None
        if intent["action"] in ["create_patient", "assign_bed", "release_bed"]:
            stats_r = execute_action("get_stats", {}, current_user)
            if stats_r.get("success"):
                updated_stats = stats_r.get("stats")
        return {
            "success": True,
            "data": {
                "message": response_text,
                "action_taken": intent["action"],
                "result": result,
                "updated_stats": updated_stats,
                "confidence": intent.get("confidence", 0.5),
                "clarification_needed": intent.get("clarification_needed", False),
                "clarification_question": intent.get("clarification_question", "")
            },
            "message": "ok"
        }
    except Exception as e:
        logger.error(f"Error in agent chat endpoint: {e}", exc_info=True)
        return {
            "success": False,
            "data": {
                "message": "I encountered an error. Please try again.",
                "action_taken": "error",
                "result": {"error": str(e)},
                "updated_stats": None
            },
            "message": str(e)
        }

@router.get("/stats", response_model=dict)
async def stats_endpoint(current_user: dict = Depends(get_current_user)):
    """
    Retrieves KPI summary statistics for the agent chat interface.
    """
    try:
        db = _get_async_db()
        total_patients = await db.patients.count_documents({})
        admitted = await db.patients.count_documents({"status": "Admitted"})
        stats = {"total_patients": total_patients, "admitted": admitted, "beds": {}}
        
        for w in ["ICU", "Emergency", "General"]:
            t = await db.beds.count_documents({"ward_type": w})
            o = await db.beds.count_documents({"ward_type": w, "status": "Occupied"})
            if t == 0:
                if w == "ICU": t = 10
                elif w == "Emergency": t = 15
                elif w == "General": t = 30
            stats["beds"][w.lower()] = {"total": t, "occupied": o, "available": t - o}
            
        stats["total_beds"] = 55
        stats["total_occupied"] = sum(v["occupied"] for v in stats["beds"].values())
        stats["overall_occupancy_pct"] = round(stats["total_occupied"] / 55 * 100, 1)
        stats["emergency_queue_count"] = admitted
        stats["total_analyses"] = await db.ai_analyses.count_documents({})
        
        return {"success": True, "data": stats, "message": "Stats retrieved"}
    except Exception as e:
        logger.error(f"Error retrieving agent stats: {e}", exc_info=True)
        return {"success": False, "data": None, "message": str(e)}
