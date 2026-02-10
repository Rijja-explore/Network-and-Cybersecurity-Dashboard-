"""
Configuration module for the monitoring backend.
Loads environment variables and provides application settings.
"""
import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """Application configuration settings."""
    
    # Application Settings
    APP_NAME: str = os.getenv("APP_NAME", "Department Network Monitoring Dashboard")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # Database Settings
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "./monitoring.db")
    
    # Security Settings (JWT-ready structure)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Policy Configuration
    BANDWIDTH_THRESHOLD_MB: int = int(os.getenv("BANDWIDTH_THRESHOLD_MB", "500"))
    BLOCKED_KEYWORDS: List[str] = os.getenv(
        "BLOCKED_KEYWORDS", 
        "torrent,proxy,nmap,wireshark,metasploit"
    ).split(",")
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173"
    ).split(",")


# Global settings instance
settings = Settings()
