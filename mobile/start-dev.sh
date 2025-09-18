#!/bin/bash

# Development script for Badminton App
# This script starts the Expo development server with iOS simulator
# and handles the authentication automatically

echo "🏸 Starting Badminton App Development Server..."

# Kill any existing Expo processes
echo "Cleaning up existing processes..."
pkill -f "expo start" 2>/dev/null || true

# Start Expo with iOS simulator
echo "Starting Expo development server..."
npx expo start --ios --clear --no-dev --minify=false

echo "Development server started! The app should open in iOS Simulator."
echo "Press Ctrl+C to stop the development server."
