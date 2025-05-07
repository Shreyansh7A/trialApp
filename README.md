# Google Play Store Review Sentiment Analyzer

This application retrieves and analyzes the sentiment of Google Play Store app reviews using OpenAI's language model. It displays the average sentiment score and provides a breakdown of positive, negative, and neutral reviews.

## Features

- Search for any Android app by name
- Retrieves the 100 most recent reviews
- Analyzes review sentiment using OpenAI
- Displays sentiment statistics and charts
- Saves search history for easy reference

## Setup and Installation

### Online (Replit)

The application is already configured to run on Replit. Simply press the "Run" button to start.

### Local Development

To run the application locally:

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the project root with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
4. Start the application:
   ```
   npm run dev
   ```
5. Open your browser to `http://localhost:5000`

## Technical Stack

- **Backend**: Express.js with TypeScript (with FastAPI fallback option)
- **Frontend**: React with TypeScript
- **Sentiment Analysis**: OpenAI GPT-4o
- **Review Scraping**: google-play-scraper
- **Styling**: TailwindCSS with shadcn/ui components

## API Endpoints

- `POST /api/reviews/analyze` - Analyze reviews for a specific app
- `GET /api/reviews/history` - Get history of analyzed apps
- `GET /api/reviews/:id` - Get details for a specific analysis
- `DELETE /api/reviews/history` - Clear analysis history

## Environment Variables

- `OPENAI_API_KEY` - Required for sentiment analysis
- `FASTAPI_URL` - Optional, for connecting to a FastAPI backend (defaults to http://localhost:8000)

## License

MIT