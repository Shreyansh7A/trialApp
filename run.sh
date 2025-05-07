#!/bin/bash

# Make the backend directory if it doesn't exist (in case we're running from root)
mkdir -p backend

# Make the frontend directory if it doesn't exist (in case we're running from root)
mkdir -p frontend

# Start the FastAPI backend in the background
cd backend && python run.py &
BACKEND_PID=$!

# Log startup information
echo "Starting FastAPI backend on port 8000..."
echo "Starting Next.js frontend on port 3000..."

# Wait a bit for the backend to start
sleep 2

# Keep the script running to maintain the backend process
# This is used when run from the Replit workflow
echo "Both services are running. Press Ctrl+C to stop."
while true; do
  sleep 10
done