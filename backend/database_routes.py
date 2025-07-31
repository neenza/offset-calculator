"""
Database API routes for client management
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from auth import get_current_active_user
from database_models import (
    Client, 
    ClientCreate, 
    ClientUpdate, 
    ClientResponse,
    ClientStatus,
    ClientType,
    Project,
    Quote,
    Invoice,
    ClientInteraction
)

router = APIRouter(prefix="/api/database", tags=["database"])

# Client Management Routes

@router.get("/clients", response_model=List[ClientResponse])
async def get_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    status: Optional[ClientStatus] = Query(None),
    client_type: Optional[ClientType] = Query(None),
    current_user = Depends(get_current_active_user)
):
    """Get all clients with optional filtering"""
    
    # Build query filters
    filters = {}
    
    if status:
        filters["status"] = status
    
    if client_type:
        filters["client_type"] = client_type
    
    # Build search query
    if search:
        filters["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    try:
        clients = await Client.find(filters).skip(skip).limit(limit).to_list()
        return [ClientResponse.from_document(client) for client in clients]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving clients: {str(e)}")

@router.get("/clients/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get a specific client by ID"""
    
    try:
        if not ObjectId.is_valid(client_id):
            raise HTTPException(status_code=400, detail="Invalid client ID format")
        
        client = await Client.get(ObjectId(client_id))
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        return ClientResponse.from_document(client)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving client: {str(e)}")

@router.post("/clients", response_model=ClientResponse)
async def create_client(
    client_data: ClientCreate,
    current_user = Depends(get_current_active_user)
):
    """Create a new client"""
    
    try:
        # Check if email already exists
        existing_client = await Client.find_one({"email": client_data.email})
        if existing_client:
            raise HTTPException(status_code=400, detail="Email already exists")
        
        # Create new client
        client = Client(
            **client_data.dict(),
            created_by=current_user.username,
            updated_by=current_user.username
        )
        
        await client.insert()
        return ClientResponse.from_document(client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating client: {str(e)}")

@router.put("/clients/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    client_data: ClientUpdate,
    current_user = Depends(get_current_active_user)
):
    """Update an existing client"""
    
    try:
        if not ObjectId.is_valid(client_id):
            raise HTTPException(status_code=400, detail="Invalid client ID format")
        
        client = await Client.get(ObjectId(client_id))
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        # Check if email is being changed and already exists
        if client_data.email and client_data.email != client.email:
            existing_client = await Client.find_one({"email": client_data.email})
            if existing_client:
                raise HTTPException(status_code=400, detail="Email already exists")
        
        # Update client fields
        update_data = client_data.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            update_data["updated_by"] = current_user.username
            
            for field, value in update_data.items():
                setattr(client, field, value)
            
            await client.save()
        
        return ClientResponse.from_document(client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating client: {str(e)}")

@router.delete("/clients/{client_id}")
async def delete_client(
    client_id: str,
    current_user = Depends(get_current_active_user)
):
    """Delete a client"""
    
    try:
        if not ObjectId.is_valid(client_id):
            raise HTTPException(status_code=400, detail="Invalid client ID format")
        
        client = await Client.get(ObjectId(client_id))
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        # Check if client has associated projects, quotes, or invoices
        client_obj_id = ObjectId(client_id)
        
        projects_count = await Project.find({"client_id": client_obj_id}).count()
        quotes_count = await Quote.find({"client_id": client_obj_id}).count()
        invoices_count = await Invoice.find({"client_id": client_obj_id}).count()
        
        if projects_count > 0 or quotes_count > 0 or invoices_count > 0:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete client with associated projects, quotes, or invoices"
            )
        
        await client.delete()
        return {"message": "Client deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting client: {str(e)}")

# Analytics Routes

@router.get("/analytics/overview")
async def get_analytics_overview(
    current_user = Depends(get_current_active_user)
):
    """Get overview analytics for the database"""
    
    try:
        # Get client statistics - use count() method properly
        total_clients = await Client.count()
        active_clients = await Client.find({"status": ClientStatus.ACTIVE}).count()
        
        # Get revenue statistics using simple queries instead of aggregation
        all_clients = await Client.find_all().to_list()
        total_revenue = sum(client.total_revenue or 0 for client in all_clients)
        total_orders = sum(client.total_orders or 0 for client in all_clients)
        
        # Calculate average order value
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        # Get project statistics
        total_projects = await Project.count()
        active_projects = await Project.find({
            "status": {"$in": ["quote", "in-progress"]}
        }).count()
        
        # Get quote statistics
        total_quotes = await Quote.count()
        pending_quotes = await Quote.find({
            "status": {"$in": ["draft", "sent"]}
        }).count()
        
        return {
            "clients": {
                "total": total_clients,
                "active": active_clients,
                "inactive": total_clients - active_clients
            },
            "revenue": {
                "total": total_revenue,
                "total_orders": total_orders,
                "avg_order_value": avg_order_value
            },
            "projects": {
                "total": total_projects,
                "active": active_projects,
                "completed": total_projects - active_projects
            },
            "quotes": {
                "total": total_quotes,
                "pending": pending_quotes,
                "processed": total_quotes - pending_quotes
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving analytics: {str(e)}")

@router.get("/analytics/revenue-trend")
async def get_revenue_trend(
    months: int = Query(12, ge=1, le=24),
    current_user = Depends(get_current_active_user)
):
    """Get revenue trend over specified months"""
    
    try:
        # This would require more complex aggregation
        # For now, return a simple response
        return {
            "message": "Revenue trend analytics coming soon",
            "months": months
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving revenue trend: {str(e)}")

# Search and Export Routes

@router.get("/clients/export")
async def export_clients(
    format: str = Query("csv", regex="^(csv|json|excel)$"),
    current_user = Depends(get_current_active_user)
):
    """Export clients data"""
    
    try:
        # This would generate actual export files
        # For now, return a simple response
        return {
            "message": f"Export in {format} format coming soon",
            "format": format
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting clients: {str(e)}")

@router.post("/clients/import")
async def import_clients(
    current_user = Depends(get_current_active_user)
):
    """Import clients from file"""
    
    try:
        # This would handle file upload and parsing
        # For now, return a simple response
        return {
            "message": "Import functionality coming soon"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing clients: {str(e)}")

# Database health and info routes

@router.get("/health")
async def database_health():
    """Check database health"""
    
    try:
        # Test database connection
        clients_count = await Client.count()
        
        return {
            "status": "healthy",
            "collections": {
                "clients": clients_count
            },
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow()
        }
