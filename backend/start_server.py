#!/usr/bin/env python3
"""
Backend startup script with optional database population
"""
import asyncio
import os
import sys
import subprocess
from pathlib import Path

async def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    try:
        import fastapi
        import uvicorn
        import motor
        import beanie
        import redis
        print("  ✅ All required dependencies are installed")
        return True
    except ImportError as e:
        print(f"  ❌ Missing dependency: {e}")
        print("  💡 Run: pip install -r requirements.txt")
        return False

def check_env_file():
    """Check if .env file exists and is configured"""
    print("🔍 Checking environment configuration...")
    
    env_file = Path(".env")
    if not env_file.exists():
        print("  ⚠️ .env file not found")
        print("  💡 Copy .env.example to .env and configure your settings")
        return False
    
    # Read env file and check for MongoDB URL
    with open(env_file, 'r') as f:
        content = f.read()
        
    if "mongodb+srv://<username>:<password>" in content:
        print("  ⚠️ MongoDB URL not configured in .env file")
        print("  💡 Please update MONGODB_URL with your Atlas connection string")
        return False
    
    print("  ✅ Environment file configured")
    return True

async def populate_sample_data():
    """Populate database with sample data"""
    print("📊 Populating sample data...")
    
    try:
        # Import and run the population script
        from populate_sample_data import populate_database
        await populate_database()
        return True
    except Exception as e:
        print(f"  ❌ Failed to populate sample data: {e}")
        return False

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting FastAPI server...")
    print("  Server will be available at: http://localhost:8000")
    print("  API documentation at: http://localhost:8000/docs")
    print("  Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        import uvicorn
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"❌ Server startup failed: {e}")

async def main():
    """Main startup sequence"""
    print("🎯 Offset Printing Calculator - Backend Startup")
    print("=" * 50)
    
    # Check dependencies
    if not await check_dependencies():
        sys.exit(1)
    
    # Check environment configuration
    if not check_env_file():
        print("\n💡 You can still start the server, but database features will be limited")
        response = input("\nContinue anyway? (y/N): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Ask about sample data
    print("\n📊 Sample Data Options:")
    print("  1. Start server with existing data")
    print("  2. Populate sample data and start server")
    print("  3. Exit")
    
    while True:
        choice = input("\nEnter your choice (1-3): ").strip()
        
        if choice == "1":
            break
        elif choice == "2":
            success = await populate_sample_data()
            if not success:
                print("⚠️ Sample data population failed, but continuing with server startup...")
            break
        elif choice == "3":
            print("👋 Goodbye!")
            sys.exit(0)
        else:
            print("Invalid choice. Please enter 1, 2, or 3.")
    
    print("\n" + "=" * 50)
    start_server()

if __name__ == "__main__":
    # Change to script directory
    os.chdir(Path(__file__).parent)
    
    # Run the main function
    asyncio.run(main())
