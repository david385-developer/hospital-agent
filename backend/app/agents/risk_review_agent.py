from crewai import Agent
from app.tools.hospital_tools import hospital_stats_tool, alert_tool


def get_risk_agent(llm):
    return Agent(
        role="Operations Risk Monitor",
        goal="Monitor hospital-wide operations by querying real-time statistics from the database, identifying risks, and generating operational alerts that are stored in the system",
        backstory="You are the hospital operations supervisor. You query real hospital statistics from the database - you never assume occupancy numbers. When you detect a risk like ICU above 85 percent capacity, you generate alerts using the alert tool which stores them in the database.",
        tools=[hospital_stats_tool, alert_tool],
        llm=llm,
        verbose=True,
        allow_delegation=False,
        max_iter=5
    )
