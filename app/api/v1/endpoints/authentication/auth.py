from fastapi import APIRouter, HTTPException, Request, Response, Query, Cookie, Body, Depends, Header
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from app.core.config import settings
from app.services.auth_service import AuthService
from app.models.schemas import UserInDB, UserUpdate
from app.core.security import create_access_token, create_refresh_token, decode_access_token, decode_refresh_token, get_current_user
from app.utils.logger import logger
from jose import jwt, JWTError
import traceback
import uuid
import json
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.database import db
from urllib.parse import urlencode, quote
from fastapi.responses import JSONResponse
from app.utils.encoders import custom_jsonable_encoder
router = APIRouter(prefix="/api/v1/auth", tags=["auth-web"])
oauth = OAuth()

# Configure OAuth providers
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

oauth.register(
    name="facebook",
    client_id=settings.FACEBOOK_CLIENT_ID,
    client_secret=settings.FACEBOOK_CLIENT_SECRET,
    authorize_url="https://www.facebook.com/v10.0/dialog/oauth",
    access_token_url="https://graph.facebook.com/v10.0/oauth/access_token",
    client_kwargs={"scope": "email"},
)

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.get("/login/google")
async def login_google(request: Request, redirect_uri: str = Query(settings.FRONTEND_CALLBACK_URI)):
    request_id = str(uuid.uuid4())
    try:
        logger.info("Initiating Google login", extra={"request_id": request_id, "frontend_redirect_uri": redirect_uri})

        return await oauth.google.authorize_redirect(
            request,
            redirect_uri=settings.GOOGLE_REDIRECT_URI,
            state=redirect_uri   # Pass frontend redirect URI through state
        )
    except Exception as e:
        logger.error("Google login initiation failed",
                     extra={"request_id": request_id, "error": str(e), "frontend_redirect_uri": redirect_uri})
        raise HTTPException(status_code=500, detail="Login initiation failed")



@router.get("/callback/google")
async def callback_google(
    request: Request,
    response: Response,
    code: str = Query(...),
    state: str = None
):
    request_id = str(uuid.uuid4())
    logger.info("Google callback initiated", extra={"request_id": request_id, "state": state, "code": code})
    try:
        # Exchange code for tokens
        token = await oauth.google.authorize_access_token(request)
        logger.debug(f"Google OAuth token response: {json.dumps(token, indent=2)}")

        userinfo = token.get("userinfo")
        logger.debug(f"Google userinfo: {json.dumps(userinfo, indent=2)}")

        if not userinfo:
            logger.error("Missing user information from Google", extra={"request_id": request_id, "token": token})
            raise HTTPException(status_code=400, detail="Missing user information")

        # Process user authentication
        auth_service = AuthService()
        user = await auth_service.get_or_create_user(userinfo)
        access_token = create_access_token(data={"sub": user.email})
        refresh_token = create_refresh_token(data={"sub": user.email})

        # Update user's refresh token
        await auth_service.update_refresh_token(user.email, refresh_token)

        # Prepare user data
        user_data = user.model_dump(by_alias=True)
        user_data["_id"] = str(user_data["_id"])
        #user_data.pop("refresh_token", None)

        # Handle roles
        user_data.setdefault("roles", [])
        if user_data["roles"]:
            roles = await db.roles.find({
                "_id": {"$in": [ObjectId(rid) for rid in user_data["roles"]]},
            }).to_list(length=None)
            user_data["roles"] = [
                {"_id": str(r["_id"]), "name": r["name"], "permissions": r["permissions"]}
                for r in roles
            ]

        # Prepare redirect URL and strip sensitive fields from user_data
        user_data.pop("refresh_token", None)
        frontend_redirect = state or settings.FRONTEND_CALLBACK_URI
        user_data_json = json.dumps(user_data, default=str)
        user_data_encoded = quote(user_data_json)
        redirect_url = f"{frontend_redirect}?user={user_data_encoded}"

        # Build redirect response and attach cookies to it so browser receives them
        redirect_resp = RedirectResponse(url=redirect_url, status_code=303)
        # Refresh token (HttpOnly)
        redirect_resp.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.ENV == "production",
            samesite="Lax",
            max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60
        )
        # Access token (HttpOnly) - short lived
        redirect_resp.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=settings.ENV == "production",
            samesite="Lax",
            max_age=60 * 15  # 15 minutes
        )

        # Redirect to frontend
        frontend_redirect = state or settings.FRONTEND_CALLBACK_URI
        access_token_encoded = quote(access_token)
        token_type_encoded = quote("bearer")
        user_data_json = json.dumps(user_data, default=str)
        user_data_encoded = quote(user_data_json)

        # Redirect to frontend with user info only (tokens are stored in HttpOnly cookies)
        redirect_url = f"{frontend_redirect}?user={user_data_encoded}"

        # Log the final response data
        response_data = {
            "token_type": "bearer",
            "user": user_data,
            "redirect_url": redirect_url
        }
        logger.debug(f"Final response data: {json.dumps(response_data, indent=2, default=str)}")
        logger.info(f"Google auth successful for {user.email}", extra={"request_id": request_id})
        logger.info(f"Redirecting to frontend", extra={"request_id": request_id, "redirect_url": redirect_url})
        return redirect_resp

    except HTTPException as he:
        logger.error(f"HTTP error during Google callback: {str(he)}", extra={"request_id": request_id})
        raise he
    except Exception as e:
        logger.error(f"Unexpected error during Google callback: {str(e)}", extra={"request_id": request_id, "error": str(e)})
        error_redirect = f"{settings.FRONTEND_CALLBACK_URI}?error=auth_failed"
        logger.info(f"Redirecting to frontend with error", extra={"request_id": request_id, "redirect_url": error_redirect})
        return RedirectResponse(url=error_redirect, status_code=303)


