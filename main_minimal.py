#!/usr/bin/env python3
"""
Minimal FastAPI app for Railway deployment
This version has minimal dependencies to ensure it starts
"""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

print("🔧 Starting Badminton App Minimal Version...")
print(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
print(f"Port: {os.getenv('PORT', '8000')}")
print(f"DATABASE_URL: {os.getenv('DATABASE_URL', 'NOT SET')}")
print(f"SECRET_KEY: {'SET' if os.getenv('SECRET_KEY') else 'NOT SET'}")

# Create FastAPI app
try:
    app = FastAPI(title="Badminton App API", version="1.0.0")
    print("✅ FastAPI app created successfully")
except Exception as e:
    print(f"❌ Failed to create FastAPI app: {e}")
    sys.exit(1)

# CORS middleware
try:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all for now
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    print("✅ CORS middleware added successfully")
except Exception as e:
    print(f"❌ Failed to add CORS middleware: {e}")
    sys.exit(1)

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Badminton App Minimal Version"}

# Root endpoint
@app.get("/")
def root():
    return {"message": "Badminton App API", "version": "1.0.0", "mode": "minimal"}

# Test database connection
@app.get("/test-db")
def test_database():
    try:
        from app.core.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            return {"status": "success", "message": "Database connection working"}
    except Exception as e:
        return {"status": "error", "message": f"Database error: {str(e)}"}

# Initialize database endpoint
@app.post("/init-db")
def init_database():
    """Initialize the database with tables and sample data"""
    try:
        print("🔧 Starting database initialization...")
        from init_db import init_db
        init_db()
        print("✅ Database initialization completed")
        return {"status": "success", "message": "Database initialized successfully"}
    except Exception as e:
        error_msg = f"Database initialization failed: {str(e)}"
        print(f"❌ {error_msg}")
        return {"status": "error", "message": error_msg}

if __name__ == "__main__":
    try:
        import uvicorn
        port = int(os.getenv("PORT", "8000"))
        print(f"🚀 Starting server on port {port}")
        uvicorn.run(app, host="0.0.0.0", port=port)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)