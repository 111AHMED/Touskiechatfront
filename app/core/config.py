# app/core/config.py
from pydantic_settings import BaseSettings
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    MONGODB_URL: str
    DB_NAME: str
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str
    GOOGLE_REDIRECT_URI_MOBILE: str  
    FACEBOOK_CLIENT_ID: str  
    FACEBOOK_CLIENT_SECRET: str  
    FACEBOOK_REDIRECT_URI: str  
    FACEBOOK_REDIRECT_URI_MOBILE: str  
    ALGORITHM: str
    ENV: str
    ADMIN_EMAILS: str
    CREATOR_EMAILS: str
    ACCESS_SECRET_KEY: str 
    REFRESH_SECRET_KEY: str
    REFRESH_ALGORITHM: str
    FRONTEND_CALLBACK_URI: str
    ENVIRONMENT: str = "development"
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True

settings = Settings()
""" logger.debug(f"Admin emails: {settings.ADMIN_EMAILS}")
logger.debug(f"Creator emails: {settings.CREATOR_EMAILS}") """

