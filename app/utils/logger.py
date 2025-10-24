import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from pythonjsonlogger import jsonlogger
from app.core.config import settings

# Create logs directory
logs_dir = Path("logs")
logs_dir.mkdir(exist_ok=True)

# Configure root logger to suppress MongoDB debug logs
logging.getLogger("pymongo").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)

# Configure logger
logger = logging.getLogger("ecommerce-api")
logger.setLevel(logging.DEBUG)  # Base level (handlers will filter)

# JSON formatter for logs
formatter = jsonlogger.JsonFormatter(
    "%(asctime)s %(name)s %(levelname)s %(module)s %(lineno)d %(message)s"
)

# Console handler (development mode)
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(formatter)
console_handler.setLevel(logging.INFO)  # Only INFO and above in console

# Error handler (ERROR and CRITICAL)
error_handler = RotatingFileHandler(
    logs_dir / "errors.log",
    maxBytes=10 * 1024 * 1024,
    backupCount=5,
    encoding="utf-8"
)
error_handler.setFormatter(formatter)
error_handler.setLevel(logging.ERROR)

# Warning handler (WARNING only)
warning_handler = RotatingFileHandler(
    logs_dir / "warnings.log",
    maxBytes=10 * 1024 * 1024,
    backupCount=5,
    encoding="utf-8"
)
warning_handler.setFormatter(formatter)
warning_handler.setLevel(logging.WARNING)

# Add handlers based on environment
if settings.ENV == "development":
    logger.addHandler(console_handler)
    logger.setLevel(logging.INFO)
elif settings.ENV == "prod":
    logger.addHandler(error_handler)
    logger.addHandler(warning_handler)
    logger.setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


# Startup log example
logger.info("Logger initialized", extra={"env": settings.ENV})