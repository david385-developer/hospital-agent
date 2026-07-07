import json
import re
from datetime import datetime
from app.database.mongodb import db
from app.config import settings


# ============================================================
# LLM INSTANCE (cached, created once)
# ============================================================
_llm = None

def get_chat_llm():
    global _llm
    if _llm is None:
        from langchain_groq import ChatGroq
        _llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=settings.GROQ_API_KEY,
            temperature=0.1,
            max_tokens=512
        )
    return _llm


# ============================================================
# SYSTEM PROMPT
# ============================================================
SYSTEM_PROMPT = """You are MedOps AI hospital assistant. Parse user messages into JSON actions.

Return ONLY a JSON object. No explanation, no markdown, no text before or after.

{"action":"ACTION_NAME","params":{...},"confidence":0.9}

ACTIONS:
- create_patient: params={name,age,gender,symptoms[],emergency_notes,status}. Admit=Admitted.
- assign_bed: params={patient_identifier,ward_type(optional:ICU/Emergency/General)}.
- release_bed: params={bed_id}.
- get_stats: params={}.
- get_patients: params={status(optional),search(optional)}.
- get_beds: params={ward_type(optional)}.
- get_emergency_queue: params={}.
- get_patient_detail: params={patient_identifier}.
- run_analysis: params={patient_identifier}.
- general_conversation: params={topic}.

Rules: Extract symptoms as array. Use name as patient_identifier if no ID. If admit, status=Admitted."""


# ============================================================
# ROBUST JSON PARSER
# ============================================================
def _parse_json(text):
    if not text or not text.strip():
        return {"action": "general_conversation", "params": {"topic": ""}, "confidence": 0.1}

    text = text.strip()

    # Try direct
    try:
        return json.loads(text)
    except:
        pass

    # Try code fences
    m = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except:
            pass

    # Try first { to last }
    i = text.find('{')
    j = text.rfind('}')
    if i != -1 and j != -1 and j > i:
        try:
            return json.loads(text[i:j + 1])
        except:
            pass

    # Try line by line
    for line in text.split('\n'):
        line = line.strip()
        if line.startswith('{') and line.endswith('}'):
            try:
                return json.loads(line)
            except:
                pass

    return {"action": "general_conversation", "params": {"topic": text[:200]}, "confidence": 0.1}


# ============================================================
# PARSE INTENT (1 LLM call)
# ============================================================
def parse_intent(user_message, conversation_history):
    try:
        llm = get_chat_llm()
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in conversation_history[-8:]:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
        messages.append({"role": "user", "content": user_message})

        response = llm.invoke(messages)
        raw = response.content if hasattr(response, 'content') else str(response)

        print(f"\nRAW LLM: {raw[:300]}")

        intent = _parse_json(raw)

        if "action" not in intent:
            intent["action"] = "general_conversation"
        if "params" not in intent:
            intent["params"] = {}
        intent.setdefault("confidence", 0.5)
        intent.setdefault("clarification_needed", False)
        intent.setdefault("clarification_question", "")

        print(f"ACTION: {intent['action']} | PARAMS: {intent.get('params', {})}")
        return intent

    except Exception as e:
        print(f"PARSE ERROR: {e}")
        return {"action": "general_conversation", "params": {"topic": user_message}, "confidence": 0.1, "clarification_needed": False, "clarification_question": ""}


