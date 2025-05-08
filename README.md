# App Review Sentiment Analysis

A comprehensive tool for analyzing the sentiment of Google Play Store app reviews using FastAPI and Next.js.

## Project Overview

This application retrieves the 100 most recent Google Play Store reviews for a specified Android app, analyzes the sentiment of each review using OpenAI's language model, and displays the average sentiment score along with the number of reviews analyzed. The application features a responsive web interface for app name input and results display.

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: Next.js + React
- **Sentiment Analysis**: OpenAI API
- **Data Source**: Google Play Store Scraper
- **Styling**: TailwindCSS

## Features

- Search for apps by name or package ID
- Analyze sentiment of the 100 most recent reviews
- View detailed sentiment breakdown (positive, negative, neutral percentages)
- Browse detailed review samples with sentiment scores
- Track analysis history

## Installation and Setup

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- npm or yarn
- OpenAI API key

### Environment Setup

1. Create a `.env` file in the root directory with the following:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### Running the Project

#### Run the FastAPI backend:

```bash
cd backend
python run.py
```

The FastAPI server will start on port 8000. You can access the API documentation at http://localhost:8000/docs.

#### Run the Next.js frontend:

```bash
cd frontend
npm run dev
```

The Next.js development server will start on port 3000. Access the web interface at http://localhost:3000.

#### Run both services together:

```bash
./run.sh
```

## API Endpoints

- `POST /api/reviews/analyze?app_name={app_name}` - Analyze reviews for a specific app
- `GET /api/reviews/history` - Get analysis history
- `GET /api/reviews/{id}` - Get a specific analysis by ID
- `DELETE /api/reviews/history` - Clear analysis history
- `POST /api/sentiment` - Analyze sentiment of a provided text

## Project Structure

- `backend/` - FastAPI backend code
  - `main.py` - Main FastAPI application
  - `run.py` - Backend server runner

- `frontend/` - Next.js frontend code
  - `app/` - Next.js application pages and components
  - `styles/` - CSS stylesheets
  - `components/` - React components