@router.get("/login/facebook")
async def login_facebook(request: Request, redirect_uri: str = Query(settings.FRONTEND_CALLBACK_URI)):
    return await oauth.facebook.authorize_redirect(
        request,
        redirect_uri=settings.FACEBOOK_REDIRECT_URI,
        state=redirect_uri  # Ajouter le state
    )
@router.get("/callback/facebook")
async def callback_facebook(
    request: Request,
    response: Response,
    code: str = Query(...),
    state: str = None
):
    request_id = str(uuid.uuid4())
    logger.info("Facebook callback initiated", extra={"request_id": request_id, "state": state, "code": code})
    try:
        # Exchange code for tokens
        token = await oauth.facebook.authorize_access_token(request)
        userinfo_response = await oauth.facebook.get(
            "https://graph.facebook.com/me?fields=id,name,email,picture",
            token=token
        )
        userinfo = userinfo_response.json()

        if not userinfo:
            logger.error("Missing userinfo in Facebook callback",
                         extra={"request_id": request_id, "token": token})
            raise HTTPException(status_code=400, detail="Missing user information")

        # Process user authentication
        auth_service = AuthService()
        user = await auth_service.get_or_create_user(userinfo)

        # Generate tokens
        access_token = create_access_token(data={"sub": user.email})
        refresh_token = create_refresh_token(data={"sub": user.email})

        # Update user's refresh token
        await auth_service.update_refresh_token(user.email, refresh_token)

        # Prepare user data
        user_data = user.model_dump(by_alias=True)
        user_data["_id"] = str(user_data["_id"])

        # Handle roles
        user_data.setdefault("roles", [])
        if user_data["roles"]:
            roles = await db.roles.find({
                "_id": {"$in": [ObjectId(rid) for rid in user_data["roles"]]},
            }).to_list(length=None)
            user_data["roles"] = [
                {"_id": str(r["_id"]), "name": r["name"], "permissions": r["permissions"]}
                for r in roles
            ]

        # Remove refresh token from user payload and build redirect
        user_data.pop("refresh_token", None)
        frontend_redirect = state or settings.FRONTEND_CALLBACK_URI
        user_data_json = json.dumps(user_data, default=str)
        user_data_encoded = quote(user_data_json)
        redirect_url = f"{frontend_redirect}?user={user_data_encoded}"

        # Build redirect response and set cookies on it
        redirect_resp = RedirectResponse(url=redirect_url, status_code=303)
        redirect_resp.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.ENV == "production",
            samesite="lax",
            max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60
        )
        # Also set short lived access token cookie
        redirect_resp.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=settings.ENV == "production",
            samesite="lax",
            max_age=60 * 15
        )

        response_data = {
            "token_type": "bearer",
            "user": user_data,
            "redirect_url": redirect_url
        }
        logger.debug(f"Final response data: {json.dumps(response_data, indent=2, default=str)}")
        logger.info(f"Facebook auth successful for {user.email}", extra={"request_id": request_id})
        logger.info(f"Redirecting to frontend", extra={"request_id": request_id, "redirect_url": redirect_url})
        return redirect_resp

    except HTTPException as he:
        logger.error(f"HTTP error during Facebook callback: {str(he)}", extra={"request_id": request_id})
        raise he
    except Exception as e:
        logger.error(f"Unexpected error during Facebook callback: {str(e)}", extra={"request_id": request_id, "error": str(e)})
        error_redirect = f"{settings.FRONTEND_CALLBACK_URI}?error=auth_failed"
        logger.info(f"Redirecting to frontend with error", extra={"request_id": request_id, "redirect_url": error_redirect})
        return RedirectResponse(url=error_redirect, status_code=303)



