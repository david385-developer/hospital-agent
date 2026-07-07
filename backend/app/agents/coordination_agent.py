from crewai import Agent
from app.tools.hospital_tools import patient_update_tool, doctor_lookup_tool, patient_lookup_tool


def get_coordination_agent(llm):
    return Agent(
        role="Treatment Coordination Specialist",
        goal="Coordinate patient care by looking up available doctors in the database, generating care briefings, and updating patient records with treatment assignments",
        backstory="You are the care coordination specialist. When a patient has been triaged and assigned a bed, you look up available doctors from the hospital database, match them to the patient needs, and update the patient record with the assigned doctor. You perform real database operations.",
        tools=[patient_update_tool, doctor_lookup_tool, patient_lookup_tool],
        llm=llm,
        verbose=True,
        allow_delegation=False,
        max_iter=5
    )
