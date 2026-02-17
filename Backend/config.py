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
    
    # Policy Configuration - Thresholds (College Prototype - Reduced Values)
    BANDWIDTH_THRESHOLD_MB: int = int(os.getenv("BANDWIDTH_THRESHOLD_MB", "100"))  # Reduced from 500 to 100
    CPU_THRESHOLD_PERCENT: int = int(os.getenv("CPU_THRESHOLD_PERCENT", "60"))     # Reduced from 80 to 60
    MEMORY_THRESHOLD_PERCENT: int = int(os.getenv("MEMORY_THRESHOLD_PERCENT", "70"))  # Reduced from 85 to 70
    DISK_THRESHOLD_PERCENT: int = int(os.getenv("DISK_THRESHOLD_PERCENT", "80"))    # Reduced from 90 to 80
    CONNECTIONS_THRESHOLD: int = int(os.getenv("CONNECTIONS_THRESHOLD", "50"))     # Reduced from 100 to 50
    UPLOAD_RATE_THRESHOLD_MBPS: int = int(os.getenv("UPLOAD_RATE_THRESHOLD_MBPS", "25"))   # Reduced from 50 to 25
    DOWNLOAD_RATE_THRESHOLD_MBPS: int = int(os.getenv("DOWNLOAD_RATE_THRESHOLD_MBPS", "50"))  # Reduced from 100 to 50
    
    BLOCKED_KEYWORDS: List[str] = os.getenv(
        "BLOCKED_KEYWORDS", 
        "torrent,proxy,nmap,wireshark,metasploit"
    ).split(",")
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173"
    ).split(",")

    # Ensure common dev origins are included (localhost vs 127.0.0.1)
    _expanded = set()
    for origin in ALLOWED_ORIGINS:
        origin = origin.strip()
        if not origin:
            continue
        _expanded.add(origin)
        # add 127.0.0.1 equivalent when localhost present
        if 'localhost' in origin:
            _expanded.add(origin.replace('localhost', '127.0.0.1'))

    # If in debug mode, allow wildcard to simplify development
    if os.getenv('DEBUG', 'True').lower() == 'true':
        _expanded.add('*')

    ALLOWED_ORIGINS = list(_expanded)


# Global settings instance
settings = Settings()
