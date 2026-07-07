# backend/app/database/chromadb.py
import os
import logging
import chromadb
from app.config import settings

logger = logging.getLogger("hospital_ops.chromadb")

class ChromaDBManager:
    client: chromadb.PersistentClient = None
    collection = None

chroma_instance = ChromaDBManager()

def connect_to_chroma():
    """
    Initializes a persistent ChromaDB client and creates or gets the medical_reports collection.
    """
    try:
        logger.info(f"Connecting to ChromaDB at {settings.chroma_persist_dir}...")
        
        # Ensure target directory exists
        os.makedirs(settings.chroma_persist_dir, exist_ok=True)
        
        # Create persistent client
        chroma_instance.client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
        
        # Create or fetch medical_reports collection
        chroma_instance.collection = chroma_instance.client.get_or_create_collection(
            name="medical_reports"
        )
        logger.info("Successfully connected to ChromaDB. Collection 'medical_reports' initialized.")
    except Exception as e:
        logger.error(f"Failed to connect to ChromaDB: {e}")
        raise e

def get_chroma_client() -> chromadb.PersistentClient:
    """
    Returns the active ChromaDB client instance.
    """
    if chroma_instance.client is None:
        connect_to_chroma()
    return chroma_instance.client

def get_chroma_collection():
    """
    Returns the medical_reports collection.
    """
    if chroma_instance.collection is None:
        connect_to_chroma()
    return chroma_instance.collection