@router.post("/refresh_cookies")
async def refresh_cookies(response: Response, refresh_token: str = Cookie(None)):
    try:
        if not refresh_token:
            raise HTTPException(status_code=400, detail="Refresh token missing")

        payload = decode_refresh_token(refresh_token)
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        auth_service = AuthService()
        user = await auth_service.get_user_by_email(email)
        if user is None or user.refresh_token != refresh_token:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # Generate new tokens
        access_token = create_access_token(data={"sub": user.email})
        new_refresh_token = create_refresh_token(data={"sub": user.email})

        # Update refresh token in database
        await auth_service.update_refresh_token(user.email, new_refresh_token)

        # Prepare user data
        user_data = user.model_dump(by_alias=True)
        user_data["_id"] = str(user_data["_id"])

        # Handle roles
        user_data.setdefault("roles", [])
        if user_data["roles"]:
            roles = await db.roles.find({
                "_id": {"$in": [ObjectId(rid) for rid in user_data["roles"]]},
            }).to_list(length=None)
            user_data["roles"] = [
                {"_id": str(r["_id"]), "name": r["name"], "permissions": r["permissions"]}
                for r in roles
            ]

        # Set new refresh token in cookie
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=settings.ENV == "production",
            samesite="lax",
            max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/refresh_token")
async def refresh_token_endpoint(refresh_token_request: RefreshTokenRequest = Body(...)):
    """
    Refresh the access token using the provided refresh token.
    """
    try:
        refresh_token = refresh_token_request.refresh_token
        if not refresh_token:
            raise HTTPException(status_code=400, detail="Refresh token missing")
        
        # Decode and validate the refresh token
        payload = decode_refresh_token(refresh_token)
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # Fetch user from the database
        auth_service = AuthService()
        user = await auth_service.get_user_by_email(email)
        if not user or user.refresh_token != refresh_token:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # Generate new tokens
        access_token = create_access_token(data={"sub": user.email})
        new_refresh_token = create_refresh_token(data={"sub": user.email})

        # Update refresh token in the database
        await auth_service.update_refresh_token(user.email, new_refresh_token)
        print(f"New refresh token: {new_refresh_token}")
        print(f"New access_token token: {access_token}")
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
    
