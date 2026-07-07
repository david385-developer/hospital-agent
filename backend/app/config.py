# backend/app/config.py
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # MongoDB settings
    mongodb_uri: str = Field(alias="MONGODB_URI", default="mongodb://localhost:27017/hospital_ops")
    
    # AI settings
    groq_api_key: str = Field(alias="GROQ_API_KEY", default="")
    
    @property
    def GROQ_API_KEY(self) -> str:
        return self.groq_api_key
    
    # Cloudinary settings
    cloudinary_cloud_name: str = Field(alias="CLOUDINARY_CLOUD_NAME", default="")
    cloudinary_api_key: str = Field(alias="CLOUDINARY_API_KEY", default="")
    cloudinary_api_secret: str = Field(alias="CLOUDINARY_API_SECRET", default="")
    
    # Authentication settings
    jwt_secret: str = Field(alias="JWT_SECRET", default="super_secret_jwt_signing_key_change_in_production")
    jwt_algorithm: str = Field(alias="JWT_ALGORITHM", default="HS256")
    jwt_expiration_hours: int = Field(alias="JWT_EXPIRATION_HOURS", default=24)
    
    # ChromaDB settings
    chroma_persist_dir: str = Field(alias="CHROMA_PERSIST_DIR", default="./chroma_db")
    
    # Enable reading from .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Instantiate settings
settings = Settings()
