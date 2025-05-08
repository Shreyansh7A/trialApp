# App Review Sentiment Analyzer

A web application that fetches and analyzes Google Play Store reviews to determine average sentiment for specified Android apps.

## Features

- Search for apps on Google Play Store by name or package ID
- Fetch the 100 most recent reviews for an app
- Analyze sentiment of reviews using OpenAI's language models
- Display detailed sentiment breakdown (positive, negative, neutral)
- View and manage analysis history
- Responsive design for all devices

## Tech Stack

- **Frontend**: React, TailwindCSS, Shadcn UI components
- **Backend**: Express.js
- **API Integration**: Google Play Store via google-play-scraper package
- **Sentiment Analysis**: OpenAI API
- **State Management**: TanStack Query (React Query)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/app-review-sentiment-analyzer.git
   cd app-review-sentiment-analyzer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5000`

## Usage

1. Enter an app name (e.g., "Facebook") or package ID (e.g., "com.facebook.katana") in the search field
2. Wait for the analysis to complete (fetching reviews and analyzing sentiment)
3. View the detailed sentiment breakdown in the results dashboard
4. Browse through sample reviews with their sentiment scores
5. Start a new analysis or view previous analyses from history

## License

MIT