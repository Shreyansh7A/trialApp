#!/bin/bash

# Make sure we're in the project root
cd "$(dirname "$0")"

# Print startup message
echo "Starting App Review Sentiment Analysis..."
echo "---------------------------------------------"
echo "🐍 Starting FastAPI backend..."

# Run FastAPI backend in the background
cd backend
python run.py &
BACKEND_PID=$!

# Wait for FastAPI to start up (give it a few seconds)
sleep 3
echo "✅ FastAPI backend running on port 8000"

# Check if the frontend directory is ready
if [ ! -f "../frontend/package.json" ]; then
  echo "⚠️ Frontend not set up properly. Creating basic package.json"
  cd ../frontend
  echo '{
  "name": "app-reviews-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}' > package.json
  cd ..
fi

echo "🚀 Starting Next.js frontend..."
cd ../frontend

# Start Next.js in development mode or fall back to Express server
if command -v next &> /dev/null; then
  echo "Using Next.js for frontend"
  npm run dev
else
  echo "⚠️ Next.js not found, falling back to Express server" 
  cd ../server
  node index.js
fi

# Clean up backend process when script is terminated
trap "kill $BACKEND_PID" EXIT

wait