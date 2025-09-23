#!/usr/bin/env python3
"""
Simple Railway Database Initialization
Run this to create tables and sample data
"""

import os
import sys

def main():
    print("🏸 Badminton App - Railway Database Initialization")
    print("=" * 50)
    
    # Check if DATABASE_URL is set
    if not os.getenv("DATABASE_URL"):
        print("❌ DATABASE_URL not found!")
        print("Make sure you've added PostgreSQL database to your Railway project.")
        return False
    
    print(f"✅ DATABASE_URL found: {os.getenv('DATABASE_URL')[:20]}...")
    
    try:
        # Import and run initialization
        from init_db import init_db
        print("🔧 Initializing database...")
        init_db()
        print("✅ Database initialization completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
