#!/bin/bash

# PWA Build Script for Badminton App
# This script builds the app optimized for PWA deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Configuration
BUILD_DIR="dist"
EXPO_OUTPUT_DIR="web-build"

log_info "🚀 Starting PWA build process for Badminton App..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Please run this script from the mobile directory."
    exit 1
fi

# Check if expo is installed
if ! command -v expo &> /dev/null; then
    log_error "Expo CLI not found. Please install it with: npm install -g @expo/cli"
    exit 1
fi

# Clean previous builds
log_step "Cleaning previous builds..."
rm -rf $BUILD_DIR
rm -rf $EXPO_OUTPUT_DIR
rm -rf node_modules/.cache

# Install dependencies
log_step "Installing dependencies..."
npm ci

# Set environment variables for production
export NODE_ENV=production
export EXPO_PUBLIC_ENV=production

log_info "Environment: $EXPO_PUBLIC_ENV"
log_info "API URL: ${EXPO_PUBLIC_API_BASE_URL:-'https://web-production-d1979.up.railway.app'}"

# Build for web with Expo
log_step "Building web app with Expo..."
expo export --platform web --output-dir $EXPO_OUTPUT_DIR --clear

# Create final build directory
log_step "Preparing build directory..."
mkdir -p $BUILD_DIR

# Copy Expo build output
cp -r $EXPO_OUTPUT_DIR/* $BUILD_DIR/

# Ensure we have the correct manifest.json
log_step "Setting up PWA manifest..."
cp public/manifest.json $BUILD_DIR/manifest.json

# Ensure we have the service worker
log_step "Setting up service worker..."
cp public/sw.js $BUILD_DIR/sw.js

# Copy icons and assets
log_step "Copying PWA assets..."
if [ -f "public/icon.png" ]; then
    cp public/icon.png $BUILD_DIR/
fi
if [ -f "public/favicon.png" ]; then
    cp public/favicon.png $BUILD_DIR/
fi

# Update index.html with PWA features
log_step "Optimizing index.html for PWA..."
if [ -f "$BUILD_DIR/index.html" ]; then
    # Create a backup
    cp $BUILD_DIR/index.html $BUILD_DIR/index.html.bak
    
    # Add PWA meta tags and service worker registration
    cat > temp_pwa_inject.html << 'EOF'
    <!-- PWA Meta Tags -->
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <meta name="theme-color" content="#007AFF">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Badminton App">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="application-name" content="Badminton App">
    
    <!-- PWA Icons -->
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/icon.png">
    <link rel="icon" type="image/png" href="/favicon.png">
    
    <!-- Preload critical resources -->
    <link rel="preload" href="/sw.js" as="script">
    
    <!-- Service Worker Registration -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
              console.log('✅ Service Worker registered successfully:', registration.scope);
              
              // Check for updates
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('🔄 New version available! Please refresh the page.');
                    // You could show a notification to the user here
                  }
                });
              });
            })
            .catch((error) => {
              console.error('❌ Service Worker registration failed:', error);
            });
        });
      } else {
        console.warn('⚠️ Service Workers are not supported in this browser');
      }
      
      // PWA Install Prompt
      let deferredPrompt;
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('💡 PWA install prompt available');
        deferredPrompt = e;
        // You could show a custom install button here
      });
      
      // Handle PWA install
      window.addEventListener('appinstalled', () => {
        console.log('🎉 PWA was installed successfully');
        deferredPrompt = null;
      });
    </script>
EOF
    
    # Insert PWA content after <head> tag
    sed -i.bak2 '/<head>/r temp_pwa_inject.html' $BUILD_DIR/index.html
    
    # Clean up temporary files
    rm temp_pwa_inject.html
    rm $BUILD_DIR/index.html.bak
    rm $BUILD_DIR/index.html.bak2
else
    log_warn "index.html not found in build directory"
fi

# Create a simple .htaccess for Apache servers (optional)
log_step "Creating .htaccess for Apache servers..."
cat > $BUILD_DIR/.htaccess << 'EOF'
# Enable GZIP compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Set proper MIME types
AddType application/manifest+json .webmanifest
AddType application/x-web-app-manifest+json .webapp

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/ico "access plus 1 month"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/manifest+json "access plus 1 week"
</IfModule>

# Handle client-side routing
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
EOF

# Generate build info
log_step "Generating build info..."
cat > $BUILD_DIR/build-info.json << EOF
{
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "1.0.0",
  "environment": "production",
  "platform": "web-pwa",
  "features": [
    "offline-support",
    "service-worker",
    "responsive-design",
    "app-install"
  ]
}
EOF

# Create a simple deployment guide
log_step "Creating deployment guide..."
cat > $BUILD_DIR/DEPLOY.md << 'EOF'
# PWA Deployment Guide

## Quick Deploy Options

### 1. Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### 2. Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=.
```

### 3. GitHub Pages
1. Push this build directory to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Select the main branch as source

### 4. Traditional Web Server
Upload all files in this directory to your web server root.

## Requirements
- HTTPS is required for PWA features to work
- Ensure your server serves the correct MIME types
- Configure your server to handle client-side routing (SPA)

## Testing
1. Open the app in a browser
2. Check browser dev tools console for service worker registration
3. Test offline functionality by disabling network
4. Look for "Add to Home Screen" prompt on mobile devices

## Performance Tips
- Enable GZIP compression on your server
- Set proper cache headers for static assets
- Use a CDN for better global performance
EOF

# Show build size
if command -v du &> /dev/null; then
    BUILD_SIZE=$(du -sh $BUILD_DIR | cut -f1)
    log_info "📦 Build size: $BUILD_SIZE"
fi

# Final success message
log_info "🎉 PWA build completed successfully!"
log_info "📁 Build output: $BUILD_DIR/"
log_info "🚀 Ready to deploy!"
log_info ""
log_info "Next steps:"
log_info "1. Test the build locally: npx serve $BUILD_DIR"
log_info "2. Deploy to your preferred hosting platform"
log_info "3. Ensure HTTPS is enabled for full PWA functionality"
log_info ""
log_info "For deployment help, see: $BUILD_DIR/DEPLOY.md"
