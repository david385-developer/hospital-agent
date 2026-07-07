# backend/app/routes/patients.py
import logging
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.database.mongodb import get_database
from app.models.patient import PatientCreate, PatientUpdate, PatientInDB
from app.middleware.auth_middleware import get_current_user, RoleChecker

logger = logging.getLogger("hospital_ops.routes.patients")
router = APIRouter(prefix="/patients", tags=["Patients"])

# Role checker configurations
allow_create = RoleChecker(["Admin", "Nurse", "Receptionist"])
allow_view = RoleChecker(["Admin", "Doctor", "Nurse", "Receptionist"])
allow_edit = RoleChecker(["Admin", "Nurse"])

@router.post("", response_model=dict)
async def create_patient(patient_data: PatientCreate, current_user: dict = Depends(allow_create)):
    """
    Registers a new patient inside the hospital database.
    Only Admins, Nurses, and Receptionists are authorized.
    """
    db = get_database()
    
    # Generate unique ID
    patient_id = f"PAT-{uuid.uuid4().hex[:6].upper()}"
    
    try:
        new_patient = PatientInDB(
            patient_id=patient_id,
            name=patient_data.name,
            age=patient_data.age,
            gender=patient_data.gender,
            contact=patient_data.contact,
            symptoms=patient_data.symptoms,
            emergency_notes=patient_data.emergency_notes,
            status=patient_data.status,
            assigned_doctor=patient_data.assigned_doctor,
            assigned_bed_id=patient_data.assigned_bed_id,
            created_by=current_user.get("email"),
            admission_date=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        await db["patients"].insert_one(new_patient.model_dump())
        logger.info(f"Patient {patient_id} created by user {current_user.get('email')}")
        
        return {
            "success": True,
            "data": new_patient.model_dump(),
            "message": "Patient record created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating patient record: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create patient record"
        )

@router.get("", response_model=dict)
async def list_patients(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(allow_view)
):
    """
    Retrieves all patients from the database with search and status filtering options.
    """
    db = get_database()
    query = {}
    
    if status_filter:
        query["status"] = status_filter
        
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"patient_id": {"$regex": search, "$options": "i"}},
            {"emergency_notes": {"$regex": search, "$options": "i"}},
            {"symptoms": {"$in": [search]}}
        ]
        
    try:
        patients_cursor = db["patients"].find(query).sort("admission_date", -1)
        patients = await patients_cursor.to_list(length=200)
        
        # Format string IDs
        for patient in patients:
            patient["_id"] = str(patient["_id"])
            if "admission_date" in patient:
                patient["admission_date"] = patient["admission_date"].isoformat()
            if "updated_at" in patient:
                patient["updated_at"] = patient["updated_at"].isoformat()
                
        return {
            "success": True,
            "data": patients,
            "message": "Patients list retrieved successfully"
        }
    except Exception as e:
        logger.error(f"Error listing patients: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patients list"
        )

@router.get("/{patient_id}", response_model=dict)
async def get_patient_details(patient_id: str, current_user: dict = Depends(allow_view)):
    """
    Retrieves full profile details for a specific patient ID.
    """
    db = get_database()
    
    try:
        patient = await db["patients"].find_one({"patient_id": patient_id})
        if not patient:
            logger.warning(f"Patient lookup failed: patient_id {patient_id} not found.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient record not found"
            )
            
        patient["_id"] = str(patient["_id"])
        if "admission_date" in patient:
            patient["admission_date"] = patient["admission_date"].isoformat()
        if "updated_at" in patient:
            patient["updated_at"] = patient["updated_at"].isoformat()
            
        return {
            "success": True,
            "data": patient,
            "message": "Patient record retrieved successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching patient {patient_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patient record"
        )

@router.put("/{patient_id}", response_model=dict)
async def update_patient(
    patient_id: str,
    patient_data: PatientUpdate,
    current_user: dict = Depends(allow_edit)
):
    """
    Updates editable fields of a patient record.
    Only Admins and Nurses are authorized.
    """
    db = get_database()
    
    patient = await db["patients"].find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient record not found"
        )
        
    update_dict = {k: v for k, v in patient_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    try:
        await db["patients"].update_one(
            {"patient_id": patient_id},
            {"$set": update_dict}
        )
        logger.info(f"Patient {patient_id} updated by {current_user.get('email')}")
        
        updated_patient = await db["patients"].find_one({"patient_id": patient_id})
        updated_patient["_id"] = str(updated_patient["_id"])
        if "admission_date" in updated_patient:
            updated_patient["admission_date"] = updated_patient["admission_date"].isoformat()
        if "updated_at" in updated_patient:
            updated_patient["updated_at"] = updated_patient["updated_at"].isoformat()
            
        return {
            "success": True,
            "data": updated_patient,
            "message": "Patient record updated successfully"
        }
    except Exception as e:
        logger.error(f"Error updating patient {patient_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update patient record"
        )
