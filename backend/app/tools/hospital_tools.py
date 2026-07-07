import json
from datetime import datetime
from crewai.tools import tool

def _get_db():
    from app.database.mongodb import db
    return db

@tool("Patient Database Lookup")
def patient_lookup_tool(patient_id: str) -> str:
    """Look up a patient record from the hospital MongoDB database by patient_id. Input should be a patient ID string like 'P-1001'. Returns full patient details including symptoms, status, assigned bed."""
    db = _get_db()
    patient = db.patients.find_one({"patient_id": patient_id}, {"_id": 0})
    if not patient:
        return json.dumps({"error": f"Patient {patient_id} not found"})
    for field in ["admission_date", "updated_at", "created_at"]:
        if field in patient and patient[field]:
            patient[field] = str(patient[field])
    return json.dumps(patient, default=str)

@tool("Symptom Severity Analyzer")
def symptom_analysis_tool(symptoms_json: str) -> str:
    """Analyze patient symptoms against a medical severity scoring database. Input should be a JSON list of symptoms like '[\"Chest Pain\", \"Shortness of Breath\"]'. Returns severity scores and overall level."""
    try:
        symptoms = json.loads(symptoms_json)
    except Exception:
        symptoms = [s.strip() for s in str(symptoms_json).strip("[]").split(",")]
    severity_map = {
        "chest pain": 8, "shortness of breath": 9, "severe bleeding": 10,
        "loss of consciousness": 10, "seizures": 9, "high fever": 6,
        "fever": 5, "severe headache": 7, "abdominal pain": 6,
        "dizziness": 4, "nausea": 3, "rapid heartbeat": 7,
        "difficulty breathing": 9, "blurred vision": 5, "paralysis": 10,
        "burns": 7, "fracture": 6, "allergic reaction": 8,
        "poisoning": 9, "hypothermia": 7, "dehydration": 5
    }
    scores = []
    for symptom in symptoms:
        s_lower = str(symptom).lower().strip()
        score = severity_map.get(s_lower, 5)
        scores.append({"symptom": symptom, "severity_score": score})
    if not scores:
        return json.dumps({"error": "No symptoms provided"})
    avg = round(sum(s["severity_score"] for s in scores) / len(scores), 1)
    max_s = max(s["severity_score"] for s in scores)
    level = "CRITICAL" if max_s >= 9 else "HIGH" if max_s >= 7 else "MEDIUM" if max_s >= 5 else "LOW"
    return json.dumps({"individual_scores": scores, "average_severity": avg, "max_severity": max_s, "severity_level": level})

@tool("Medical Report RAG Search")
def rag_retriever_tool(query: str) -> str:
    """Search uploaded medical reports using RAG vector similarity search in ChromaDB. Input a medical query like 'pneumonia symptoms oxygen levels'. Returns the most relevant text chunks from patient reports."""
    try:
        import chromadb
        client = chromadb.PersistentClient(path="./chroma_db")
        collection = client.get_collection("medical_reports")
        results = collection.query(query_texts=[query], n_results=5)
        docs = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        output = []
        for i, doc in enumerate(docs):
            meta = metadatas[i] if i < len(metadatas) else {}
            output.append({"chunk": doc, "patient_id": meta.get("patient_id", "unknown"), "report_id": meta.get("report_id", "unknown")})
        return json.dumps(output, default=str)
    except Exception as e:
        return json.dumps({"error": str(e), "chunks_found": 0})

@tool("Hospital Bed Availability Query")
def bed_query_tool(ward_type: str = "") -> str:
    """Query the hospital MongoDB database for available beds. Optional input: ward type like ICU, Emergency, or General. Leave empty for all wards. Returns available bed count and details by ward."""
    db = _get_db()
    query = {"status": "Available"}
    if ward_type and ward_type.strip():
        query["ward_type"] = {"$regex": ward_type.strip(), "$options": "i"}
    beds = list(db.beds.find(query, {"_id": 0}))
    for bed in beds:
        for f in ["assigned_at", "released_at"]:
            if f in bed and bed[f]:
                bed[f] = str(bed[f])
    counts = {}
    for w in ["ICU", "Emergency", "General"]:
        counts[w] = db.beds.count_documents({"ward_type": w, "status": "Available"})
    return json.dumps({"available_count": len(beds), "beds": beds[:10], "by_ward": counts}, default=str)

