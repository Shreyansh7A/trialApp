#!/bin/bash

# Make the script exit if any command fails
set -e

# Print startup message
echo "==============================================="
echo "  Starting App Review Sentiment Analysis"
echo "==============================================="

# Check for OPENAI_API_KEY
if [ -z "$OPENAI_API_KEY" ]; then
  echo "⚠️  WARNING: OPENAI_API_KEY environment variable not found."
  echo "   Sentiment analysis will use fallback values."
  echo "   Please set your OpenAI API key in the Replit Secrets tab."
  echo "==============================================="
else
  echo "✓ OpenAI API key found."
fi

# Start FastAPI backend in the background
echo "🐍 Starting FastAPI backend..."
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait for the backend to start
sleep 2
echo "✓ FastAPI backend running on port 8000"

# Start Next.js frontend in the background
echo "🚀 Starting Next.js frontend..."
cd ../frontend
npx next dev -p 3000 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 2
echo "✓ Next.js frontend running on port 3000"

echo "==============================================="
echo "  Services are running! Access the app at:"
echo "  https://$REPL_SLUG.$REPL_OWNER.replit.dev"
echo "==============================================="

# Trap to kill both processes on exit
trap "echo 'Shutting down services...'; kill $BACKEND_PID $FRONTEND_PID" EXIT INT TERM

# Wait for both processes
wait