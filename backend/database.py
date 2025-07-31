"""
Database configuration and MongoDB connection setup
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "offset_printing_db")

# Global variables for database connection
database = None
client = None

async def connect_to_mongo():
    """Create database connection"""
    global client, database
    
    try:
        # Create client
        client = AsyncIOMotorClient(MONGODB_URL)
        
        # Get database
        database = client[DATABASE_NAME]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB successfully")
        
        # Import models for Beanie initialization
        from database_models import Client, Project, Quote, Invoice, ClientInteraction
        
        # Initialize Beanie with the models
        await init_beanie(
            database=database,
            document_models=[Client, Project, Quote, Invoice, ClientInteraction]
        )
        
        print("✅ Beanie initialized successfully")
        
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        print("💡 Please check your MongoDB connection string in the .env file")
        raise

async def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()
        print("✅ MongoDB connection closed")

def get_database():
    """Get database instance"""
    return database

# MongoDB Collections
COLLECTIONS = {
    "clients": "clients",
    "projects": "projects", 
    "quotes": "quotes",
    "invoices": "invoices",
    "interactions": "client_interactions",
    "settings": "app_settings"
}
