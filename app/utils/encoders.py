# Add this to your utils/encoders.py
from bson import ObjectId
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

def custom_jsonable_encoder(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, BaseModel):
        return obj.dict()
    elif hasattr(obj, '__dict__'):
        return vars(obj)
    return jsonable_encoder(obj)