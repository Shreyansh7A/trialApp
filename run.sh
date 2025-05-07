#!/bin/bash

# Log startup information
echo "Starting combined Express.js (port 5000) + FastAPI (port 8000) service..."

# Make sure the directories exist
mkdir -p backend
mkdir -p frontend

# Start the FastAPI backend in the background
cd backend && python3 run.py &
BACKEND_PID=$!

# Wait a bit for the backend to start
sleep 2

# Start the Express.js server (which also serves the frontend)
cd ..
NODE_ENV=development npx tsx server/index.ts

# This will only run if the Express server exits
# Kill the background FastAPI process
kill $BACKEND_PID

echo "Services stopped."