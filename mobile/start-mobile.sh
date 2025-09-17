#!/bin/bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Start the mobile app
echo "🏸 Starting Badminton App Mobile..."
echo "Backend should be running at http://localhost:8000"
echo ""
echo "Available options:"
echo "  - Press 'w' for web browser"
echo "  - Press 'i' for iOS Simulator (requires Xcode)"
echo "  - Press 'a' for Android Emulator"
echo "  - Scan QR code with Expo Go app on your phone"
echo ""

npm start
