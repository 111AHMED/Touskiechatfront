# app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1.endpoints.authentication.auth import router as auth_router
from app.api.v1.endpoints.authentication.auth_mobil import router as auth_router_mobil
# from app.api.v1.endpoints.products import router as products_router

# Create a main router for version 1 of the API
router = APIRouter(prefix="/api/v1")

# Include all endpoint routers
router.include_router(auth_router)

#router.include_router(auth_router_mobil)

#router.include_router(products_router)