# ============================================================
# EXECUTE ACTION (real MongoDB operations)
# ============================================================
def execute_action(action, params, current_user):
    try:
        print(f"EXECUTE: {action}")

        # --- CREATE PATIENT ---
        if action == "create_patient":
            now = datetime.utcnow()
            pid = "PAT-" + hex(int(now.timestamp() * 1000))[2:8].upper()
            patient = {
                "patient_id": pid,
                "name": params.get("name", "Unknown"),
                "age": int(params.get("age", 0)),
                "gender": params.get("gender", "Not Specified"),
                "contact": params.get("contact", "Not Provided"),
                "symptoms": params.get("symptoms", []),
                "emergency_notes": params.get("emergency_notes", ""),
                "status": params.get("status", "Admitted"),
                "admission_date": now,
                "assigned_doctor": None,
                "assigned_bed_id": None,
                "created_by": current_user.get("name", "System"),
                "updated_at": now
            }
            db.patients.insert_one(patient)

            # Auto-assign bed
            bed = None
            for ward in ["ICU", "Emergency", "General"]:
                bed = db.beds.find_one({"ward_type": ward, "status": "Available"}, {"_id": 0})
                if bed:
                    break
            if bed:
                db.beds.update_one(
                    {"bed_id": bed["bed_id"]},
                    {"$set": {"status": "Occupied", "assigned_patient_id": pid, "assigned_at": now}}
                )
                db.patients.update_one(
                    {"patient_id": pid},
                    {"$set": {"assigned_bed_id": bed["bed_id"]}}
                )
                patient["assigned_bed_id"] = bed["bed_id"]

            patient.pop("_id", None)
            patient["admission_date"] = str(patient["admission_date"])
            patient["updated_at"] = str(patient["updated_at"])
            print(f"CREATED: {pid} | Bed: {patient.get('assigned_bed_id', 'None')}")
            return {"success": True, "patient": patient}

        # --- ASSIGN BED ---
        elif action == "assign_bed":
            identifier = params.get("patient_identifier", "")
            patient = None
            if identifier.startswith("PAT-"):
                patient = db.patients.find_one({"patient_id": identifier}, {"_id": 0})
            else:
                patient = db.patients.find_one({"name": {"$regex": identifier, "$options": "i"}}, {"_id": 0})

            if not patient:
                return {"success": False, "message": f"Patient '{identifier}' not found"}

            ward = params.get("ward_type")
            bed = None
            if ward:
                bed = db.beds.find_one({"ward_type": ward, "status": "Available"}, {"_id": 0})
            else:
                for w in ["ICU", "Emergency", "General"]:
                    bed = db.beds.find_one({"ward_type": w, "status": "Available"}, {"_id": 0})
                    if bed:
                        break

            if not bed:
                return {"success": False, "message": "No available beds found"}

            now = datetime.utcnow()
            db.beds.update_one(
                {"bed_id": bed["bed_id"]},
                {"$set": {"status": "Occupied", "assigned_patient_id": patient["patient_id"], "assigned_at": now}}
            )
            db.patients.update_one(
                {"patient_id": patient["patient_id"]},
                {"$set": {"assigned_bed_id": bed["bed_id"], "updated_at": now}}
            )
            print(f"ASSIGNED: {bed['bed_id']} -> {patient['patient_id']}")
            return {"success": True, "bed_id": bed["bed_id"], "ward_type": bed["ward_type"], "patient_id": patient["patient_id"], "patient_name": patient["name"]}

        # --- RELEASE BED ---
        elif action == "release_bed":
            bed_id = params.get("bed_id", "")
            bed = db.beds.find_one({"bed_id": bed_id}, {"_id": 0})
            if not bed:
                return {"success": False, "message": f"Bed {bed_id} not found"}

            now = datetime.utcnow()
            db.beds.update_one(
                {"bed_id": bed_id},
                {"$set": {"status": "Available", "assigned_patient_id": None, "released_at": now}}
            )
            if bed.get("assigned_patient_id"):
                db.patients.update_one(
                    {"patient_id": bed["assigned_patient_id"]},
                    {"$set": {"assigned_bed_id": None, "updated_at": now}}
                )
            print(f"RELEASED: {bed_id}")
            return {"success": True, "bed_id": bed_id, "released_patient": bed.get("assigned_patient_id")}

        # --- GET STATS ---
        elif action == "get_stats":
            total = db.patients.count_documents({})
            admitted = db.patients.count_documents({"status": "Admitted"})
            stats = {"total_patients": total, "admitted": admitted, "beds": {}, "emergency_queue_count": admitted}
            total_occ = 0
            for w in ["ICU", "Emergency", "General"]:
                t = db.beds.count_documents({"ward_type": w})
                o = db.beds.count_documents({"ward_type": w, "status": "Occupied"})
                total_occ += o
                stats["beds"][w.lower()] = {"total": t, "occupied": o, "available": t - o}
            stats["total_beds"] = 55
            stats["total_occupied"] = total_occ
            stats["overall_occupancy_pct"] = round(total_occ / 55 * 100, 1)
            stats["total_analyses"] = db.ai_analyses.count_documents({})
            print(f"STATS: {total} patients, {total_occ}/55 beds")
            return {"success": True, "stats": stats}

        # --- GET PATIENTS ---
        elif action == "get_patients":
            query = {}
            if params.get("status"):
                query["status"] = params["status"]
            if params.get("search"):
                query["$or"] = [
                    {"name": {"$regex": params["search"], "$options": "i"}},
                    {"patient_id": {"$regex": params["search"], "$options": "i"}}
                ]
            patients = list(db.patients.find(query, {"_id": 0}).sort("admission_date", -1).limit(20))
            for p in patients:
                for f in ["admission_date", "updated_at"]:
                    if f in p and p[f]:
                        p[f] = str(p[f])
            print(f"LISTED: {len(patients)} patients")
            return {"success": True, "patients": patients, "count": len(patients)}

        # --- GET BEDS ---
        elif action == "get_beds":
            query = {}
            if params.get("ward_type"):
                query["ward_type"] = params["ward_type"]
            beds = list(db.beds.find(query, {"_id": 0}).sort("bed_number", 1))
            counts = {}
            for w in ["ICU", "Emergency", "General"]:
                t = db.beds.count_documents({"ward_type": w})
                a = db.beds.count_documents({"ward_type": w, "status": "Available"})
                counts[w.lower()] = {"total": t, "available": a, "occupied": t - a}
            print(f"BEDS: {len(beds)} listed")
            return {"success": True, "beds": beds, "counts": counts, "total": len(beds)}

        # --- EMERGENCY QUEUE ---
        elif action == "get_emergency_queue":
            queue = list(db.patients.find({"status": "Admitted"}, {"_id": 0}).sort("admission_date", -1).limit(50))
            for p in queue:
                if "admission_date" in p and p["admission_date"]:
                    p["admission_date"] = str(p["admission_date"])
            print(f"QUEUE: {len(queue)} patients")
            return {"success": True, "queue": queue, "count": len(queue)}

        # --- PATIENT DETAIL ---
        elif action == "get_patient_detail":
            identifier = params.get("patient_identifier", "")
            patient = None
            if identifier.startswith("PAT-"):
                patient = db.patients.find_one({"patient_id": identifier}, {"_id": 0})
            else:
                patient = db.patients.find_one({"name": {"$regex": identifier, "$options": "i"}}, {"_id": 0})
            if not patient:
                return {"success": False, "message": f"Patient '{identifier}' not found"}
            for f in ["admission_date", "updated_at"]:
                if f in patient and patient[f]:
                    patient[f] = str(patient[f])
            bed = None
            if patient.get("assigned_bed_id"):
                bed = db.beds.find_one({"bed_id": patient["assigned_bed_id"]}, {"_id": 0})
            reports = list(db.reports.find({"patient_id": patient["patient_id"]}, {"_id": 0}).limit(10))
            print(f"DETAIL: {patient['name']}")
            return {"success": True, "patient": patient, "bed": bed, "reports": reports}

        # --- RUN ANALYSIS ---
        elif action == "run_analysis":
            identifier = params.get("patient_identifier", "")
            patient = None
            if identifier.startswith("PAT-"):
                patient = db.patients.find_one({"patient_id": identifier}, {"_id": 0})
            else:
                patient = db.patients.find_one({"name": {"$regex": identifier, "$options": "i"}}, {"_id": 0})
            if not patient:
                return {"success": False, "message": f"Patient '{identifier}' not found"}
            print(f"ANALYSIS: triggered for {patient['name']}")
            return {"success": True, "patient_id": patient["patient_id"], "patient_name": patient["name"]}

        # --- GENERAL ---
        else:
            return {"success": True, "type": "conversation"}

    except Exception as e:
        print(f"EXECUTE ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


# ============================================================
# GENERATE RESPONSE (uses LLM or fallback)
# ============================================================
def generate_response(user_message, action, result):
    # For simple queries, use instant fallback (no LLM call needed)
    if action in ["get_stats", "get_beds", "get_patients", "get_emergency_queue"]:
        return _fallback_response(action, result)

    # For mutations, try LLM first, fall back to template
    try:
        llm = get_chat_llm()
        prompt = f"You are a hospital assistant. Reply in 1-2 sentences. Include IDs and names. Use emojis.\n\nUser: {user_message}\nAction: {action}\nResult: {json.dumps(result, default=str)[:400]}"
        resp = llm.invoke(prompt)
        text = resp.content if hasattr(resp, 'content') else str(resp)
        if len(text.strip()) > 10:
            return text.strip()
    except Exception as e:
        print(f"RESPONSE LLM ERROR: {e}")

    return _fallback_response(action, result)


def _fallback_response(action, result):
    if action == "create_patient" and result.get("success"):
        p = result.get("patient", {})
        bed = p.get("assigned_bed_id", "Not assigned")
        return f"Patient admitted successfully.\n\nName: {p.get('name')}\nID: {p.get('patient_id')}\nAge: {p.get('age')}\nStatus: {p.get('status')}\nBed: {bed}\n\nWould you like me to run an AI triage analysis?"

    elif action == "assign_bed" and result.get("success"):
        return f"Bed assigned successfully.\n\nBed: {result.get('bed_id')}\nWard: {result.get('ward_type')}\nPatient: {result.get('patient_name')}"

    elif action == "release_bed" and result.get("success"):
        return f"Bed {result.get('bed_id')} released and marked as available."

    elif action == "get_stats":
        s = result.get("stats", {})
        beds = s.get("beds", {})
        return f"Hospital Overview:\n\nTotal Patients: {s.get('total_patients', 0)}\nAdmitted: {s.get('admitted', 0)}\nBeds Occupied: {s.get('total_occupied', 0)}/55\n\nICU: {beds.get('icu', {}).get('occupied', 0)}/{beds.get('icu', {}).get('total', 10)}\nEmergency: {beds.get('emergency', {}).get('occupied', 0)}/{beds.get('emergency', {}).get('total', 15)}\nGeneral: {beds.get('general', {}).get('occupied', 0)}/{beds.get('general', {}).get('total', 30)}\n\nEmergency Queue: {s.get('emergency_queue_count', 0)}"

    elif action == "get_beds":
        c = result.get("counts", {})
        return f"Bed Availability:\n\nICU: {c.get('icu', {}).get('available', 0)} available ({c.get('icu', {}).get('occupied', 0)} occupied)\nEmergency: {c.get('emergency', {}).get('available', 0)} available ({c.get('emergency', {}).get('occupied', 0)} occupied)\nGeneral: {c.get('general', {}).get('available', 0)} available ({c.get('general', {}).get('occupied', 0)} occupied)"

    elif action == "get_patients":
        pts = result.get("patients", [])
        lines = [f"Found {result.get('count', 0)} patients:"]
        for i, p in enumerate(pts[:5], 1):
            lines.append(f"{i}. {p.get('name')} ({p.get('patient_id')}) - {p.get('status')} - Bed: {p.get('assigned_bed_id', 'None')}")
        return "\n".join(lines)

    elif action == "get_emergency_queue":
        q = result.get("queue", [])
        if not q:
            return "Emergency queue is empty. No admitted patients."
        lines = [f"Emergency Queue ({len(q)} patients):"]
        for i, p in enumerate(q[:5], 1):
            syms = ", ".join(p.get("symptoms", [])[:2])
            lines.append(f"{i}. {p.get('name')} - {syms} - Bed: {p.get('assigned_bed_id', 'Waiting')}")
        return "\n".join(lines)

    elif action == "get_patient_detail":
        p = result.get("patient", {})
        bed = result.get("bed")
        lines = [
            f"Patient Details:",
            f"Name: {p.get('name')}",
            f"ID: {p.get('patient_id')}",
            f"Age: {p.get('age')} | Gender: {p.get('gender')}",
            f"Status: {p.get('status')}",
            f"Symptoms: {', '.join(p.get('symptoms', []))}",
            f"Contact: {p.get('contact')}",
            f"Bed: {p.get('assigned_bed_id', 'Not assigned')}",
        ]
        if bed:
            lines.append(f"Ward: {bed.get('ward_type')}")
        if p.get("emergency_notes"):
            lines.append(f"Notes: {p.get('emergency_notes')}")
        return "\n".join(lines)

    elif action == "run_analysis":
        return f"AI triage analysis triggered for {result.get('patient_name', 'patient')}. Go to the AI Analysis page to see the 6-agent workflow results."

    elif action == "assign_bed" and not result.get("success"):
        return f"Could not assign bed: {result.get('message', 'Unknown error')}"

    elif action == "create_patient" and not result.get("success"):
        return f"Could not create patient: {result.get('message', 'Unknown error')}"

    elif action == "release_bed" and not result.get("success"):
        return f"Could not release bed: {result.get('message', 'Unknown error')}"

    elif action == "get_patient_detail" and not result.get("success"):
        return f"Patient not found: {result.get('message', 'Unknown error')}"

    else:
        return "Action completed."
