from crewai import Agent
from app.tools.hospital_tools import patient_lookup_tool, symptom_analysis_tool


def get_emergency_agent(llm):
    return Agent(
        role="Emergency Intake Processor",
        goal="Process incoming emergency patients by retrieving their records from the database and scoring their symptoms using the severity analyzer tool",
        backstory="You are an experienced emergency intake processor at a busy hospital. When a patient arrives, you immediately look up their record in the hospital database and run their symptoms through the severity scoring system. You never guess patient information - you always query the database first.",
        tools=[patient_lookup_tool, symptom_analysis_tool],
        llm=llm,
        verbose=True,
        allow_delegation=False,
        max_iter=5
    )
