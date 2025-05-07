#!/bin/bash

# Log startup information
echo "Starting Google Play Store Review Sentiment Analyzer..."

# Start the FastAPI backend in the background
cd backend
echo "Starting FastAPI backend on port 8000..."
python3 run.py &
BACKEND_PID=$!

# Wait for the FastAPI backend to start
sleep 2
echo "FastAPI backend started with PID: $BACKEND_PID"

# Return to root directory
cd ..

# Start the Express.js server (which serves the frontend)
echo "Starting Express.js server on port 5000..."
NODE_ENV=development npx tsx server/index.ts

# This will only run if the Express server exits
# Kill the background FastAPI process
echo "Express.js server stopped. Cleaning up..."
kill $BACKEND_PID

echo "All services stopped."