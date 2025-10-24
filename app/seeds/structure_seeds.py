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
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def create_roles():
    roles = [
        {
            "_id": ObjectId(),
            "name": "admin",
            "permissions": ["manage_users", "create_post"],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "name": "vendor",
            "permissions": ["create_post"],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "name": "creator",
            "permissions": ["create_post"],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "name": "client",
            "permissions": [],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
    ]

    for role in roles:
        existing_role = await db.roles.find_one({"name": role["name"]})
        if not existing_role:
            await db.roles.insert_one(role)
            logger.debug(f"Role {role['name']} created.")
        else:
            await db.roles.update_one({"name": role["name"]}, {"$set": role})
            logger.debug(f"Role {role['name']} updated.")

# Run the seed function
import asyncio
asyncio.run(create_roles())
