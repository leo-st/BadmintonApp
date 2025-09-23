#!/usr/bin/env python3
"""
Railway Database Initialization Script
Run this script manually after Railway deployment to initialize your database
"""

import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

def main():
    print("🏸 Badminton App - Railway Database Initialization")
    print("=" * 50)
    
    # Check if we're in production
    if os.getenv("ENVIRONMENT") == "production":
        print("🔒 Running in PRODUCTION mode")
    else:
        print("🔧 Running in DEVELOPMENT mode")
    
    # Check environment variables
    required_vars = ["DATABASE_URL", "SECRET_KEY"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please set these in your Railway project variables.")
        return False
    
    print("✅ Environment variables check passed")
    
    try:
        # Import and run the database initialization
        from init_db import init_db
        
        print("🔧 Initializing database...")
        init_db()
        
        print("✅ Database initialization completed successfully!")
        print("\n📋 Sample users created:")
        print("   - alice (password: password123) - ADMIN")
        print("   - bob (password: password123) - USER") 
        print("   - charlie (password: password123) - USER")
        print("   - diana (password: password123) - USER")
        print("\n🎉 Your badminton app is ready!")
        
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        print("\n🔍 Troubleshooting:")
        print("1. Check that your DATABASE_URL is correct")
        print("2. Verify that the PostgreSQL service is running")
        print("3. Check Railway logs for more details")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
