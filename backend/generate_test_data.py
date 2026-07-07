# backend/generate_test_data.py
import asyncio
import os
import sys
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Ensure backend root is in PYTHONPATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

from app.database.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.services.pdf_service import extract_text_from_pdf
from app.services.cloudinary_service import upload_pdf_report
from app.services.rag_service import ingest_report_text, connect_to_chroma
from app.services.crewai_service import run_hospital_ops_workflow
from app.models.patient import PatientInDB
from create_sample_pdf import generate_pdf

async def create_test_patients():
    db = get_database()
    logger_info("Creating 10 test patient profiles...")
    
    # Define 10 realistic patients
    patients = [
        {"name": "Robert Miller", "age": 58, "gender": "Male", "contact": "+1-555-0101", "symptoms": ["Substernal chest pain", "Severe dyspnea", "Left arm radiation"], "notes": "CRITICAL: Patient exhibits signs of acute myocardial infarction. Troponin levels high.", "status": "Under Review"},
        {"name": "Sarah Jenkins", "age": 34, "gender": "Female", "contact": "+1-555-0102", "symptoms": ["Acute right lower quadrant abdominal pain", "Nausea", "Fever"], "notes": "HIGH: Suspected acute appendicitis. Rebound tenderness present.", "status": "Under Review"},
        {"name": "Arthur Pendelton", "age": 78, "gender": "Male", "contact": "+1-555-0103", "symptoms": ["Unilateral left-sided weakness", "Facial droop", "Slurred speech"], "notes": "CRITICAL: Stroke alert. Onset occurred 45 minutes prior to arrival.", "status": "Under Review"},
        {"name": "Melissa Vance", "age": 42, "gender": "Female", "contact": "+1-555-0104", "symptoms": ["Wheezing", "Severe shortness of breath", "Intercostal retractions"], "notes": "MEDIUM: Acute asthma exacerbation. Standard inhalers failed.", "status": "Under Review"},
        {"name": "Timmy Cooper", "age": 8, "gender": "Male", "contact": "+1-555-0105", "symptoms": ["Mild rash", "Low grade fever", "Slight lethargy"], "notes": "LOW: Suspected chickenpox. Vital parameters stable.", "status": "Under Review"},
        {"name": "Evelyn Carter", "age": 67, "gender": "Female", "contact": "+1-555-0106", "symptoms": ["High fever", "Productive cough", "Confusion"], "notes": "MEDIUM: Suspected lobar pneumonia in geriatric patient.", "status": "Under Review"},
        {"name": "Derrick Rose", "age": 25, "gender": "Male", "contact": "+1-555-0107", "symptoms": ["Inversion ankle injury", "Localized swelling"], "notes": "LOW: Mild sprain. No obvious fracture on initial palpation.", "status": "Under Review"},
        {"name": "Maria Gonzalez", "age": 82, "gender": "Female", "contact": "+1-555-0108", "symptoms": ["Unresponsive", "Bradycardia", "Severe hypotension"], "notes": "CRITICAL: Heart block shock. Immediate ICU transfer required.", "status": "Under Review"},
        {"name": "George Wilson", "age": 51, "gender": "Male", "contact": "+1-555-0109", "symptoms": ["Minor laceration on right forearm", "Bleeding controlled"], "notes": "LOW: Superficial cut. Requires clean and simple sutures.", "status": "Under Review"},
        {"name": "Clara Higgins", "age": 29, "gender": "Female", "contact": "+1-555-0110", "symptoms": ["Deep leg swelling", "Severe calf tenderness"], "notes": "HIGH: Suspected deep vein thrombosis. Doppler ordered.", "status": "Under Review"}
    ]

    inserted_patients = []
    for pat in patients:
        # Check if already exists to prevent duplicate test runs
        existing = await db["patients"].find_one({"name": pat["name"]})
        if existing:
            existing["_id"] = str(existing["_id"])
            inserted_patients.append(existing)
            continue
            
        patient_id = f"PAT-{uuid.uuid4().hex[:6].upper()}"
        new_pat = PatientInDB(
            patient_id=patient_id,
            name=pat["name"],
            age=pat["age"],
            gender=pat["gender"],
            contact=pat["contact"],
            symptoms=pat["symptoms"],
            emergency_notes=pat["notes"],
            status=pat["status"],
            created_by="system_seeder",
            admission_date=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await db["patients"].insert_one(new_pat.model_dump())
        logger_info(f"Registered patient: {new_pat.name} ({patient_id})")
        inserted_patients.append(new_pat.model_dump())
        
    return inserted_patients

async def generate_and_index_reports(patients):
    db = get_database()
    logger_info("Generating and indexing 3 sample medical report PDFs...")
    
    # Choose 3 patients to create reports for
    report_patients = [
        {"patient": patients[0], "filename": "robert_miller_lab.pdf"},  # Critical Myocardial Infarction
        {"patient": patients[1], "filename": "sarah_jenkins_lab.pdf"}, # Appendicitis
        {"patient": patients[7], "filename": "maria_gonzalez_lab.pdf"} # Heart Block Shock
    ]

    for item in report_patients:
        pat = item["patient"]
        filename = item["filename"]
        
        # Check if report already exists in DB
        existing = await db["reports"].find_one({"patient_id": pat["patient_id"]})
        if existing:
            logger_info(f"Report already exists for {pat['name']}. Skipping creation.")
            continue
            
        # Generate the PDF file locally
        generate_pdf(filename, pat["name"], pat["patient_id"])
        
        # Read file content
        with open(filename, "rb") as f:
            pdf_bytes = f.read()
            
        # Extract text and upload to Cloudinary/local
        extracted_text = extract_text_from_pdf(pdf_bytes)
        secure_url = upload_pdf_report(pdf_bytes, filename)
        
        # Save Report in MongoDB
        report_id = f"REP-{uuid.uuid4().hex[:6].upper()}"
        report_doc = {
            "report_id": report_id,
            "patient_id": pat["patient_id"],
            "uploaded_by": "system_seeder",
            "file_url": secure_url,
            "extracted_text": extracted_text,
            "upload_date": datetime.utcnow(),
            "ai_processed": True
        }
        await db["reports"].insert_one(report_doc)
        
        # Ingest to ChromaDB
        ingest_report_text(pat["patient_id"], report_id, extracted_text)
        logger_info(f"Indexed report {report_id} in ChromaDB for patient {pat['name']}.")
        
        # Remove local temporary file
        if os.path.exists(filename):
            os.remove(filename)

async def assign_beds(patients):
    db = get_database()
    logger_info("Assigning beds to 5 patients...")
    
    # Fetch 5 available beds
    available_beds = await db["beds"].find({"status": "Available"}).limit(5).to_list(length=5)
    if len(available_beds) < 5:
        logger_info("Warning: Insufficient available beds for seeder assignment.")
        return
        
    for idx, bed in enumerate(available_beds):
        patient = patients[idx]
        bed_id = bed["bed_id"]
        patient_id = patient["patient_id"]
        
        # Perform bed update
        await db["beds"].update_one(
            {"bed_id": bed_id},
            {"$set": {"status": "Occupied", "assigned_patient_id": patient_id, "assigned_at": datetime.utcnow()}}
        )
        
        # Update patient
        await db["patients"].update_one(
            {"patient_id": patient_id},
            {"$set": {"assigned_bed_id": bed_id, "status": "Admitted", "updated_at": datetime.utcnow()}}
        )
        logger_info(f"Assigned bed {bed_id} to patient {patient['name']}.")

async def trigger_ai_analyses(patients):
    logger_info("Triggering CrewAI Operations workflow on 2 patients with reports...")
    
    # Target John Doe (Index 0) and Sarah Jenkins (Index 1)
    target_patients = [patients[0]["patient_id"], patients[1]["patient_id"]]
    
    for pat_id in target_patients:
        try:
            logger_info(f"Kicking off sequential flow for patient: {pat_id}")
            result = await run_hospital_ops_workflow(pat_id, triggered_by="system_seeder")
            logger_info(f"Workflow completed for {pat_id}. Severity: {result['emergency_analysis']['severity_level']}, Bed: {result['bed_allocation']['recommended_bed_id']}")
        except Exception as e:
            logger_error(f"Failed to run workflow for {pat_id}: {e}")

def logger_info(msg):
    print(f"[INFO] {msg}")

def logger_error(msg):
    print(f"[ERROR] {msg}", file=sys.stderr)

async def main():
    logger_info("Starting Seed/Test Data Workflow script...")
    await connect_to_mongo()
    connect_to_chroma()
    
    try:
        patients = await create_test_patients()
        await generate_and_index_reports(patients)
        await assign_beds(patients)
        await trigger_ai_analyses(patients)
        logger_info("All seeder test operations completed successfully!")
    except Exception as e:
        logger_error(f"Seed process encountered error: {e}")
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
