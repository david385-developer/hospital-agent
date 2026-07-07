from crewai import Agent
from app.tools.hospital_tools import rag_retriever_tool


def get_report_agent(llm):
    return Agent(
        role="Medical Document Analyzer",
        goal="Analyze uploaded medical reports by searching through the RAG vector database to extract critical clinical findings, vital signs, and diagnostic information",
        backstory="You are a clinical document analysis specialist. When you need to understand a patient's medical history, you search through the hospital's document database using semantic search. You find the most relevant sections of uploaded PDF reports and extract key clinical data.",
        tools=[rag_retriever_tool],
        llm=llm,
        verbose=True,
        allow_delegation=False,
        max_iter=5
    )
