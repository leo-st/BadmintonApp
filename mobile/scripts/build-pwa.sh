#!/bin/bash

# PWA Build Script for Badminton App
# This script builds the mobile app optimized for PWA deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Configuration
BUILD_DIR="dist"
ASSETS_DIR="assets"

log_info "Starting PWA build process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Please run this script from the mobile directory."
    exit 1
fi

# Clean previous builds
log_info "Cleaning previous builds..."
rm -rf $BUILD_DIR
rm -rf node_modules/.cache

# Install dependencies
log_info "Installing dependencies..."
npm ci

# Set production environment
export NODE_ENV=production
export EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL:-"https://yourdomain.com/api"}

# Build for web
log_info "Building for web..."
npx expo export --platform web --output-dir $BUILD_DIR

# Optimize images
log_info "Optimizing images..."
if command -v imagemin &> /dev/null; then
    npx imagemin $ASSETS_DIR/*.{png,jpg,jpeg} --out-dir=$BUILD_DIR/assets --plugin=pngquant --plugin=mozjpeg
else
    log_warn "imagemin not found. Copying assets without optimization..."
    cp -r $ASSETS_DIR $BUILD_DIR/
fi

# Generate service worker
log_info "Generating service worker..."
cat > $BUILD_DIR/sw.js << 'EOF'
const CACHE_NAME = 'badminton-app-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/assets/icon.png',
  '/assets/splash-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
EOF

# Generate manifest.json
log_info "Generating manifest.json..."
cat > $BUILD_DIR/manifest.json << EOF
{
  "name": "Badminton App",
  "short_name": "Badminton",
  "description": "Track badminton matches and tournaments with your local group",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007AFF",
  "orientation": "portrait",
  "scope": "/",
  "lang": "en",
  "icons": [
    {
      "src": "/assets/icon.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/assets/adaptive-icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
EOF

# Optimize HTML
log_info "Optimizing HTML..."
if [ -f "$BUILD_DIR/index.html" ]; then
    # Add PWA meta tags
    sed -i.bak 's/<head>/<head>\
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">\
    <meta name="theme-color" content="#007AFF">\
    <meta name="apple-mobile-web-app-capable" content="yes">\
    <meta name="apple-mobile-web-app-status-bar-style" content="default">\
    <meta name="apple-mobile-web-app-title" content="Badminton App">\
    <link rel="manifest" href="/manifest.json">\
    <link rel="apple-touch-icon" href="/assets/icon.png">\
    <script>\
      if ("serviceWorker" in navigator) {\
        window.addEventListener("load", () => {\
          navigator.serviceWorker.register("/sw.js")\
            .then((registration) => {\
              console.log("SW registered: ", registration);\
            })\
            .catch((registrationError) => {\
              console.log("SW registration failed: ", registrationError);\
            });\
        });\
      }\
    </script>/' $BUILD_DIR/index.html
    
    rm $BUILD_DIR/index.html.bak
fi

# Compress files
log_info "Compressing files..."
if command -v gzip &> /dev/null; then
    find $BUILD_DIR -name "*.js" -o -name "*.css" -o -name "*.html" | xargs gzip -9 -k
fi

# Generate build info
log_info "Generating build info..."
cat > $BUILD_DIR/build-info.json << EOF
{
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "1.0.0",
  "environment": "production"
}
EOF

log_info "PWA build completed successfully! 🎉"
log_info "Build output: $BUILD_DIR/"
log_info "Deploy the contents of $BUILD_DIR/ to your web server"

# Show build size
if command -v du &> /dev/null; then
    BUILD_SIZE=$(du -sh $BUILD_DIR | cut -f1)
    log_info "Build size: $BUILD_SIZE"
fi
