# Vercel Frontend Deployment Guide

## Prerequisites
1. [Vercel CLI](https://vercel.com/cli) installed (optional)
2. Vercel account created
3. Railway backend deployed and working

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your **BadmintonApp** repository from GitHub
4. Select the **`mobile`** directory as the root directory

### Step 2: Configure Build Settings
Vercel should auto-detect the settings from `vercel.json`, but verify:
- **Framework Preset**: Vite (or Other)
- **Root Directory**: `mobile`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Environment Variables
Add these environment variables in Vercel dashboard:
```
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_BASE_URL=https://badmintonapp-production.up.railway.app
```

### Step 4: Deploy
Click **"Deploy"** and wait for the build to complete.

## Method 2: Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from mobile directory
cd mobile
vercel --prod

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? badminton-app-pwa
# - In which directory is your code located? ./
```

## Step 5: Update Backend CORS

After deployment, you'll get a Vercel URL like `https://badminton-app-pwa.vercel.app`

Update your Railway backend environment variables:
```
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```

## Step 6: Test Deployment

Test these features on your deployed app:
1. **Login**: Use `Švicarac` / `password123`
2. **Navigation**: Test all screens and tabs
3. **API calls**: Create/edit/delete reports and matches
4. **PWA features**: Try "Add to Home Screen"

## Troubleshooting

### Build Fails
- Check that `scripts/build-pwa.sh` is executable
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### API Calls Fail
- Verify `EXPO_PUBLIC_API_BASE_URL` is set correctly
- Check Railway backend CORS settings
- Ensure Railway backend is running

### PWA Not Working
- Check `manifest.json` and `sw.js` are in the `dist` folder
- Verify service worker registration
- Test in incognito mode to avoid caching issues

## Environment Variables Reference

| Variable | Description | Value |
|----------|-------------|-------|
| `EXPO_PUBLIC_ENV` | Environment mode | `production` |
| `EXPO_PUBLIC_API_BASE_URL` | Backend API URL | `https://badmintonapp-production.up.railway.app` |

## Custom Domain (Optional)

To use a custom domain:
1. Go to your Vercel project settings
2. Navigate to **Domains**
3. Add your custom domain
4. Update DNS records as instructed
5. Update Railway CORS settings with new domain
