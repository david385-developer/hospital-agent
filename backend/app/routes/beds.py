# backend/app/routes/beds.py
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.database.mongodb import get_database
from app.models.bed import BedCreate, BedUpdate, BedResponse
from app.middleware.auth_middleware import get_current_user, RoleChecker

logger = logging.getLogger("hospital_ops.routes.beds")
router = APIRouter(prefix="/beds", tags=["Beds"])

# Role checker configurations
allow_view = RoleChecker(["Admin", "Doctor", "Nurse", "Receptionist"])
allow_edit = RoleChecker(["Admin", "Nurse"])

@router.get("", response_model=dict)
async def list_beds(
    ward_type: Optional[str] = Query(None, pattern="^(ICU|Emergency|General)$"),
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(Available|Occupied|Maintenance)$"),
    current_user: dict = Depends(allow_view)
):
    """
    Retrieves all beds, optionally filtered by ward type or availability status.
    """
    db = get_database()
    query = {}
    
    if ward_type:
        query["ward_type"] = ward_type
    if status_filter:
        query["status"] = status_filter
        
    try:
        beds_cursor = db["beds"].find(query).sort("bed_id", 1)
        beds = await beds_cursor.to_list(length=100)
        
        for bed in beds:
            bed["_id"] = str(bed["_id"])
            patient = await db["patients"].find_one({"patient_id": bed.get("assigned_patient_id")}) if bed.get("assigned_patient_id") else None
            if patient:
                bed["patient_name"] = patient.get("name")
                bed["priority"] = patient.get("priority")
            if bed.get("assigned_at"):
                bed["assigned_at"] = bed["assigned_at"].isoformat()
            if bed.get("released_at"):
                bed["released_at"] = bed["released_at"].isoformat()
                
        return {
            "success": True,
            "data": beds,
            "message": "Beds list retrieved successfully"
        }
    except Exception as e:
        logger.error(f"Error querying beds database: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve bed statuses"
        )

@router.post("", response_model=dict)
async def create_bed(bed_data: BedCreate, current_user: dict = Depends(allow_edit)):
    """
    Registers a new bed in the system. Used during database seeding.
    """
    db = get_database()
    
    # Check if bed_id exists
    existing = await db["beds"].find_one({"bed_id": bed_data.bed_id})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bed number {bed_data.bed_id} already exists"
        )
        
    try:
        await db["beds"].insert_one(bed_data.model_dump())
        logger.info(f"Bed {bed_data.bed_id} created by {current_user.get('email')}")
        return {
            "success": True,
            "data": bed_data.model_dump(),
            "message": f"Bed {bed_data.bed_id} created successfully"
        }
    except Exception as e:
        logger.error(f"Error seeding bed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create bed"
        )

@router.put("/{bed_id}", response_model=dict)
async def update_bed(
    bed_id: str,
    bed_data: BedUpdate,
    current_user: dict = Depends(allow_edit)
):
    """
    Updates general bed attributes (status, assignments).
    """
    db = get_database()
    
    existing = await db["beds"].find_one({"bed_id": bed_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bed not found"
        )
        
    update_dict = {k: v for k, v in bed_data.model_dump().items() if v is not None}
    
    try:
        await db["beds"].update_one({"bed_id": bed_id}, {"$set": update_dict})
        logger.info(f"Bed {bed_id} updated by {current_user.get('email')}")
        
        updated = await db["beds"].find_one({"bed_id": bed_id})
        updated["_id"] = str(updated["_id"])
        return {
            "success": True,
            "data": updated,
            "message": "Bed updated successfully"
        }
    except Exception as e:
        logger.error(f"Error updating bed {bed_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update bed details"
        )

@router.post("/{bed_id}/assign", response_model=dict)
async def assign_bed(
    bed_id: str,
    patient_id: str,
    current_user: dict = Depends(allow_edit)
):
    """
    Assigns a specific patient to a bed. 
    Updates the bed status to 'Occupied' and patient status to 'Admitted'.
    """
    db = get_database()
    
    # 1. Fetch Bed
    bed = await db["beds"].find_one({"bed_id": bed_id})
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
        
    if bed["status"] == "Occupied":
        raise HTTPException(status_code=400, detail=f"Bed {bed_id} is already occupied")
        
    # 2. Fetch Patient
    patient = await db["patients"].find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
        
    # 3. Perform Transactional Updates
    try:
        now = datetime.utcnow()
        # Release patient's old bed if any
        if patient.get("assigned_bed_id"):
            old_bed_id = patient["assigned_bed_id"]
            await db["beds"].update_one(
                {"bed_id": old_bed_id},
                {"$set": {"status": "Available", "assigned_patient_id": None, "assigned_at": None, "released_at": now}}
            )
            
        # Update current bed
        await db["beds"].update_one(
            {"bed_id": bed_id},
            {"$set": {"status": "Occupied", "assigned_patient_id": patient_id, "assigned_at": now, "released_at": None}}
        )
        
        # Update patient status to Admitted
        await db["patients"].update_one(
            {"patient_id": patient_id},
            {"$set": {"assigned_bed_id": bed_id, "status": "Admitted", "updated_at": now}}
        )
        
        logger.info(f"Bed {bed_id} successfully assigned to patient {patient_id} by {current_user.get('email')}")
        
        updated_bed = await db["beds"].find_one({"bed_id": bed_id})
        updated_bed["_id"] = str(updated_bed["_id"])
        updated_bed["patient_name"] = patient.get("name")
        updated_bed["priority"] = patient.get("priority")
        if updated_bed.get("assigned_at"):
            updated_bed["assigned_at"] = updated_bed["assigned_at"].isoformat()
            
        return {
            "success": True,
            "data": updated_bed,
            "message": f"Bed {bed_id} successfully assigned to patient {patient_id}"
        }
    except Exception as e:
        logger.error(f"Error during bed assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bed assignment failed"
        )

@router.post("/{bed_id}/release", response_model=dict)
async def release_bed(bed_id: str, current_user: dict = Depends(allow_edit)):
    """
    Releases a bed.
    Updates the bed status to 'Available' and the assigned patient status to 'Discharged'.
    """
    db = get_database()
    
    # 1. Fetch Bed
    bed = await db["beds"].find_one({"bed_id": bed_id})
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
        
    if bed["status"] != "Occupied" or not bed.get("assigned_patient_id"):
        raise HTTPException(status_code=400, detail=f"Bed {bed_id} is not occupied")
        
    patient_id = bed["assigned_patient_id"]
    
    # 2. Perform Release Updates
    try:
        now = datetime.utcnow()
        # Update Bed status
        await db["beds"].update_one(
            {"bed_id": bed_id},
            {"$set": {"status": "Available", "assigned_patient_id": None, "assigned_at": None, "released_at": now}}
        )
        
        # Update Patient status to Discharged
        await db["patients"].update_one(
            {"patient_id": patient_id},
            {"$set": {"assigned_bed_id": None, "status": "Discharged", "updated_at": now}}
        )
        
        logger.info(f"Bed {bed_id} released. Patient {patient_id} discharged by {current_user.get('email')}")
        
        updated_bed = await db["beds"].find_one({"bed_id": bed_id})
        updated_bed["_id"] = str(updated_bed["_id"])
        if updated_bed.get("released_at"):
            updated_bed["released_at"] = updated_bed["released_at"].isoformat()
            
        return {
            "success": True,
            "data": updated_bed,
            "message": f"Bed {bed_id} successfully released. Patient {patient_id} has been discharged."
        }
    except Exception as e:
        logger.error(f"Error during bed release: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bed release failed"
        )
