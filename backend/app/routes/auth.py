# backend/app/routes/auth.py
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from app.database.mongodb import get_database
from app.models.user import UserRegister, UserLogin, UserResponse, UserInDB
from app.services.auth_service import get_password_hash, verify_password, create_access_token
from app.middleware.auth_middleware import get_current_user

logger = logging.getLogger("hospital_ops.routes.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
async def register(user_data: UserRegister):
    """
    Registers a new user inside the hospital operations database.
    """
    db = get_database()
    
    # Check if email already registered
    existing_user = await db["users"].find_one({"email": user_data.email})
    if existing_user:
        logger.warning(f"Registration failed: Email {user_data.email} already exists.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )
        
    try:
        # Create hash and save to db
        pwd_hash = get_password_hash(user_data.password)
        new_user = UserInDB(
            name=user_data.name,
            email=user_data.email,
            role=user_data.role,
            password_hash=pwd_hash,
            created_at=datetime.utcnow()
        )
        
        result = await db["users"].insert_one(new_user.model_dump())
        inserted_id = str(result.inserted_id)
        
        logger.info(f"User {user_data.email} registered successfully with ID {inserted_id}")
        
        # Prepare response
        user_resp = {
            "id": inserted_id,
            "name": user_data.name,
            "email": user_data.email,
            "role": user_data.role,
            "created_at": new_user.created_at.isoformat()
        }
        
        return {
            "success": True,
            "data": user_resp,
            "message": "User registered successfully"
        }
    except Exception as e:
        logger.error(f"Error during user registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User registration failed due to a database error"
        )

@router.post("/login")
async def login(credentials: UserLogin):
    """
    Authenticates user and returns a signed JWT token.
    """
    db = get_database()
    
    user = await db["users"].find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        logger.warning(f"Login failed: Invalid credentials for {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    try:
        token = create_access_token(
            email=user["email"],
            role=user["role"],
            name=user["name"]
        )
        
        auth_data = {
            "token": token,
            "token_type": "bearer",
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        }
        
        logger.info(f"User {credentials.email} logged in successfully.")
        return {
            "success": True,
            "data": auth_data,
            "message": "Login successful"
        }
    except Exception as e:
        logger.error(f"Error during login token generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login process encountered an error"
        )

@router.get("/me")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """
    Returns profile information of the currently authenticated user.
    """
    return {
        "success": True,
        "data": current_user,
        "message": "Profile retrieved successfully"
    }
