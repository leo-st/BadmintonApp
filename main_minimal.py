#!/usr/bin/env python3
"""
Minimal FastAPI app for Railway deployment
This version has minimal dependencies to ensure it starts
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Create FastAPI app
app = FastAPI(title="Badminton App API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Badminton App is running!"}

# Root endpoint
@app.get("/")
def root():
    return {"message": "Badminton App API", "version": "1.0.0"}

# Simple test endpoint
@app.get("/test")
def test():
    return {"message": "Test endpoint working", "environment": os.getenv("ENVIRONMENT", "development")}

if __name__ == "__main__":
    import uvicorn
    port = os.getenv("PORT", "8000")
    uvicorn.run(app, host="0.0.0.0", port=int(port))
