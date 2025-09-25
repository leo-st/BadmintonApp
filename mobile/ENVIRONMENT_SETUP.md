# Environment Configuration Guide

This guide explains how to configure the Badminton App Mobile to connect to different backend environments.

## Quick Setup

### Option 1: Using Environment Variables (Recommended)

Create a `.env.local` file in the `mobile/` directory:

```bash
# For local development (Docker backend)
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.114:8000

# For production (Railway backend)
# EXPO_PUBLIC_ENV=production
# EXPO_PUBLIC_API_BASE_URL=https://web-production-d1979.up.railway.app

# For localhost backend
# EXPO_PUBLIC_ENV=localhost
# EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Option 2: Direct Code Configuration

Edit `mobile/src/config/environment.ts` and change the `currentEnv` variable:

```typescript
// Change this line to switch environments
const currentEnv = process.env.EXPO_PUBLIC_ENV || 'development'; // or 'production' or 'localhost'
```

## Available Environments

| Environment | Backend URL | Use Case |
|-------------|-------------|----------|
| `development` | `http://192.168.1.114:8000` | Local Docker backend |
| `production` | `https://web-production-d1979.up.railway.app` | Deployed Railway backend |
| `localhost` | `http://localhost:8000` | Local backend (no Docker) |

## Switching Environments

### Method 1: Environment Variables
1. Create `.env.local` file in `mobile/` directory
2. Set `EXPO_PUBLIC_ENV=development` (or `production`)
3. Restart Expo development server

### Method 2: Code Configuration
1. Edit `mobile/src/config/environment.ts`
2. Change `currentEnv` variable
3. Restart Expo development server

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_ENV` | Environment name | `development` |
| `EXPO_PUBLIC_API_BASE_URL` | Backend API URL | Environment-specific |
| `EXPO_PUBLIC_API_TIMEOUT` | API timeout in ms | `10000` |

## Notes

- Environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app
- The `.env.local` file is ignored by git (already in .gitignore)
- Always restart the Expo development server after changing environment configuration
- The app will log the current configuration in development mode
