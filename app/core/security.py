from datetime import datetime, timedelta
from jose import jwt
from app.core.config import settings
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.models.database import db
from app.models.schemas import UserInDB

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Function to create an access token
def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=15)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.ACCESS_SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Function to create a refresh token
def create_refresh_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.REFRESH_SECRET_KEY, algorithm=settings.REFRESH_ALGORITHM)
    return encoded_jwt

# Function to decode an access token
def decode_access_token(token: str):
    return jwt.decode(token, settings.ACCESS_SECRET_KEY, algorithms=[settings.ALGORITHM])

# Function to decode a refresh token
def decode_refresh_token(token: str):
    return jwt.decode(token, settings.REFRESH_SECRET_KEY, algorithms=[settings.REFRESH_ALGORITHM])

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    """
    Extract the current user from the access token.
    """
    try:
        # Decode the token directly without importing decode_access_token
        payload = jwt.decode(token, settings.ACCESS_SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = await db.users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        user["_id"] = str(user["_id"])
        user["roles"] = [str(role_id) for role_id in user.get("roles", [])]
        return UserInDB(**user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")