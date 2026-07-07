# backend/app/services/rag_service.py
import uuid
import logging
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
from langchain.tools import tool
from app.database.chromadb import get_chroma_collection

logger = logging.getLogger("hospital_ops.rag_service")

# Initialize embedding model (cached globally)
logger.info("Loading sentence-transformers/all-MiniLM-L6-v2 model...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
logger.info("Sentence Transformer loaded successfully.")

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """
    Splits text into chunks of 500 characters with 50 characters overlap.
    """
    if not text:
        return []
    
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        # Ensure we always move forward, even if overlap matches or exceeds chunk_size
        step = chunk_size - overlap
        if step <= 0:
            step = 1
        start += step
        
    return chunks

def ingest_report_text(patient_id: str, report_id: str, text: str):
    """
    Chunks report text, embeds the chunks, and indexes them in ChromaDB.
    """
    try:
        chunks = chunk_text(text)
        if not chunks:
            logger.warning(f"No text chunks generated for report_id: {report_id}")
            return
            
        logger.info(f"Ingesting {len(chunks)} chunks into ChromaDB for report: {report_id} and patient: {patient_id}...")
        collection = get_chroma_collection()
        
        ids = []
        embeddings = []
        metadatas = []
        documents = []
        
        # Calculate embeddings for all chunks in batch
        chunk_embeddings = embedding_model.encode(chunks).tolist()
        
        for idx, (chunk, embedding) in enumerate(zip(chunks, chunk_embeddings)):
            chunk_id = f"{report_id}_chunk_{idx}"
            ids.append(chunk_id)
            embeddings.append(embedding)
            documents.append(chunk)
            metadatas.append({
                "patient_id": patient_id,
                "report_id": report_id,
                "chunk_index": idx
            })
            
        # Add to ChromaDB collection
        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
        logger.info(f"Successfully indexed {len(ids)} chunks in ChromaDB for report {report_id}.")
    except Exception as e:
        logger.error(f"Failed to ingest report in ChromaDB: {e}")
        raise e

def query_patient_reports(query: str, patient_id: str, top_k: int = 5) -> str:
    """
    Queries ChromaDB for chunks related to a patient_id, returning a merged context string.
    """
    try:
        logger.info(f"Querying reports for patient {patient_id} with query: '{query}'")
        collection = get_chroma_collection()
        query_vector = embedding_model.encode([query])[0].tolist()
        
        results = collection.query(
            query_embeddings=[query_vector],
            where={"patient_id": patient_id},
            n_results=top_k
        )
        
        documents = results.get("documents", [[]])[0]
        if not documents:
            logger.info(f"No matching report documents found in ChromaDB for patient: {patient_id}")
            return "No matching records or medical reports found for this patient."
            
        # Join retrieved text blocks
        context = "\n---\n".join(documents)
        logger.info(f"Retrieved {len(documents)} chunks from ChromaDB.")
        return context
    except Exception as e:
        logger.error(f"Error querying ChromaDB: {e}")
        return f"Failed to retrieve report information due to system error: {str(e)}"

def create_patient_retriever_tool(patient_id: str):
    """
    Generates a structured LangChain tool that searches ChromaDB for a specific patient's documents.
    """
    # Create a unique name for the tool per patient execution to avoid agent schema caching conflicts
    tool_name = f"retrieve_patient_reports_{patient_id.replace('-', '_')}"
    
    @tool(tool_name)
    def retrieve_patient_reports(query: str) -> str:
        """
        Use this tool to search the patient's medical history, lab work, scan summaries, 
        and overall clinician notes uploaded in their medical reports.
        """
        return query_patient_reports(query, patient_id)
        
    return retrieve_patient_reports
