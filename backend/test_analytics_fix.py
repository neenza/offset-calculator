#!/usr/bin/env python3
"""Test the analytics query to see if the backend database query works correctly."""

import asyncio
from database_models import Client
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def test_analytics():
    load_dotenv()
    mongodb_url = os.getenv('MONGODB_URL', 'mongodb://localhost:27017/offset_calculator')
    print(f'Using MongoDB URL: {mongodb_url}')
    
    client = AsyncIOMotorClient(mongodb_url)
    await init_beanie(database=client.offset_calculator, document_models=[Client])
    
    # Test the analytics query
    try:
        total_clients = await Client.count()
        print(f'Total clients: {total_clients}')
        
        all_clients = await Client.find().to_list()
        print(f'Found {len(all_clients)} clients')
        
        total_revenue = sum(client.total_revenue or 0 for client in all_clients)
        total_orders = sum(client.total_orders or 0 for client in all_clients)
        
        print(f'Total revenue: {total_revenue}')
        print(f'Total orders: {total_orders}')
        
        # Test a single client
        if all_clients:
            sample_client = all_clients[0]
            print(f'\nSample client: {sample_client.name}')
            print(f'Total orders: {sample_client.total_orders}')
            print(f'Total revenue: {sample_client.total_revenue}')
        
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    asyncio.run(test_analytics())
