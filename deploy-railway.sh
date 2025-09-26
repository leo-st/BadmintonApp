#!/bin/bash

echo "🚀 Railway Backend Deployment Script"
echo "======================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check if logged in
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
fi

echo "✅ Railway CLI ready"

# Build and test locally first (optional)
echo "🧪 Testing Docker build locally..."
if docker build -t badminton-app-test . ; then
    echo "✅ Docker build successful"
else
    echo "❌ Docker build failed"
    exit 1
fi

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment initiated!"
echo ""
echo "Next steps:"
echo "1. Go to Railway dashboard to check deployment status"
echo "2. Add PostgreSQL database service"
echo "3. Set environment variables (see env.railway.example)"
echo "4. Visit /init-db endpoint to initialize database"
echo "5. Test /health endpoint"
