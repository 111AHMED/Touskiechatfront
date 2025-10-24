from pydantic import BaseModel, Field, ConfigDict
from pydantic_core import core_schema
from bson import ObjectId
from typing import Optional, List, Dict
from datetime import datetime

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        return core_schema.no_info_after_validator_function(
            cls.validate,
            core_schema.str_schema(),
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")

class UserBase(BaseModel):
    email: str
    name: str
    firstName: Optional[str] = None  # Add firstName field
    lastName: Optional[str] = None  # Add lastName field
    picture: Optional[str] = None
    status: str = "active"  # Add status field with default value

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    refresh_token: Optional[str] = None  # Add refresh_token field
    strategy: str  # Add strategy field
    created_at: datetime  # Add created_at field
    updated_at: datetime  # Add updated_at field
    first_register: datetime  # Add first_register field
    last_register: datetime  # Add last_register field
    linked_accounts: List[Dict[str, str]] = Field(default_factory=list)  # Add linked_accounts field
    roles: List[PyObjectId] = Field(default_factory=list)  # Add roles field with default value
    address: Optional[Dict[str, str]] = None  # Add address field
    phone_one: Optional[str] = None  # Add phone_one field
    phone_two: Optional[str] = None  # Add phone_two field
    phone_three: Optional[str] = None  # Add phone_three field
    verified: bool = False  # Add verified field with default value
    timezone: Optional[str] = None  # Add timezone field
    hasStore: bool = False  # Add hasStore field with default value
    storeId: Optional[PyObjectId] = None  # Add storeId field

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str},  # Encoder spécifique à PyObjectId
    )

class UserUpdate(BaseModel):
    firstName: Optional[str] = Field(None, title="First Name")
    lastName: Optional[str] = Field(None, title="Last Name")
    phone_one: Optional[str] = Field(None, title="Primary Phone")
    phone_two: Optional[str] = Field(None, title="Secondary Phone")
    phone_three: Optional[str] = Field(None, title="Alternative Phone")
    address: Optional[dict] = Field(
        None,
        title="Address",
        example={
            "gouvernorat": "",
            "delegation": "",
            "street": "",
            "postal_code": "",
        },
    )
    timezone: Optional[str] = Field(None, title="Timezone")