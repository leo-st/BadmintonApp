from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging
import sys

try:
    from app.api.routers import auth, matches, tournaments, users, permissions, roles, verification, medals, tournament_invitations, reports, posts
    print("✅ All routers imported successfully")
except Exception as e:
    print(f"❌ Failed to import routers: {e}")
    sys.exit(1)

try:
    from app.core.config import settings
    print("✅ Settings imported successfully")
except Exception as e:
    print(f"❌ Failed to import settings: {e}")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Create database tables (only in production)
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Badminton App API", 
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list if settings.is_production else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
os.makedirs("uploads/profile_pictures", exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Database initialization endpoint
@app.post("/init-db")
def init_database():
    """Initialize the database with tables and sample data"""
    try:
        from init_db import init_db
        init_db()
        return {"status": "success", "message": "Database initialized successfully"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
