#!/usr/bin/env python3
"""
Database initialization script
Run this to execute the complete init_database.sql script
"""

import os
import psycopg2
from app.core.config import settings


def init_db():
    """Execute the complete init_database.sql script"""
    try:
        # Get the database URL
        database_url = settings.full_database_url
        print(f"Connecting to database...")
        
        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Read the SQL script
        sql_file_path = os.path.join(os.path.dirname(__file__), "db", "postgres", "init", "init_database.sql")
        print(f"Reading SQL script from: {sql_file_path}")
        
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        print("Executing complete SQL script...")
        
        # Execute the entire SQL script
        cursor.execute(sql_script)
        conn.commit()
        
        print("✅ Database initialized successfully with complete SQL script!")
        print("✅ All tables, data, users, matches, and tournaments created!")
        print("✅ Users available:")
        print("   - Švicarac (Leo Ivas) - password: password123 - ADMIN")
        print("   - Šampion (Denis Baban) - password: password123 - USER") 
        print("   - Vice (Vice Dumanić) - password: password123 - USER")
        print("   - Rokich (Roko Čopac) - password: password123 - USER")
        
    except Exception as e:
        print(f"❌ Error executing SQL script: {e}")
        if 'conn' in locals():
            conn.rollback()
        raise e
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    init_db()
