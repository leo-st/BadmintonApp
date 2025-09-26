# Railway Backend Deployment Guide

## Prerequisites
1. [Railway CLI](https://docs.railway.app/develop/cli) installed
2. Railway account created
3. This repository pushed to GitHub

## Step 1: Create Railway Project

```bash
# Login to Railway
railway login

# Create new project
railway new
```

## Step 2: Add PostgreSQL Database

In Railway dashboard:
1. Click "Add Service" → "Database" → "PostgreSQL"
2. Railway will automatically create a `DATABASE_URL` environment variable

## Step 3: Set Environment Variables

In Railway dashboard, go to your service → Variables tab and add:

```
ENVIRONMENT=production
SECRET_KEY=<generate-a-secure-32-character-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=https://your-app-name.vercel.app
MAX_UPLOAD_SIZE=10485760
UPLOAD_PATH=uploads
LOG_LEVEL=INFO
```

**Important**: Generate a secure SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Step 4: Deploy

```bash
# Connect to your Railway project
railway link

# Deploy from current directory
railway up
```

## Step 5: Initialize Database

After deployment, initialize the database:
1. Go to your Railway service URL
2. Visit: `https://your-app.railway.app/init-db`
3. This will create all tables and sample data

## Step 6: Test Deployment

Test these endpoints:
- Health check: `https://your-app.railway.app/health`
- API docs: `https://your-app.railway.app/docs`
- Users endpoint: `https://your-app.railway.app/users/`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Railway) | `postgresql://user:pass@host:port/db` |
| `SECRET_KEY` | JWT signing key (32+ characters) | `your-secure-key-here` |
| `ENVIRONMENT` | Deployment environment | `production` |
| `CORS_ORIGINS` | Allowed frontend origins | `https://yourapp.vercel.app` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `60` |
| `LOG_LEVEL` | Logging level | `INFO` |

## Troubleshooting

### Database Connection Issues
- Check that PostgreSQL service is running
- Verify `DATABASE_URL` is set correctly
- Check Railway logs: `railway logs`

### CORS Issues
- Ensure `CORS_ORIGINS` includes your frontend domain
- Don't use wildcards (`*`) with credentials

### Secret Key Issues
- Generate a secure key with at least 32 characters
- Don't use the example key in production
