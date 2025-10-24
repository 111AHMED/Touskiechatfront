import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the root directory to the system path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

# Load environment variables from .env file
load_dotenv(dotenv_path=root_dir / '.env')

from datetime import datetime
from bson import ObjectId
from app.models.database import db
from app.core.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def create_users():
    admin_role = await db.roles.find_one({"name": "admin"})
    creator_role = await db.roles.find_one({"name": "creator"})
    
    if not admin_role or not creator_role:
        logger.debug("Roles not found. Please run the structure_seeds.py first.")
        return

    admin_role_id = admin_role["_id"]
    creator_role_id = creator_role["_id"]

    admin_emails = settings.ADMIN_EMAILS.split(",")
    creator_emails = settings.CREATOR_EMAILS.split(",")
    
    users = [
        {
            "email": email,
            "name": email.split("@")[0],
            "roles": [admin_role_id],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        } for email in admin_emails
    ] + [
        {
            "email": email,
            "name": email.split("@")[0],
            "roles": [creator_role_id],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        } for email in creator_emails
    ]

    for user in users:
        existing_user = await db.users.find_one({"email": user["email"]})
        if not existing_user:
            await db.users.insert_one(user)
            logger.debug(f"User {user['email']} created.")
        else:
            await db.users.update_one({"email": user["email"]}, {"$set": user})
            logger.debug(f"User {user['email']} updated.")

# Run the seed function
import asyncio
asyncio.run(create_users())
