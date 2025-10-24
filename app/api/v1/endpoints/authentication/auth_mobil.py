from fastapi import APIRouter, HTTPException, Request, Depends, Body, Response, Cookie
from pydantic import BaseModel
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from app.core.config import settings
from app.services.auth_service import AuthService
from app.models.schemas import UserInDB
from app.core.security import create_access_token, create_refresh_token, decode_access_token, decode_refresh_token
from app.utils.logger import logger  # Importer le logger global
from jose import jwt, JWTError
import traceback
import uuid
from bson import ObjectId  # Add this import
from app.models.database import db  # Add this import

# Import rate limiting components
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/api/v1/auth/mobile", tags=["auth-mobile"])

# Initialize the rate limiter
limiter = Limiter(key_func=get_remote_address)

# Configuration OAuth
config = Config()
oauth = OAuth(config)
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid profile email',
        'token_endpoint_auth_method': 'client_secret_post'
    }
)

# Add Facebook OAuth configuration
oauth.register(
    name="facebook",
    client_id=settings.FACEBOOK_CLIENT_ID,
    client_secret=settings.FACEBOOK_CLIENT_SECRET,
    authorize_url="https://www.facebook.com/v10.0/dialog/oauth",
    authorize_params=None,
    access_token_url="https://graph.facebook.com/v10.0/oauth/access_token",
    access_token_params=None,
    client_kwargs={"scope": "email"},
)

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.get("/login/google")
@limiter.limit("5/minute")
async def login(request: Request):
    request_id = str(uuid.uuid4())  # Identifiant unique pour la requête
    try:
        redirect_uri = settings.GOOGLE_REDIRECT_URI_MOBILE
        logger.info("Login initiated", extra={"request_id": request_id, "redirect_uri": redirect_uri})
        return await oauth.google.authorize_redirect(request, redirect_uri)
    except Exception as e:
        logger.error(
            "Login error",
            extra={
                "request_id": request_id,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
        )
        raise HTTPException(status_code=500, detail="Login failed")

@router.get("/login/facebook")
@limiter.limit("5/minute")
async def login_facebook(request: Request):
    request_id = str(uuid.uuid4())  # Identifiant unique pour la requête
    try:
        redirect_uri = settings.FACEBOOK_REDIRECT_URI_MOBILE  # Use mobile redirect URI
        logger.info("Facebook login initiated", extra={"request_id": request_id, "redirect_uri": redirect_uri})
        return await oauth.facebook.authorize_redirect(request, redirect_uri)
    except Exception as e:
        logger.error(
            "Facebook login error",
            extra={
                "request_id": request_id,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
        )
        raise HTTPException(status_code=500, detail="Facebook login failed")

@router.get("/callback/google")
@limiter.limit("5/minute")
async def callback(request: Request, response: Response):
    request_id = str(uuid.uuid4())  # Identifiant unique pour la requête
    try:
        token = await oauth.google.authorize_access_token(request)
        userinfo = token.get("userinfo")
        
        if not userinfo:
            logger.error(
                "User info missing in OAuth callback",
                extra={"request_id": request_id}
            )
            raise HTTPException(status_code=400, detail="User info missing")
        
        auth_service = AuthService()
        user = await auth_service.get_or_create_user(userinfo)
        
        access_token = create_access_token(data={"sub": user.email})
        refresh_token = create_refresh_token(data={"sub": user.email})
        
        # Update the refresh token in the database
        await auth_service.update_refresh_token(user.email, refresh_token)
        
        user_data = user.model_dump(by_alias=True)
        user_data["_id"] = str(user_data["_id"])
        
        # Fetch roles from the roles collection
        user_data["roles"] = [str(role_id) for role_id in user_data["roles"]]
        roles = await db.roles.find({"_id": {"$in": [ObjectId(role_id) for role_id in user_data["roles"]]}}).to_list(length=None)
        user_data["roles"] = [{"_id": str(role["_id"]), "name": role["name"], "permissions": role["permissions"]} for role in roles]
        
        logger.info(
            "User logged in successfully",
            extra={"request_id": request_id, "email": user.email}
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,  # Include refresh token in response body
            "token_type": "bearer",
            "user": user_data
        }
    except HTTPException as http_exc:
        logger.error("HTTP error", extra={"request_id": request_id, "detail": http_exc.detail})
        raise http_exc
    except Exception as e:
        logger.error("OAuth error", extra={"request_id": request_id, "error": str(e), "traceback": traceback.format_exc()})
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/callback/facebook")
@limiter.limit("5/minute")
async def callback_facebook(request: Request, response: Response):
    request_id = str(uuid.uuid4())  # Identifiant unique pour la requête
    try:
        token = await oauth.facebook.authorize_access_token(request)
        userinfo = await oauth.facebook.get("https://graph.facebook.com/me?fields=id,name,email,picture", token=token)
        
        if not userinfo:
            logger.error(
                "User info missing in Facebook OAuth callback",
                extra={"request_id": request_id}
            )
            raise HTTPException(status_code=400, detail="User info missing")
        
        auth_service = AuthService()
        user = await auth_service.get_or_create_user(userinfo.json())
        
        access_token = create_access_token(data={"sub": user.email})
        refresh_token = create_refresh_token(data={"sub": user.email})
        
        # Update the refresh token in the database
        await auth_service.update_refresh_token(user.email, refresh_token)
        
        user_data = user.model_dump(by_alias=True)
        user_data["_id"] = str(user_data["_id"])
        
        # Fetch roles from the roles collection
        user_data["roles"] = [str(role_id) for role_id in user_data["roles"]]
        roles = await db.roles.find({"_id": {"$in": [ObjectId(role_id) for role_id in user_data["roles"]]}}).to_list(length=None)
        user_data["roles"] = [{"_id": str(role["_id"]), "name": role["name"], "permissions": role["permissions"]} for role in roles]
        
        logger.info(
            "User logged in successfully via Facebook",
            extra={"request_id": request_id, "email": user.email}
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,  # Include refresh token in response body
            "token_type": "bearer",
            "user": user_data
        }
    except HTTPException as http_exc:
        logger.error("HTTP error", extra={"request_id": request_id, "detail": http_exc.detail})
        raise http_exc
    except Exception as e:
        logger.error("OAuth error", extra={"request_id": request_id, "error": str(e), "traceback": traceback.format_exc()})
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/decode-token")
async def decode_token(token: str):
    try:
        payload = decode_access_token(token)
        return {"user_data": payload}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/me",
    summary="Retrieve a user by access token", 
    description="Retrieve a user by access tokens",
    responses={
        401: {"description": "Invalid token"},
        404: {"description": "User not found"}
    })
async def me(token: str):
    try:
        payload = decode_access_token(token)
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        auth_service = AuthService()
        user = await auth_service.get_user_by_email(email)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user.model_dump(by_alias=True)
        user_data["_id"] = str(user_data["_id"])
        user_data["roles"] = [str(role_id) for role_id in user_data["roles"]]  # Convert roles to list of strings
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user_data
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/refresh")
async def refresh_token(request: RefreshTokenRequest = Body(None), refresh_token: str = Cookie(None)):
    try:
        if request and request.refresh_token:
            token = request.refresh_token
        elif refresh_token:
            token = refresh_token
        else:
            raise HTTPException(status_code=400, detail="Refresh token missing")
        
        payload = decode_refresh_token(token)
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        auth_service = AuthService()
        user = await auth_service.get_user_by_email(email)
        if user is None or user.refresh_token != token:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        access_token = create_access_token(data={"sub": user.email})
        new_refresh_token = create_refresh_token(data={"sub": user.email})
        
        # Update the refresh token in the database
        await auth_service.update_refresh_token(user.email, new_refresh_token)
        
        user_data = user.model_dump(by_alias=True)
        user_data["_id"] = str(user_data["_id"])
        user_data["refresh_token"] = new_refresh_token  # Include the new refresh token in the user info
        
        # Ensure roles field is included
        if "roles" not in user_data:
            user_data["roles"] = []
        
        # Fetch roles from the roles collection
        user_data["roles"] = [str(role_id) for role_id in user_data["roles"]]
        roles = await db.roles.find({"_id": {"$in": [ObjectId(role_id) for role_id in user_data["roles"]]}}).to_list(length=None)
        user_data["roles"] = [{"_id": str(role["_id"]), "name": role["name"], "permissions": role["permissions"]} for role in roles]
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "user": user_data  # Include user info in the response
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/logout")
async def logout(request: RefreshTokenRequest = Body(...)):
    try:
        if not request.refresh_token:
            raise HTTPException(status_code=400, detail="Refresh token missing")
        
        payload = decode_refresh_token(request.refresh_token)
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        auth_service = AuthService()
        user = await auth_service.get_user_by_email(email)
        if user is None or user.refresh_token != request.refresh_token:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Update the refresh token in the database to None
        await auth_service.update_refresh_token(user.email, None)
        
        return {"detail": "Successfully logged out"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
