# backend/app/main.py
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.database.chromadb import connect_to_chroma

# Setup Routers
from app.routes.auth import router as auth_router
from app.routes.patients import router as patients_router
from app.routes.beds import router as beds_router
from app.routes.reports import router as reports_router
from app.routes.ai_analysis import router as ai_router
from app.routes.dashboard import router as dashboard_router
from app.routes.agent_chat import router as agent_router

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("hospital_ops.main")
UPLOADS_DIR = Path("./uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages FastAPI startup and shutdown lifecycle hooks.
    Initializes MongoDB pool and connects to the Chroma Vector Database.
    """
    logger.info("Initializing application dependencies...")
    # 1. Connect MongoDB
    await connect_to_mongo()
    # 2. Connect ChromaDB
    connect_to_chroma()
    
    yield
    
    logger.info("Shutting down application resources...")
    # Close database connections
    await close_mongo_connection()
    logger.info("Shutdown sequence completed.")

app = FastAPI(
    title="AI Hospital Operations & Emergency Coordination Platform",
    description="Backend services for triage analysis, bed management, and report processing.",
    version="1.0.0",
    lifespan=lifespan
)

# Setup CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Host Uploaded PDF static files locally if Cloudinary falls back
app.mount("/static", StaticFiles(directory=str(UPLOADS_DIR)), name="static")

# Mount API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(patients_router, prefix="/api")
app.include_router(beds_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(agent_router, prefix="/api")

@app.get("/health")
async def health_check():
    """
    Returns standard system health confirmation.
    """
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "environment": os.getenv("ENV", "development")
        },
        "message": "System is operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
