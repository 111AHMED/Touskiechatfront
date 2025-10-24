# app/api/v1/endpoints/test.py
from fastapi import APIRouter
from app.exceptions.custom_exceptions import UserNotFoundError

router = APIRouter(prefix="/api/v1", tags=["test"])

@router.get("/error")
async def trigger_error():
    raise UserNotFoundError("Test user not found")