@tool("Bed Assignment Tool")
def bed_assignment_tool(input_str: str) -> str:
    """Assign a hospital bed to a patient. This WRITES to the database. Input must be JSON like '{\"bed_id\": \"ICU-102\", \"patient_id\": \"P-1001\"}'. Updates both bed and patient records."""
    try:
        data = json.loads(str(input_str))
        bed_id = data.get("bed_id", "")
        patient_id = data.get("patient_id", "")
    except Exception:
        return json.dumps({"error": "Input must be JSON with bed_id and patient_id"})
    if not bed_id or not patient_id:
        return json.dumps({"error": "Both bed_id and patient_id are required"})
    db = _get_db()
    bed = db.beds.find_one({"bed_id": bed_id})
    if not bed:
        return json.dumps({"error": f"Bed {bed_id} not found"})
    if bed.get("status") == "Occupied":
        return json.dumps({"error": f"Bed {bed_id} is already occupied"})
    now = datetime.utcnow()
    db.beds.update_one({"bed_id": bed_id}, {"$set": {"status": "Occupied", "assigned_patient_id": patient_id, "assigned_at": now}})
    db.patients.update_one({"patient_id": patient_id}, {"$set": {"assigned_bed_id": bed_id, "updated_at": now}})
    return json.dumps({"success": True, "bed_id": bed_id, "patient_id": patient_id, "assigned_at": str(now)})

@tool("Hospital Statistics Query")
def hospital_stats_tool(dummy: str = "") -> str:
    """Get real-time hospital statistics from MongoDB including bed occupancy by ward, total patients, and critical count. No real input needed, pass any string like 'get stats'."""
    db = _get_db()
    total_patients = db.patients.count_documents({"status": "Admitted"})
    stats = {"total_admitted_patients": total_patients, "beds": {}}
    for ward in ["ICU", "Emergency", "General"]:
        total = db.beds.count_documents({"ward_type": ward})
        occupied = db.beds.count_documents({"ward_type": ward, "status": "Occupied"})
        available = db.beds.count_documents({"ward_type": ward, "status": "Available"})
        pct = round((occupied / total * 100), 1) if total > 0 else 0
        stats["beds"][ward] = {"total": total, "occupied": occupied, "available": available, "occupancy_percent": pct}
    total_beds = sum(w["total"] for w in stats["beds"].values())
    total_occupied = sum(w["occupied"] for w in stats["beds"].values())
    stats["overall_occupancy_percent"] = round((total_occupied / total_beds * 100), 1) if total_beds > 0 else 0
    return json.dumps(stats, default=str)

@tool("Alert Generation Tool")
def alert_tool(input_str: str) -> str:
    """Generate and store an operational alert in the MongoDB database. Input must be JSON like '{\"alert_type\": \"ICU_Overload\", \"message\": \"ICU at 95 percent\", \"severity\": \"CRITICAL\"}'. This WRITES to the database."""
    try:
        data = json.loads(str(input_str))
    except Exception:
        return json.dumps({"error": "Input must be JSON with alert_type, message, severity"})
    db = _get_db()
    alert_doc = {"alert_type": data.get("alert_type", "general"), "message": data.get("message", ""), "severity": data.get("severity", "WARNING"), "created_at": datetime.utcnow(), "acknowledged": False}
    result = db.alerts.insert_one(alert_doc)
    return json.dumps({"success": True, "alert_id": str(result.inserted_id), "severity": alert_doc["severity"], "message": alert_doc["message"]})

@tool("Patient Record Update Tool")
def patient_update_tool(input_str: str) -> str:
    """Update a patient record in MongoDB. Input must be JSON like '{\"patient_id\": \"P-1001\", \"assigned_doctor\": \"Dr. Smith\", \"status\": \"Admitted\"}'. This WRITES to the database."""
    try:
        data = json.loads(str(input_str))
    except Exception:
        return json.dumps({"error": "Input must be JSON with patient_id and fields to update"})
    patient_id = data.pop("patient_id", None)
    if not patient_id:
        return json.dumps({"error": "patient_id is required"})
    db = _get_db()
    data["updated_at"] = datetime.utcnow()
    result = db.patients.update_one({"patient_id": patient_id}, {"$set": data})
    if result.matched_count == 0:
        return json.dumps({"error": f"Patient {patient_id} not found"})
    return json.dumps({"success": True, "patient_id": patient_id, "fields_updated": [k for k in data.keys() if k != "updated_at"]})

@tool("Doctor Availability Lookup")
def doctor_lookup_tool(specialty: str = "") -> str:
    """Find doctors in the hospital system. Optional input: specialty name. Leave empty for all doctors. Returns list of doctors with their details. Does NOT return passwords."""
    db = _get_db()
    query = {"role": "Doctor"}
    if specialty and specialty.strip():
        query["name"] = {"$regex": specialty.strip(), "$options": "i"}
    doctors = list(db.users.find(query, {"_id": 0, "password_hash": 0}))
    for doc in doctors:
        if "created_at" in doc and doc["created_at"]:
            doc["created_at"] = str(doc["created_at"])
    return json.dumps({"count": len(doctors), "doctors": doctors}, default=str)
