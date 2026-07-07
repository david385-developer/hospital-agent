# backend/seed_data.py
import asyncio
import logging
from datetime import datetime
from app.config import settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.services.auth_service import get_password_hash
from app.models.bed import BedInDB

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("seed")

async def seed_beds():
    db = get_database()
    
    logger.info("Clearing existing beds collection...")
    await db["beds"].delete_many({})
    
    beds = []
    
    # 1. 10 ICU Beds (ICU-101 to ICU-110)
    for i in range(101, 111):
        bed_id = f"ICU-{i}"
        beds.append(BedInDB(
            bed_id=bed_id,
            ward_type="ICU",
            bed_number=str(i),
            status="Available"
        ).model_dump())
        
    # 2. 15 Emergency Beds (EMR-201 to EMR-215)
    for i in range(201, 216):
        bed_id = f"EMR-{i}"
        beds.append(BedInDB(
            bed_id=bed_id,
            ward_type="Emergency",
            bed_number=str(i),
            status="Available"
        ).model_dump())
        
    # 3. 30 General Beds (GEN-301 to GEN-330)
    for i in range(301, 331):
        bed_id = f"GEN-{i}"
        beds.append(BedInDB(
            bed_id=bed_id,
            ward_type="General",
            bed_number=str(i),
            status="Available"
        ).model_dump())
        
    logger.info(f"Inserting {len(beds)} beds into the database...")
    await db["beds"].insert_many(beds)
    logger.info("Beds successfully seeded!")

async def seed_admin():
    db = get_database()
    
    # Check if admin already exists
    admin_email = "admin@hospital.com"
    existing = await db["users"].find_one({"email": admin_email})
    if existing:
        logger.info(f"Admin user {admin_email} already exists. Skipping user creation.")
        return
        
    logger.info("Creating default admin user...")
    pwd_hash = get_password_hash("admin123")
    
    admin_user = {
        "name": "Admin User",
        "email": admin_email,
        "role": "Admin",
        "password_hash": pwd_hash,
        "created_at": datetime.utcnow()
    }
    
    await db["users"].insert_one(admin_user)
    logger.info(f"Default admin created: Email: {admin_email}, Password: admin123")

async def main():
    logger.info("Starting seed script...")
    await connect_to_mongo()
    
    try:
        await seed_beds()
        await seed_admin()
        logger.info("Database seeding successfully completed!")
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
