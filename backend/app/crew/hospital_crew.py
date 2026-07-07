from crewai import Crew, Process
from app.agents.emergency_agent import get_emergency_agent
from app.agents.report_agent import get_report_agent
from app.agents.priority_agent import get_priority_agent
from app.agents.bed_allocation_agent import get_bed_allocation_agent
from app.agents.risk_review_agent import get_risk_agent
from app.agents.coordination_agent import get_coordination_agent
from app.tasks.crew_tasks import (
    create_intake_task,
    create_report_task,
    create_priority_task,
    create_bed_task,
    create_risk_task,
    create_coordination_task
)

AGENT_NAMES = [
    "Emergency Intake Agent",
    "Medical Report Analyzer",
    "Triage Priority Agent",
    "Resource Allocation Agent",
    "Risk Monitor Agent",
    "Care Coordination Agent"
]

def run_hospital_crew(patient_data: dict, llm) -> dict:
    patient_id = patient_data.get("patient_id", "unknown")
    patient_json = str(patient_data)

    intake_agent = get_emergency_agent(llm)
    report_agent = get_report_agent(llm)
    priority_agent = get_priority_agent(llm)
    bed_agent = get_bed_allocation_agent(llm)
    risk_agent = get_risk_agent(llm)
    coord_agent = get_coordination_agent(llm)

    task1 = create_intake_task(patient_json, intake_agent)
    task2 = create_report_task(patient_id, report_agent)
    task3 = create_priority_task(patient_id, "{task1.output}", priority_agent)
    task4 = create_bed_task(patient_id, "{task3.output}", bed_agent)
    task5 = create_risk_task(patient_id, "{task1.output} {task3.output} {task4.output}", risk_agent)
    task6 = create_coordination_task(patient_id, "{task4.output}", coord_agent)

    crew = Crew(
        agents=[intake_agent, report_agent, priority_agent, bed_agent, risk_agent, coord_agent],
        tasks=[task1, task2, task3, task4, task5, task6],
        process=Process.sequential,
        verbose=True
    )

    result = crew.kickoff()
    return result
