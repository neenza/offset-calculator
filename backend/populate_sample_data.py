"""
Sample data population script for MongoDB
Run this script to populate the database with sample clients and projects
"""
import asyncio
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import models
from database_models import Client, Project, Quote, ClientStatus, ClientType, ProjectStatus, Priority, QuoteStatus

async def populate_database():
    """Populate database with sample data"""
    
    # Connect to MongoDB
    MONGODB_URL = os.getenv("MONGODB_URL")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "offset_printing_db")
    
    if not MONGODB_URL or MONGODB_URL == "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/":
        print("❌ Please configure MONGODB_URL in your .env file")
        return
    
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]
    
    # Initialize Beanie
    await init_beanie(
        database=database,
        document_models=[Client, Project, Quote]
    )
    
    print("✅ Connected to MongoDB and initialized Beanie")
    
    # Clear existing sample data (optional)
    print("🗑️ Clearing existing sample data...")
    await Client.delete_all()
    await Project.delete_all()
    await Quote.delete_all()
    
    # Create sample clients
    print("👥 Creating sample clients...")
    
    clients_data = [
        {
            "name": "John Smith",
            "email": "john.smith@smithassociates.com",
            "phone": "+1-555-0101",
            "company": "Smith & Associates",
            "address": {
                "street": "123 Business Street",
                "city": "New York",
                "state": "NY",
                "zip_code": "10001",
                "country": "USA"
            },
            "status": ClientStatus.ACTIVE,
            "client_type": ClientType.BUSINESS,
            "credit_limit": 10000.0,
            "notes": "Prefers quick turnaround projects, always pays on time",
            "total_orders": 15,
            "total_revenue": 45000.0,
            "last_order_date": datetime.now() - timedelta(days=5)
        },
        {
            "name": "Sarah Johnson",
            "email": "sarah.johnson@techcorp.com",
            "phone": "+1-555-0102",
            "company": "TechCorp Solutions",
            "address": {
                "street": "456 Innovation Avenue",
                "city": "San Francisco",
                "state": "CA",
                "zip_code": "94105",
                "country": "USA"
            },
            "status": ClientStatus.ACTIVE,
            "client_type": ClientType.ENTERPRISE,
            "credit_limit": 50000.0,
            "notes": "Large volume orders, quarterly billing preferred",
            "total_orders": 8,
            "total_revenue": 125000.0,
            "last_order_date": datetime.now() - timedelta(days=2)
        },
        {
            "name": "Mike Davis",
            "email": "mike.davis@email.com",
            "phone": "+1-555-0103",
            "company": "",
            "address": {
                "street": "789 Residential Road",
                "city": "Austin",
                "state": "TX",
                "zip_code": "73301",
                "country": "USA"
            },
            "status": ClientStatus.PENDING,
            "client_type": ClientType.INDIVIDUAL,
            "credit_limit": 2000.0,
            "notes": "New client, requires credit approval",
            "total_orders": 0,
            "total_revenue": 0.0,
            "last_order_date": None
        },
        {
            "name": "Lisa Chen",
            "email": "lisa@creativestudio.com",
            "phone": "+1-555-0104",
            "company": "Creative Design Studio",
            "address": {
                "street": "321 Art District",
                "city": "Los Angeles",
                "state": "CA",
                "zip_code": "90210",
                "country": "USA"
            },
            "status": ClientStatus.ACTIVE,
            "client_type": ClientType.BUSINESS,
            "credit_limit": 15000.0,
            "notes": "Creative agency, often needs rush orders for campaigns",
            "total_orders": 22,
            "total_revenue": 67500.0,
            "last_order_date": datetime.now() - timedelta(days=10)
        },
        {
            "name": "Robert Wilson",
            "email": "rwilson@legalfirm.com",
            "phone": "+1-555-0105",
            "company": "Wilson & Partners Law Firm",
            "address": {
                "street": "100 Legal Plaza",
                "city": "Chicago",
                "state": "IL",
                "zip_code": "60601",
                "country": "USA"
            },
            "status": ClientStatus.ACTIVE,
            "client_type": ClientType.BUSINESS,
            "credit_limit": 8000.0,
            "notes": "Legal documents and letterheads, high quality requirements",
            "total_orders": 12,
            "total_revenue": 28500.0,
            "last_order_date": datetime.now() - timedelta(days=15)
        }
    ]
    
    created_clients = []
    for client_data in clients_data:
        client = Client(**client_data)
        await client.save()
        created_clients.append(client)
        print(f"  ✅ Created client: {client.name}")
    
    # Create sample projects
    print("📋 Creating sample projects...")
    
    projects_data = [
        {
            "client_id": created_clients[0].id,
            "project_name": "Business Card Redesign",
            "description": "New business cards with updated company branding and logo",
            "status": ProjectStatus.COMPLETED,
            "priority": Priority.MEDIUM,
            "specifications": {
                "paper_type": "350gsm Matt Coated",
                "paper_size": "90x55mm",
                "quantity": 1000,
                "colors": 4,
                "finishing": ["Lamination", "Rounded Corners"],
                "binding": "N/A"
            },
            "estimated_cost": 500.0,
            "actual_cost": 475.0,
            "start_date": datetime.now() - timedelta(days=20),
            "deadline": datetime.now() - timedelta(days=15),
            "completed_date": datetime.now() - timedelta(days=16)
        },
        {
            "client_id": created_clients[1].id,
            "project_name": "Annual Report 2024",
            "description": "Complete annual report with charts, graphs, and photography",
            "status": ProjectStatus.IN_PROGRESS,
            "priority": Priority.HIGH,
            "specifications": {
                "paper_type": "120gsm Silk Coated",
                "paper_size": "A4",
                "quantity": 500,
                "colors": 4,
                "finishing": ["Perfect Binding", "Spot UV"],
                "binding": "Perfect Bound"
            },
            "estimated_cost": 15000.0,
            "actual_cost": 0.0,
            "start_date": datetime.now() - timedelta(days=10),
            "deadline": datetime.now() + timedelta(days=20),
            "completed_date": None
        },
        {
            "client_id": created_clients[3].id,
            "project_name": "Marketing Brochures",
            "description": "Tri-fold marketing brochures for new product launch",
            "status": ProjectStatus.QUOTE,
            "priority": Priority.URGENT,
            "specifications": {
                "paper_type": "200gsm Gloss Coated",
                "paper_size": "A4 Tri-fold",
                "quantity": 2000,
                "colors": 4,
                "finishing": ["Tri-fold", "Gloss Lamination"],
                "binding": "N/A"
            },
            "estimated_cost": 3500.0,
            "actual_cost": 0.0,
            "start_date": None,
            "deadline": datetime.now() + timedelta(days=7),
            "completed_date": None
        }
    ]
    
    created_projects = []
    for project_data in projects_data:
        project = Project(**project_data)
        await project.save()
        created_projects.append(project)
        print(f"  ✅ Created project: {project.project_name}")
    
    # Create sample quotes
    print("💰 Creating sample quotes...")
    
    quotes_data = [
        {
            "quote_number": "QT-2024-001",
            "client_id": created_clients[2].id,
            "client_name": created_clients[2].name,
            "items": [
                {
                    "description": "Business Cards - 1000 qty",
                    "quantity": 1000,
                    "unit_price": 0.15,
                    "total": 150.0
                },
                {
                    "description": "Design Setup Fee",
                    "quantity": 1,
                    "unit_price": 50.0,
                    "total": 50.0
                }
            ],
            "subtotal": 200.0,
            "tax_rate": 0.08,
            "tax_amount": 16.0,
            "total": 216.0,
            "status": QuoteStatus.SENT,
            "valid_until": datetime.now() + timedelta(days=30),
            "sent_date": datetime.now() - timedelta(days=3)
        },
        {
            "quote_number": "QT-2024-002",
            "client_id": created_clients[3].id,
            "client_name": created_clients[3].name,
            "items": [
                {
                    "description": "Tri-fold Brochures - 2000 qty",
                    "quantity": 2000,
                    "unit_price": 1.50,
                    "total": 3000.0
                },
                {
                    "description": "Design and Layout",
                    "quantity": 1,
                    "unit_price": 500.0,
                    "total": 500.0
                }
            ],
            "subtotal": 3500.0,
            "tax_rate": 0.08,
            "tax_amount": 280.0,
            "total": 3780.0,
            "status": QuoteStatus.DRAFT,
            "valid_until": datetime.now() + timedelta(days=14),
            "sent_date": None
        }
    ]
    
    for quote_data in quotes_data:
        quote = Quote(**quote_data)
        await quote.save()
        print(f"  ✅ Created quote: {quote.quote_number}")
    
    print("\n🎉 Sample data populated successfully!")
    print("\n📊 Summary:")
    print(f"  • {len(created_clients)} clients created")
    print(f"  • {len(created_projects)} projects created")
    print(f"  • {len(quotes_data)} quotes created")
    print("\n💡 You can now test the database features in the frontend application")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_database())
