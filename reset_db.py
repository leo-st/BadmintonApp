#!/usr/bin/env python3
"""
Database reset script
This will drop all tables and recreate them with the new schema
"""

from app.core.database import engine
from app.models.models import Base
from app.models.access_control import Base as AccessControlBase
from sqlalchemy import text

def reset_db():
    print("Resetting database...")
    
    with engine.connect() as conn:
        # Create schemas first
        print("Creating schemas...")
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS badminton"))
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS access_control"))
        conn.commit()
    
    # Drop all tables
    print("Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)
    AccessControlBase.metadata.drop_all(bind=engine)
    
    # Create all tables
    print("Creating new tables...")
    Base.metadata.create_all(bind=engine)
    AccessControlBase.metadata.create_all(bind=engine)
    
    print("Database reset complete!")
    print("Now run: poetry run python init_db.py")

if __name__ == "__main__":
    reset_db()
