from crewai import Agent
from app.tools.hospital_tools import hospital_stats_tool, patient_lookup_tool


def get_priority_agent(llm):
    return Agent(
        role="Emergency Triage Coordinator",
        goal="Determine emergency priority levels by querying the current hospital state, checking queue length, bed availability, and calculating urgency scores based on real operational data",
        backstory="You are an experienced triage coordinator who makes priority decisions based on real hospital data. You query hospital statistics to understand current load before assigning priority. You never assume - you always check the database first.",
        tools=[hospital_stats_tool, patient_lookup_tool],
        llm=llm,
        verbose=True,
        allow_delegation=False,
        max_iter=5
    )
