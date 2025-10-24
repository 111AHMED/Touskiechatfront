from fastapi import APIRouter, Depends, HTTPException
from app.services.auth_service import AuthService
from app.core.security import get_current_user
from app.models.schemas import UserInDB

router = APIRouter(prefix="/admin", tags=["admin"])

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    new_role: str,
    auth_service: AuthService = Depends(AuthService),
    current_user: UserInDB = Depends(get_current_user)
):
    # Seul un admin peut modifier les rôles
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    
    user = await auth_service.update_user_role(user_id, new_role)
    return user