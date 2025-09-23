#!/usr/bin/env python3
"""
Fixed version of main.py with better error handling
"""

import os
import sys
import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

print("🔧 Starting Badminton App Fixed Version...")
print(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
print(f"Port: {os.getenv('PORT', '8000')}")

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

# Create uploads directory
try:
    os.makedirs("uploads/profile_pictures", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
    print("✅ Static files mounted successfully")
except Exception as e:
    print(f"⚠️ Failed to mount static files: {e}")

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Root endpoint
@app.get("/")
def root():
    return {"message": "Badminton App API", "version": "1.0.0"}

# Try to import and include routers
try:
    print("🔧 Importing routers...")
    from app.api.routers import auth, matches, tournaments, users, permissions, roles, verification, medals, tournament_invitations, reports, posts
    
    # Include routers
    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(verification.router)
    app.include_router(matches.router)
    app.include_router(tournaments.router)
    app.include_router(permissions.router)
    app.include_router(roles.router)
    app.include_router(medals.router)
    app.include_router(tournament_invitations.router)
    app.include_router(reports.router)
    app.include_router(posts.router)
    
    print("✅ All routers included successfully")
    
except Exception as e:
    print(f"❌ Failed to import/include routers: {e}")
    print(f"Traceback: {traceback.format_exc()}")
    # Don't exit, just continue without the routers

# Database initialization endpoint
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
        print(f"Traceback: {traceback.format_exc()}")
        return {"status": "error", "message": error_msg}

if __name__ == "__main__":
    try:
        import uvicorn
        port = int(os.getenv("PORT", "8000"))
        print(f"🚀 Starting server on port {port}")
        uvicorn.run(app, host="0.0.0.0", port=port)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        sys.exit(1)
