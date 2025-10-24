from datetime import datetime
from app.models.database import db
from app.models.schemas import UserInDB, UserUpdate
from bson import ObjectId
from app.core.config import settings
from app.core.security import create_refresh_token

class AuthService:
    async def get_or_create_user(self, user_info: dict) -> UserInDB:
        # Determine the unique identifier for the user
        user_id = user_info.get("sub") or user_info.get("id")
        strategy = "google" if "sub" in user_info else "facebook"
        
        # Rechercher l'utilisateur par email
        user = await db.users.find_one({"email": user_info["email"]})
        
        if user:
            user["_id"] = str(user["_id"])  # Convertir ObjectId → string
            # Update the refresh token if the user logs in again
            new_refresh_token = create_refresh_token({"sub": user_info["email"]})
            await self.update_refresh_token(user_info["email"], new_refresh_token)
            user["refresh_token"] = new_refresh_token
            user["strategy"] = strategy  # Update strategy
            user["updated_at"] = datetime.utcnow()  # Update updated_at
            user["last_register"] = datetime.utcnow()  # Update last_register
            user["picture"] = user_info.get("picture", {}).get("data", {}).get("url") if strategy == "facebook" else user_info.get("picture")  # Update picture
            
            # Ensure first_register is set
            if "first_register" not in user:
                user["first_register"] = datetime.utcnow()
            
            # Ensure roles is set
            if "roles" not in user:
                user["roles"] = []
            else:
                user["roles"] = [str(role_id) for role_id in user["roles"]]  # Convert roles to list of strings
            
            # Ensure additional fields are set
            additional_fields = {
                "address": user.get("address", None),
                "phone_one": user.get("phone_one", None),
                "phone_two": user.get("phone_two", None),
                "phone_three": user.get("phone_three", None),
                "verified": user.get("verified", False),
                "timezone": user.get("timezone", None),
                "hasStore": user.get("hasStore", False),
                "storeId": user.get("storeId", None)
            }
            user.update(additional_fields)
            
            # Link accounts if necessary
            if strategy == "google" and not user.get("google_sub"):
                user["google_sub"] = user_id
            elif strategy == "facebook" and not user.get("facebook_sub"):
                user["facebook_sub"] = user_id
            
            # Update linked accounts
            if "linked_accounts" not in user:
                user["linked_accounts"] = []
            existing_account = next((account for account in user["linked_accounts"] if account["provider"] == strategy and account["accountId"] == user_id), None)
            if not existing_account:
                user["linked_accounts"].append({"provider": strategy, "accountId": user_id})
            
            # Remove _id, google_sub, facebook_sub, and etat from the update data to avoid modifying the immutable field and unnecessary fields
            user_data_to_update = {k: v for k, v in user.items() if k not in ["_id", "google_sub", "facebook_sub", "etat"]}
            
            await db.users.update_one({"email": user_info["email"]}, {"$set": user_data_to_update})
            return UserInDB(**user)
        
        # Determine the role of the user
        email = user_info["email"]
        roles = []
        client_role = await db.roles.find_one({"name": "client"})
        if client_role:
            roles.append(str(client_role["_id"]))  # Assign client role
        
        # Create a new user
        new_user_data = {
            "_id": ObjectId(),  # Generate an ObjectId
            "email": email,
            "name": user_info["name"],
            "firstName": user_info.get("firstName"),  # Add firstName field
            "lastName": user_info.get("lastName"),  # Add lastName field
            "picture": user_info.get("picture", {}).get("data", {}).get("url") if strategy == "facebook" else user_info.get("picture"),
            "roles": roles,  # Add roles field
            "status": "active",  # Add status field with default value
            "refresh_token": create_refresh_token({"sub": email}),  # Generate refresh token
            "strategy": strategy,  # Add strategy field
            "created_at": datetime.utcnow(),  # Add created_at
            "updated_at": datetime.utcnow(),  # Add updated_at
            "first_register": datetime.utcnow(),  # Add first_register
            "last_register": datetime.utcnow(),  # Add last_register
            "linked_accounts": [{"provider": strategy, "accountId": user_id}],  # Add linked_accounts field
            "address": None,  # Add address field
            "phone_one": None,  # Add phone_one field
            "phone_two": None,  # Add phone_two field
            "phone_three": None,  # Add phone_three field
            "verified": False,  # Add verified field with default value
            "timezone": user_info.get("timezone"),  # Add timezone field
            "hasStore": False,  # Add hasStore field with default value
            "storeId": None  # Add storeId field
        }
        
        # Insérer dans MongoDB
        result = await db.users.insert_one(new_user_data)
        new_user = await db.users.find_one({"_id": result.inserted_id})
        new_user["_id"] = str(new_user["_id"])  # Convertir pour Pydantic
        new_user["roles"] = [str(role_id) for role_id in new_user["roles"]]  # Convert roles to list of strings
        
        return UserInDB(**new_user)

    async def get_user_by_email(self, email: str) -> UserInDB:
        user = await db.users.find_one({"email": email})
        if user:
            user["_id"] = str(user["_id"])  # Convertir ObjectId → string
            user["roles"] = [str(role_id) for role_id in user["roles"]]  # Convert roles to list of strings
            return UserInDB(**user)
        return None

    async def update_refresh_token(self, email: str, refresh_token: str):
        await db.users.update_one({"email": email}, {"$set": {"refresh_token": refresh_token}})

    async def update_user_profile(self, email: str, user_update: UserUpdate) -> UserInDB:
        """
        Update the profile of a user in the database.
        """
        update_data = user_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()

        # Update the user in the database
        result = await db.users.update_one({"email": email}, {"$set": update_data})
        if result.modified_count == 0:
            raise ValueError("Failed to update user profile")

        # Fetch the updated user
        updated_user = await db.users.find_one({"email": email})
        updated_user["_id"] = str(updated_user["_id"])
        updated_user["roles"] = [str(role_id) for role_id in updated_user["roles"]]

        return UserInDB(**updated_user)