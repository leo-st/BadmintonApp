#!/usr/bin/env python3
"""
Startup script for Railway deployment
This script initializes the database and starts the FastAPI server
"""

import os
import sys
import subprocess
from pathlib import Path

def run_database_init():
    """Initialize the database with tables and sample data"""
    try:
        print("🔧 Initializing database...")
        
        # Import and run the database initialization
        from init_db import init_db
        init_db()
        
        print("✅ Database initialization completed!")
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def start_server():
    """Start the FastAPI server"""
    port = os.getenv("PORT", "8000")
    print(f"🚀 Starting FastAPI server on port {port}")
    
    # Start uvicorn server
    subprocess.run([
        "uvicorn", 
        "main:app", 
        "--host", "0.0.0.0", 
        "--port", port,
        "--workers", "1"
    ])

if __name__ == "__main__":
    print("🏸 Badminton App - Starting up...")
    
    # Initialize database first
    if run_database_init():
        # Start the server
        start_server()
    else:
        print("💥 Failed to initialize database. Exiting.")
        sys.exit(1)
