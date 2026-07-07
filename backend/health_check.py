# backend/health_check.py
import asyncio
import os
import sys
import logging
import urllib.request
import json
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("health_check")

# Load environment variables
load_dotenv()

async def check_mongodb():
    logger.info("Checking MongoDB connection...")
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            logger.error("FAIL: MONGODB_URI environment variable is missing.")
            return False
            
        client = AsyncIOMotorClient(mongo_uri)
        # Ping
        await client.admin.command('ping')
        logger.info("PASS: MongoDB Atlas connection successful.")
        client.close()
        return True
    except Exception as e:
        logger.error(f"FAIL: MongoDB connection failed: {e}")
        return False

def check_chromadb():
    logger.info("Checking ChromaDB persistence...")
    try:
        import chromadb
        persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
        client = chromadb.PersistentClient(path=persist_dir)
        collection = client.get_or_create_collection("medical_reports")
        logger.info("PASS: ChromaDB PersistentClient connection successful.")
        return True
    except Exception as e:
        logger.error(f"FAIL: ChromaDB connection failed: {e}")
        return False

def check_groq():
    logger.info("Checking Groq API connection...")
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key or "your_" in groq_key:
        logger.error("FAIL: GROQ_API_KEY is missing or contains placeholder.")
        return False
        
    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {groq_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
        data = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": "Ping"}],
            "max_tokens": 5
        }
        req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if "choices" in res_data:
                logger.info("PASS: Groq API response verified successfully.")
                return True
        logger.error("FAIL: Groq API returned unexpected response format.")
        return False
    except Exception as e:
        logger.error(f"FAIL: Groq API request failed: {e}")
        return False

def check_cloudinary():
    logger.info("Checking Cloudinary configuration...")
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    
    if (not cloud_name or "your_" in cloud_name or
        not api_key or "your_" in api_key or
        not api_secret or "your_" in api_secret):
        logger.warning("WARNING: Cloudinary configuration is missing or placeholders. Using local storage fallback.")
        return True
        
    try:
        import cloudinary
        import cloudinary.api
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
        # Test request
        cloudinary.api.ping()
        logger.info("PASS: Cloudinary credentials verified successfully.")
        return True
    except Exception as e:
        logger.error(f"FAIL: Cloudinary validation failed: {e}")
        return False

def check_fastapi_server():
    logger.info("Checking FastAPI server health endpoint...")
    try:
        url = "http://localhost:8000/health"
        with urllib.request.urlopen(url, timeout=3) as response:
            res = json.loads(response.read().decode("utf-8"))
            if res.get("success") and res.get("data", {}).get("status") == "healthy":
                logger.info("PASS: FastAPI backend server is active and reporting healthy.")
                return True
        logger.error("FAIL: FastAPI server health check failed.")
        return False
    except Exception:
        logger.warning("INFO: Local FastAPI backend server is offline (normal if not started yet).")
        return True

async def main():
    logger.info("========================================")
    logger.info("Starting Aegis Platform Pre-Flight Check")
    logger.info("========================================")
    
    mongo_ok = await check_mongodb()
    chroma_ok = check_chromadb()
    groq_ok = check_groq()
    cloudinary_ok = check_cloudinary()
    server_ok = check_fastapi_server()
    
    logger.info("========================================")
    logger.info("Summary Statistics:")
    logger.info(f"MongoDB:      {'PASSED' if mongo_ok else 'FAILED'}")
    logger.info(f"ChromaDB:     {'PASSED' if chroma_ok else 'FAILED'}")
    logger.info(f"Groq API:     {'PASSED' if groq_ok else 'FAILED'}")
    logger.info(f"Cloudinary:   {'PASSED' if cloudinary_ok else 'FAILED'}")
    logger.info(f"Backend HTTP: {'PASSED' if server_ok else 'FAILED'}")
    logger.info("========================================")
    
    if not (mongo_ok and chroma_ok and groq_ok):
        logger.error("CRITICAL: Essential dependencies are failing. Fix keys or services before starting.")
        sys.exit(1)
    else:
        logger.info("SUCCESS: Platform pre-flight check complete. Safe to boot services.")

if __name__ == "__main__":
    asyncio.run(main())
