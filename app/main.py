from fastapi import FastAPI, Request
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import urlparse
from app.core.config import settings
from app.api.v1.endpoints.authentication.auth import router as auth_router
from app.api.v1.endpoints.authentication.auth_mobil import router as auth_router_mobil

from app.middleware.error_handlers import global_error_handler

# Import rate limiting components
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()
print("app created")
# Initialize the rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Custom exception handler for rate limit exceeded
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."},
    )

# Middleware pour gérer les sessions
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.ACCESS_SECRET_KEY,
    session_cookie="session",
    max_age=3600
)

# Derive frontend origin (scheme + host + port) from FRONTEND_CALLBACK_URI for CORS
frontend_origin = settings.FRONTEND_CALLBACK_URI
try:
    parsed = urlparse(settings.FRONTEND_CALLBACK_URI)
    if parsed.scheme and parsed.netloc:
        frontend_origin = f"{parsed.scheme}://{parsed.netloc}"
except Exception:
    frontend_origin = settings.FRONTEND_CALLBACK_URI

logger.info(f"Setting CORS allow_origins to: {frontend_origin}")
# Ensure common dev origins are allowed in addition to parsed callback origin
allowed_origins = [frontend_origin]
if "http://localhost:3000" not in allowed_origins:
    allowed_origins.append("http://localhost:3000")
if "http://127.0.0.1:3000" not in allowed_origins:
    allowed_origins.append("http://127.0.0.1:3000")

logger.info(f"Final CORS allow_origins list: {allowed_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ajouter le middleware global
app.middleware("http")(global_error_handler)
# Inclure les routes
app.include_router(auth_router)
#app.include_router(auth_router_mobil)

@app.get("/")
async def root():
    return {"message": "Touskie"}

# Example of applying rate limiting to a specific route
@app.get("/limited")
@limiter.limit("10/second")
async def limited_route(request: Request):
    return {"message": "This route is rate limited to 10 requests per second"}