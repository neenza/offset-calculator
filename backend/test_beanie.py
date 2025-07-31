"""
Simple test to check if Beanie ObjectId works
"""
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, ConfigDict
from bson import ObjectId

class TestDoc(Document):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    name: str
    test_id: Optional[PydanticObjectId] = None

    class Settings:
        collection = "test"

if __name__ == "__main__":
    print("Testing Beanie ObjectId...")
    try:
        # Try to create an instance
        doc = TestDoc(name="test", test_id=PydanticObjectId(ObjectId()))
        print("SUCCESS: Beanie ObjectId works!")
        print(f"Document: {doc}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
