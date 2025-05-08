#!/bin/bash

# Run FastAPI backend in the background
cd backend
python run.py &
BACKEND_PID=$!

# Run Next.js frontend
cd ../frontend
npm run dev

# Clean up backend process when script is terminated
trap "kill $BACKEND_PID" EXIT

wait