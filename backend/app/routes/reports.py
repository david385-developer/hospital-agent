# backend/app/routes/reports.py
import logging
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from app.database.mongodb import get_database
from app.models.report import ReportInDB
from app.services.pdf_service import extract_text_from_pdf
from app.services.cloudinary_service import upload_pdf_report
from app.services.rag_service import ingest_report_text
from app.middleware.auth_middleware import get_current_user, RoleChecker

logger = logging.getLogger("hospital_ops.routes.reports")
router = APIRouter(prefix="/reports", tags=["Reports"])

# Role checkers
allow_upload = RoleChecker(["Admin", "Nurse", "Receptionist"])
allow_view = RoleChecker(["Admin", "Doctor", "Nurse", "Receptionist"])

@router.post("/upload", response_model=dict)
async def upload_report(
    patient_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(allow_upload)
):
    """
    Receives a patient report PDF file, uploads to Cloudinary, extracts its text content,
    saves the document profile in MongoDB, and ingests chunked embeddings in ChromaDB.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF reports are supported."
        )
        
    db = get_database()
    
    # Verify patient exists
    patient = await db["patients"].find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} does not exist"
        )
        
    try:
        # Read file contents
        file_bytes = await file.read()
        
        # 1. Extract Text from PDF
        extracted_text = extract_text_from_pdf(file_bytes)
        if not extracted_text.strip():
            logger.warning(f"No text extracted from PDF {file.filename}.")
            extracted_text = "No readable text content extracted from report."
            
        # 2. Upload PDF to Cloudinary / Local
        secure_url = upload_pdf_report(file_bytes, file.filename)
        
        # 3. Create Report ID
        report_id = f"REP-{uuid.uuid4().hex[:6].upper()}"
        
        # 4. Save to MongoDB
        new_report = ReportInDB(
            report_id=report_id,
            patient_id=patient_id,
            filename=file.filename,
            uploaded_by=current_user.get("email"),
            file_url=secure_url,
            extracted_text=extracted_text,
            upload_date=datetime.utcnow(),
            ai_processed=False
        )
        
        await db["reports"].insert_one(new_report.model_dump())
        
        # 5. Ingest into ChromaDB (runs embedding and indexing)
        try:
            ingest_report_text(patient_id, report_id, extracted_text)
            # Update to ai_processed = True
            await db["reports"].update_one(
                {"report_id": report_id},
                {"$set": {"ai_processed": True}}
            )
            new_report.ai_processed = True
            logger.info(f"Vector embeddings generated for report: {report_id}")
        except Exception as e:
            logger.error(f"Failed to ingest vector representations for report {report_id}: {e}")
            # Keep ai_processed as False, but allow the upload response to succeed
            
        return {
            "success": True,
            "data": {
                "report_id": report_id,
                "patient_id": patient_id,
                "patient_name": patient.get("name"),
                "filename": file.filename,
                "file_url": secure_url,
                "extracted_text": extracted_text,
                "upload_date": new_report.upload_date.isoformat(),
                "ai_processed": new_report.ai_processed,
                "uploaded_by": current_user.get("email")
            },
            "message": "Medical report uploaded and processed successfully"
        }
    except Exception as e:
        logger.error(f"Report upload workflow failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report upload workflow failed: {str(e)}"
        )

@router.get("", response_model=dict)
async def list_reports(
    patient_id: Optional[str] = None,
    current_user: dict = Depends(allow_view)
):
    """
    Lists medical reports, optionally filtered by patient_id.
    """
    db = get_database()
    query = {}
    if patient_id:
        query["patient_id"] = patient_id
        
    try:
        reports_cursor = db["reports"].find(query).sort("upload_date", -1)
        reports = await reports_cursor.to_list(length=100)
        
        for report in reports:
            report["_id"] = str(report["_id"])
            patient = await db["patients"].find_one({"patient_id": report["patient_id"]})
            report["patient_name"] = patient.get("name") if patient else "Unknown Patient"
            if "upload_date" in report:
                report["upload_date"] = report["upload_date"].isoformat()
                
        return {
            "success": True,
            "data": reports,
            "message": "Reports list retrieved successfully"
        }
    except Exception as e:
        logger.error(f"Failed to list reports: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reports"
        )

@router.get("/{report_id}", response_model=dict)
async def get_report_details(report_id: str, current_user: dict = Depends(allow_view)):
    """
    Retrieves full details of a specific report (including extracted text).
    """
    db = get_database()
    
    try:
        report = await db["reports"].find_one({"report_id": report_id})
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
            
        report["_id"] = str(report["_id"])
        patient = await db["patients"].find_one({"patient_id": report["patient_id"]})
        report["patient_name"] = patient.get("name") if patient else "Unknown Patient"
        if "upload_date" in report:
            report["upload_date"] = report["upload_date"].isoformat()
            
        return {
            "success": True,
            "data": report,
            "message": "Report details retrieved successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching report {report_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve report details"
        )
