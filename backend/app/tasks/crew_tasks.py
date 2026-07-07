from crewai import Task

def create_intake_task(patient_data, agent):
    return Task(
        description=f"""Process the emergency intake for the following patient.

Patient Data:
{patient_data}

You MUST perform these steps using your tools:
1. Use the Patient_Database_Lookup tool with the patient_id to retrieve their full medical record from MongoDB.
2. Use the Symptom_Severity_Analyzer tool with the patient's symptoms (as a JSON list) to calculate severity scores.
3. Combine the database record with the symptom analysis to produce a structured intake assessment.

Do NOT generate patient information from memory. Always query the database.
Do NOT make up symptom scores. Always use the analyzer tool.

Your output must include:
- Patient details retrieved from database
- Individual symptom severity scores
- Overall severity level (CRITICAL/HIGH/MEDIUM/LOW)
- Intake assessment summary""",
        agent=agent,
        expected_output="Structured JSON with patient_details, symptom_scores, severity_level, and intake_summary"
    )

def create_report_task(patient_id, agent):
    return Task(
        description=f"""Analyze medical reports for patient {patient_id} using RAG search.

You MUST perform these steps using your tools:
1. Use the Medical_Report_RAG_Search tool to search for relevant medical report sections.
   Run multiple searches with different queries:
   - Search for "patient {patient_id} diagnosis symptoms"
   - Search for "vital signs oxygen saturation lab results"
   - Search for "treatment recommendations medications"
2. Extract critical clinical findings from the retrieved chunks.
3. Compile a structured clinical analysis.

Do NOT generate medical data from memory. Always search the RAG database.

Your output must include:
- Key clinical findings extracted from reports
- Critical vital signs and lab values found
- Diagnoses mentioned in the reports
- Treatment recommendations from the documents
- Source citations (which report chunks the data came from)""",
        agent=agent,
        expected_output="Structured clinical analysis with findings, vital signs, diagnoses, and treatment info from RAG retrieval"
    )

def create_priority_task(patient_id, severity_data, agent):
    return Task(
        description=f"""Determine the emergency priority for patient {patient_id}.

Patient severity data from intake:
{severity_data}

You MUST perform these steps using your tools:
1. Use the Hospital_Statistics_Query tool to get current hospital load (bed occupancy, patient count, critical cases).
2. Use the Patient_Database_Lookup tool to check the patient's current status.
3. Based on the severity data AND the current hospital state, calculate the priority level.

Consider these factors:
- Patient symptom severity (from intake assessment)
- Current ICU occupancy (if over 85%, CRITICAL cases get bumped up)
- Current emergency queue length
- How long the patient has been waiting

Do NOT assign priority without checking hospital statistics first.

Your output must include:
- Priority level (CRITICAL/HIGH/MEDIUM/LOW)
- Reasoning based on real hospital data
- Current hospital load factors that influenced the decision
- Recommended action timeline (immediate/within 1 hour/within 4 hours/non-urgent)""",
        agent=agent,
        expected_output="Priority level with data-driven reasoning and hospital load context"
    )

def create_bed_task(patient_id, priority_data, agent):
    return Task(
        description=f"""Allocate a hospital bed for patient {patient_id}.

Priority assessment:
{priority_data}

You MUST perform these steps using your tools:
1. Use the Hospital_Statistics_Query tool to see current occupancy across all wards.
2. Use the Hospital_Bed_Availability_Query tool to find available beds in the appropriate ward:
   - CRITICAL priority → look for ICU beds
   - HIGH priority → look for Emergency ward beds
   - MEDIUM/LOW priority → look for General ward beds
3. Select the best available bed based on the data.
4. Use the Bed_Assignment_Tool to ASSIGN the bed. Input JSON: {{"bed_id": "THE_BED_ID", "patient_id": "{patient_id}"}}
5. Verify the assignment succeeded.

Do NOT hallucinate bed IDs. Only assign beds that the availability query confirmed are available.
Do NOT skip the assignment step. You must actually assign the bed in the database.

Your output must include:
- Assigned bed ID (verified from database)
- Ward type
- Assignment reasoning
- Confirmation that database was updated""",
        agent=agent,
        expected_output="Bed assignment confirmation with bed_id, ward_type, and database update confirmation"
    )

def create_risk_task(patient_id, all_data, agent):
    return Task(
        description=f"""Assess operational risks for the hospital after processing patient {patient_id}.

Data from previous agents:
{all_data}

You MUST perform these steps using your tools:
1. Use the Hospital_Statistics_Query tool to get current real-time hospital statistics.
2. Analyze the statistics for risks:
   - ICU occupancy above 85% → WARNING, above 95% → CRITICAL
   - Emergency ward above 80% → WARNING
   - Overall occupancy above 75% → WARNING
   - High number of critical patients → WARNING
3. If any risks are detected, use the Alert_Generation_Tool to CREATE alerts in the database.
   Input JSON: {{"alert_type": "TYPE", "message": "DESCRIPTION", "severity": "WARNING/CRITICAL"}}
4. Generate risk mitigation recommendations.

Do NOT generate statistics from memory. Always query the database.

Your output must include:
- Current hospital statistics (from database query)
- Risk level (NORMAL/WARNING/CRITICAL)
- List of specific risks identified
- Alerts generated (if any) with confirmation
- Risk mitigation recommendations""",
        agent=agent,
        expected_output="Risk assessment with real statistics, risk level, alerts created, and recommendations"
    )

def create_coordination_task(patient_id, bed_data, agent):
    return Task(
        description=f"""Coordinate care for patient {patient_id} after bed assignment.

Bed allocation data:
{bed_data}

You MUST perform these steps using your tools:
1. Use the Patient_Database_Lookup tool to get the patient's current updated record.
2. Use the Doctor_Availability_Lookup tool to find available doctors.
3. Select the most appropriate doctor based on the patient's condition.
4. Use the Patient_Record_Update_Tool to UPDATE the patient's record with:
   - assigned_doctor: the selected doctor's name
   - status: "Admitted" (if not already)
   Input JSON: {{"patient_id": "{patient_id}", "assigned_doctor": "DOCTOR_NAME", "status": "Admitted"}}
5. Generate a care briefing for the assigned doctor.

Do NOT assign a doctor without looking up available doctors first.
Do NOT skip the database update step.

Your output must include:
- Assigned doctor name (from database lookup)
- Doctor's details
- Care briefing summary for the doctor
- Confirmation that patient record was updated in database
- Next steps for the care team""",
        agent=agent,
        expected_output="Care coordination summary with assigned doctor, briefing, and database update confirmation"
    )
