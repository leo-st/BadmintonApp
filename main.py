from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import auth, matches, tournaments, users, permissions, roles, verification, medals, tournament_invitations, reports

# Create database tables (only in production)
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Badminton App API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
