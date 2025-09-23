#!/bin/bash

# Railway Database Initialization Script
# This script runs automatically before each deployment

echo "🔧 Starting Railway database initialization..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set"
    echo "Available environment variables:"
    env | grep -i database
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo "DATABASE_URL: $DATABASE_URL"

# Check if SQL file exists
if [ ! -f "db/postgres/init/init_database.sql" ]; then
    echo "❌ SQL file not found: db/postgres/init/init_database.sql"
    echo "Current directory contents:"
    ls -la
    echo "db directory contents:"
    ls -la db/ 2>/dev/null || echo "db directory not found"
    exit 1
fi

echo "✅ SQL file found"

# Test database connection first
echo "🔌 Testing database connection..."
psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "Trying to connect with detailed error:"
    psql "$DATABASE_URL" -c "SELECT version();"
    exit 1
fi

# Run the SQL initialization script
echo "📝 Executing database initialization SQL..."
psql "$DATABASE_URL" -f db/postgres/init/init_database.sql

if [ $? -eq 0 ]; then
    echo "✅ Database initialization completed successfully"
    
    # Verify tables were created
    echo "🔍 Verifying tables were created..."
    psql "$DATABASE_URL" -c "\dt badminton.*" 2>/dev/null || echo "No badminton schema tables found"
    psql "$DATABASE_URL" -c "\dt access_control.*" 2>/dev/null || echo "No access_control schema tables found"
    
else
    echo "❌ Database initialization failed"
    echo "Last few lines of SQL execution:"
    exit 1
fi

echo "🎉 Railway database setup complete!"