# Add this refresh endpoint
@router.post("/refresh")
async def refresh_tokens(
    response: Response,
    request: Request,
    
):
    try:
        # Get refresh token from cookie
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise HTTPException(status_code=401, detail="Refresh token required")

        # Validate refresh token
        try:
            payload = decode_refresh_token(refresh_token)
            email = payload.get("sub")
            if not email:
                raise HTTPException(status_code=401, detail="Invalid refresh token")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # Verify against database
        auth_service = AuthService(db)
        user = await auth_service.get_user_by_email(email)
        if not user or user.refresh_token != refresh_token:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # Generate new tokens
        new_access_token = create_access_token({"sub": email})
        new_refresh_token = create_refresh_token({"sub": email})

        # Update database with new refresh token
        await auth_service.update_refresh_token(email, new_refresh_token)

        # Set new refresh token in cookie
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=settings.ENV == "production",
            samesite="Lax",
            max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60
        )

        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refresh error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")    
    
    
@router.post("/logout")
async def logout(response: Response, refresh_token: str = Body(...)):
    try:
        if not refresh_token:
            raise HTTPException(status_code=400, detail="Refresh token missing")
        print(f"Received refresh_token: {refresh_token}")

        payload = decode_refresh_token(refresh_token)
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        print(f"Extracted email from token: {email}")

        auth_service = AuthService()
        user = await auth_service.get_user_by_email(email)
        if user is None or user.refresh_token != refresh_token:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        print(f"User found and refresh token validated for user: {user.email}")

        # Clear refresh token in database
        await auth_service.update_refresh_token(user.email, None)
        print(f"Refresh token cleared in database for user: {user.email}")

        # Clear cookie
        response.delete_cookie("refresh_token")
        print("Refresh token cookie deleted")

        return {"detail": "Successfully logged out"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/logout_cookies")
async def logout_cookies(request: Request, response: Response):
    """Logout using the refresh token stored in HttpOnly cookie. Clears the DB refresh_token and removes cookies."""
    try:
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise HTTPException(status_code=400, detail="Refresh token cookie missing")

        payload = decode_refresh_token(refresh_token)
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")

        auth_service = AuthService()
        user = await auth_service.get_user_by_email(email)
        if not user or user.refresh_token != refresh_token:
            # Even if token mismatch, clear cookies client-side
            response.delete_cookie("refresh_token")
            response.delete_cookie("access_token")
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # Clear refresh token in DB
        await auth_service.update_refresh_token(user.email, None)

        # Delete cookies
        response.delete_cookie("refresh_token")
        response.delete_cookie("access_token")

        return {"detail": "Successfully logged out"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during logout_cookies: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/decode-token")
async def decode_token(token: str = Query(...)):
    """
    Decode the provided access token and return the payload.
    """
    try:
        payload = decode_access_token(token)
        return {"user_data": payload}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.put("/profile")
async def update_profile(
    user_update: UserUpdate = Body(...),
    authorization: str = Header(...),
    db: AsyncIOMotorDatabase = Depends(lambda: db)
):
    """
    Update the profile of the currently authenticated user.
    """
    try:
        print(f"Authorization header: {authorization}")
        # Validate authorization header
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        
        access_token = authorization.split(" ")[1]
        print(f"Received access_token: {access_token}")
        # Decode and validate token
        try:
            payload = decode_access_token(access_token)
            print(f"Decoded payload: {payload}")
            email = payload.get("sub")
            if not email:
                raise HTTPException(status_code=401, detail="Invalid token")
        except JWTError as e:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Get current user
        current_user = await db.users.find_one({"email": email})
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Prepare update data
        update_data = user_update.dict(exclude_unset=True)
        if "address" in update_data:
            update_data["address"] = {
                k: v for k, v in {
                    "gouvernorat": update_data["address"].get("gouvernorat"),
                    "delegation": update_data["address"].get("delegation"),
                    "street": update_data["address"].get("street"),
                    "postal_code": update_data["address"].get("postal_code")
                }.items() if v is not None
            }

        # Perform update
        try:
            result = await db.users.update_one(
                {"email": email},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                logger.warning(f"No changes made for user {email}")
                updated_user = {**current_user, **update_data}
            else:
                updated_user = {**current_user, **update_data}

            # Convert ObjectId to string
            updated_user["_id"] = str(updated_user["_id"])
            if "roles" in updated_user:
                updated_user["roles"] = [str(role_id) for role_id in updated_user["roles"]]

            return {
                "detail": "Profile updated successfully",
                "user": updated_user
            }

        except Exception as db_error:
            logger.error(f"Database error: {str(db_error)}")
            raise HTTPException(
                status_code=500,
                detail="Database operation failed"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )



@router.put("/profile_cookie")
async def update_profile_cookie(
    user_update: UserUpdate = Body(...),
    request: Request = None
):
    """Update profile using access_token from HttpOnly cookie (dev-friendly).
    This endpoint reads the access_token cookie, decodes it, and updates the user's profile.
    """
    try:
        access_token = request.cookies.get("access_token")
        if not access_token:
            raise HTTPException(status_code=401, detail="Access token missing")

        payload = decode_access_token(access_token)
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")

        auth_service = AuthService()
        # Use service method to update profile
        updated = await auth_service.update_user_profile(email, user_update)

        # Convert Pydantic model to serializable dict
        user_data = updated.model_dump(by_alias=True)
        # sanitize ObjectId
        if "_id" in user_data:
            user_data["_id"] = str(user_data["_id"])
        if "roles" in user_data and isinstance(user_data["roles"], list):
            user_data["roles"] = [str(r) for r in user_data["roles"]]

        return {"detail": "Profile updated", "user": user_data}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile via cookie: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/getMe")
async def get_me(authorization: str = Header(...)):
    print(f"Authorization header: {authorization}")
    """
    Retrieve the currently authenticated user's information.
    Returns:
        - 200: Success with user data
        - 401: Invalid token or authorization
        - 500: Server error
    """
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        
        access_token = authorization.split(" ")[1]
        payload = decode_access_token(access_token)
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")

        auth_service = AuthService()
        user = await auth_service.get_user_by_email(email)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_data = user.model_dump(by_alias=True)
        user_data["_id"] = str(user_data["_id"])
        
        # Handle roles if they exist
        if user_data.get("roles"):
            roles = await db.roles.find({
                "_id": {"$in": [ObjectId(rid) for rid in user_data["roles"]]}
            }).to_list(length=None)
            
            user_data["roles"] = [
                {
                    "_id": str(r["_id"]),
                    "name": r["name"],
                    "permissions": r.get("permissions", [])
                } for r in roles
            ]

        return {"user": user_data}

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Error retrieving user: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/session")
async def get_session(request: Request):
    """Return current user based on access_token cookie (HttpOnly)."""
    try:
        access_token = request.cookies.get("access_token")
        if not access_token:
            raise HTTPException(status_code=401, detail="Access token missing")

        payload = decode_access_token(access_token)
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")

        auth_service = AuthService()
        user = await auth_service.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Dump the Pydantic model to a dict and ensure any ObjectId values are converted to strings
        user_data = user.model_dump(by_alias=True)

        def _sanitize(obj):
            from bson import ObjectId as _ObjectId
            if isinstance(obj, _ObjectId):
                return str(obj)
            if isinstance(obj, dict):
                return {k: _sanitize(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [_sanitize(v) for v in obj]
            return obj

        user_data = _sanitize(user_data)
        # Ensure _id is string (defensive)
        if "_id" in user_data:
            user_data["_id"] = str(user_data["_id"])

        return {"user": user_data}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving session: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/debug/cookies")
async def debug_cookies(request: Request):
    """DEV DEBUG: return cookies sent by the browser for inspection."""
    try:
        return {"cookies": dict(request.cookies)}
    except Exception as e:
        logger.error(f"Error in debug/cookies: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
