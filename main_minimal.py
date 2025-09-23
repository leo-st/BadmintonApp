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

# Auth endpoints
@app.post("/auth/login")
def login(credentials: dict):
    """Login endpoint"""
    try:
        from app.core.database import SessionLocal
        from app.models.models import User
        from app.core.auth import verify_password, create_access_token
        
        db = SessionLocal()
        user = db.query(User).filter(User.username == credentials.get("username")).first()
        db.close()
        
        if not user or not verify_password(credentials.get("password"), user.hashed_password):
            return {"error": "Invalid credentials"}
        
        access_token = create_access_token(subject=user.username)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role_id": user.role_id
            }
        }
    except Exception as e:
        return {"error": f"Login failed: {str(e)}"}

@app.get("/users")
def get_users():
    """Get all users"""
    try:
        from app.core.database import SessionLocal
        from app.models.models import User
        
        db = SessionLocal()
        users = db.query(User).all()
        db.close()
        
        return {
            "users": [
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role_id": user.role_id
                } for user in users
            ]
        }
    except Exception as e:
        return {"error": f"Failed to get users: {str(e)}"}

@app.get("/matches")
def get_matches():
    """Get all matches"""
    try:
        from app.core.database import SessionLocal
        from app.models.models import Match
        
        db = SessionLocal()
        matches = db.query(Match).all()
        db.close()
        
        return {
            "matches": [
                {
                    "id": match.id,
                    "player1_id": match.player1_id,
                    "player2_id": match.player2_id,
                    "player1_score": match.player1_score,
                    "player2_score": match.player2_score,
                    "status": match.status.value if match.status else None,
                    "match_type": match.match_type.value if match.match_type else None
                } for match in matches
            ]
        }
    except Exception as e:
        return {"error": f"Failed to get matches: {str(e)}"}

if __name__ == "__main__":
    try:
        import uvicorn
        port = int(os.getenv("PORT", "8000"))
        print(f"🚀 Starting server on port {port}")
        uvicorn.run(app, host="0.0.0.0", port=port)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)