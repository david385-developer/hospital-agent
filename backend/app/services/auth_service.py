# backend/app/services/auth_service.py
from datetime import datetime, timedelta
import logging
from typing import Optional
import jwt
from app.config import settings

logger = logging.getLogger("hospital_ops.auth_service")

import bcrypt

def get_password_hash(password: str) -> str:
    """
    Hashes a plain password using bcrypt directly.
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against its hashed value using bcrypt directly.
    """
    try:
        plain_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

def create_access_token(email: str, role: str, name: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a JWT access token containing the email, role, and name as payload claims.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
        
    to_encode = {
        "sub": email,
        "role": role,
        "name": name,
        "exp": expire
    }
    
    try:
        encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
        return encoded_jwt
    except Exception as e:
        logger.error(f"JWT creation failed: {e}")
        raise RuntimeError("Token generation failure")
