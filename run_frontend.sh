#!/bin/bash

# Change to the frontend directory
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

# Start the Next.js frontend
echo "Starting Next.js frontend on port 3000..."
npm run dev