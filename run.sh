#!/bin/bash

# Start the FastAPI backend in the background
cd backend && python run.py &
BACKEND_PID=$!

# Wait a bit for the backend to start
sleep 2

# Start the Next.js frontend
cd ../frontend && npm run dev

# If frontend is stopped, also stop the backend
kill $BACKEND_PID