#!/bin/bash

# Make the script exit if any command fails
set -e

# Print startup message
echo "==============================================="
echo "  Starting Next.js Frontend"
echo "==============================================="

# Change to the frontend directory
cd frontend

# Start Next.js frontend in development mode
echo "🚀 Starting Next.js frontend..."
npm run dev -- -p 3000

echo "==============================================="
echo "  Next.js frontend exited"
echo "==============================================="