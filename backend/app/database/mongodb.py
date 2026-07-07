# backend/app/database/mongodb.py
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from app.config import settings

logger = logging.getLogger("hospital_ops.mongodb")

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_instance = MongoDB()

# Synchronous pymongo client and db instance for CrewAI tools and synchronous SSE streaming
sync_client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
_uri_parts = settings.mongodb_uri.split('/')
_db_name = None
if len(_uri_parts) > 3:
    _db_name = _uri_parts[-1].split('?')[0]
if not _db_name or _db_name == "" or "mongodb.net" in _db_name:
    _db_name = "hospital_ops"
db = sync_client[_db_name]

async def connect_to_mongo():
    """
    Establishes a connection to MongoDB Atlas or local MongoDB using the configured URI.
    """
    try:
        logger.info("Connecting to MongoDB...")
        db_instance.client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        
        # Safe database name extraction
        uri_parts = settings.mongodb_uri.split('/')
        db_name = None
        if len(uri_parts) > 3:
            db_name = uri_parts[-1].split('?')[0]
        
        if not db_name or db_name == "" or "mongodb.net" in db_name:
            db_name = "hospital_ops"
            
        db_instance.db = db_instance.client[db_name]
        
        # Ping database to verify connection with a short 5s timeout
        await db_instance.client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB database: {db_name}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB within 5s: {e}")
        # Do not raise here so Uvicorn can proceed to bind to the port on cloud platforms like Render


async def close_mongo_connection():
    """
    Closes the MongoDB connection pool.
    """
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    """
    Helper function to access the active database instance.
    """
    if db_instance.db is None:
        raise RuntimeError("Database connection is not initialized. Call connect_to_mongo() first.")
    return db_instance.db
