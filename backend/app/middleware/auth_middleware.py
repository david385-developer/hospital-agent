# backend/app/middleware/auth_middleware.py
import logging
from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from app.config import settings
from app.database.mongodb import get_database

logger = logging.getLogger("hospital_ops.auth_middleware")
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Decodes the JWT token from the Authorization header and fetches the current user from MongoDB.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the JWT token
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError as e:
        logger.warning(f"JWT decode failed: {e}")
        raise credentials_exception

    db = get_database()
    user = await db["users"].find_one({"email": email})
    if user is None:
        logger.warning(f"User not found in database for email: {email}")
        raise credentials_exception

    # Remove password hash for safety when passing around
    user["_id"] = str(user["_id"])
    if "password_hash" in user:
        del user["password_hash"]
        
    return user

class RoleChecker:
    """
    Dependency generator to check if the current user has required roles.
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_current_user)):
        role = current_user.get("role")
        # Admin has access to everything
        if role == "Admin":
            return current_user
            
        if role not in self.allowed_roles:
            logger.warning(f"Access denied for user {current_user.get('email')} with role {role}. Allowed: {self.allowed_roles}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
        return current_user
