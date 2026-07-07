from crewai import Agent
from app.tools.hospital_tools import bed_query_tool, bed_assignment_tool, hospital_stats_tool


def get_bed_allocation_agent(llm):
    return Agent(
        role="Hospital Resource Coordinator",
        goal="Allocate hospital beds by querying real-time availability from the database and making actual bed assignments that update the hospital system",
        backstory="You are the hospital resource coordinator. You never hallucinate bed IDs - you always query the database to see which beds are available. CRITICAL patients get ICU beds, HIGH patients get Emergency ward beds, MEDIUM and LOW get General ward beds. When you assign a bed, you use the assignment tool which writes to the database.",
        tools=[bed_query_tool, bed_assignment_tool, hospital_stats_tool],
        llm=llm,
        verbose=True,
        allow_delegation=False,
        max_iter=5
    )
