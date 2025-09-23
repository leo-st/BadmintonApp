#!/bin/bash

# Railway Database Initialization Script
# This script runs automatically before each deployment

echo "🔧 Starting Railway database initialization..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Run the SQL initialization script
echo "📝 Executing database initialization SQL..."
psql "$DATABASE_URL" -f db/postgres/init/init_database.sql

if [ $? -eq 0 ]; then
    echo "✅ Database initialization completed successfully"
else
    echo "❌ Database initialization failed"
    exit 1
fi

echo "🎉 Railway database setup complete!"
