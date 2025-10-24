# app/middleware/error_handler.py
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.utils.logger import logger
import traceback
from app.exceptions.custom_exceptions import UserNotFoundError, DatabaseConnectionError

async def global_error_handler(request: Request, call_next):
    try:
        return await call_next(request)
    except HTTPException as http_exc:
        logger.error(f"HTTP error: {http_exc.detail}")
        raise http_exc
    except UserNotFoundError as e:
        logger.error(f"User not found: {str(e)}")
        return JSONResponse(
            status_code=404,
            content={"detail": "User not found"},
        )
    except DatabaseConnectionError as e:
        logger.error(f"Database connection error: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={"detail": "Database connection failed"},
        )
    except Exception as e:
        logger.error(f"Unhandled error: {str(e)}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error"},
        )