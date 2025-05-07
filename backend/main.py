from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from datetime import datetime
import google_play_scraper as gplay
from google_play_scraper.exceptions import NotFoundError
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="App Reviews Sentiment Analysis API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key:
    openai_client = OpenAI(api_key=openai_api_key)
else:
    print("WARNING: OPENAI_API_KEY not found. Sentiment analysis will use fallback values.")
    openai_client = None

# Data Models
class AppInfo(BaseModel):
    name: str
    packageName: str
    developer: str
    icon: str
    rating: str

class Review(BaseModel):
    id: str
    userName: Optional[str] = None
    userImage: Optional[str] = None
    content: str
    score: int
    thumbsUpCount: int
    reviewCreatedVersion: Optional[str] = None
    at: str
    replyContent: Optional[str] = None
    replyAt: Optional[str] = None
    sentiment: str
    sentimentScore: float

class SentimentData(BaseModel):
    averageScore: float
    reviewCount: int
    date: str
    positivePercentage: int
    negativePercentage: int
    neutralPercentage: int

class AnalysisResult(BaseModel):
    appInfo: AppInfo
    sentiment: SentimentData
    reviews: List[Review]

class AppAnalysis(BaseModel):
    id: int
    appName: str
    sentimentScore: float
    date: str
    appIcon: Optional[str] = None

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    sentiment: str
    score: float
    confidence: float

# In-memory storage for analysis history
analysis_history = []
next_analysis_id = 1

# Helper functions
async def analyze_sentiment(text: str):
    """Analyze sentiment of a text using OpenAI API."""
    if not openai_client:
        # Fallback if OpenAI is not configured
        return {"sentiment": "neutral", "score": 50, "confidence": 0.5}
    
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o",  # Using the latest model
            messages=[
                {
                    "role": "system",
                    "content": "You are a sentiment analysis expert. Analyze the sentiment of the app review and provide a sentiment classification (positive, negative, or neutral), a sentiment score from 0 to 100 (where 0 is completely negative and 100 is completely positive), and a confidence score between 0 and 1. Respond with JSON in this format: { 'sentiment': string, 'score': number, 'confidence': number }"
                },
                {
                    "role": "user",
                    "content": text
                }
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        result = json.loads(content)
        
        # Normalize the result
        result["score"] = max(0, min(100, round(result["score"])))
        result["confidence"] = max(0, min(1, result["confidence"]))
        
        return result
    except Exception as e:
        print(f"Error in sentiment analysis: {str(e)}")
        # Fallback on error
        return {"sentiment": "neutral", "score": 50, "confidence": 0.5}

# API Endpoints
@app.get("/")
def read_root():
    """Root endpoint."""
    return {"message": "App Reviews Sentiment Analysis API"}

@app.post("/api/sentiment")
async def analyze_text_sentiment(request: SentimentRequest):
    """Analyze sentiment of a given text."""
    if not request.text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    result = await analyze_sentiment(request.text)
    return SentimentResponse(
        sentiment=result["sentiment"],
        score=result["score"],
        confidence=result["confidence"]
    )

@app.post("/api/reviews/analyze")
async def analyze_app_reviews(app_name: str):
    """Analyze reviews for a specific app."""
    global next_analysis_id
    
    try:
        # Get app info
        try:
            app_info = gplay.app(app_name)
        except NotFoundError:
            # Try searching for the app if direct app ID doesn't work
            search_results = gplay.search(app_name)
            if not search_results:
                raise HTTPException(status_code=404, detail=f"App '{app_name}' not found")
            app_info = gplay.app(search_results[0]['appId'])
        
        # Get reviews (most recent 100)
        reviews_result = gplay.reviews(
            app_info['appId'],
            count=100,
            sort=gplay.Sort.NEWEST
        )
        
        reviews = reviews_result[0]
        
        # Analyze sentiment for each review
        analyzed_reviews = []
        for review in reviews:
            sentiment_result = await analyze_sentiment(review['content'])
            
            analyzed_review = Review(
                id=str(review['reviewId']),
                userName=review['userName'],
                userImage=review['userImage'],
                content=review['content'],
                score=review['score'],
                thumbsUpCount=review['thumbsUpCount'],
                reviewCreatedVersion=review['reviewCreatedVersion'],
                at=review['at'],
                replyContent=review['replyContent'],
                replyAt=review['replyAt'],
                sentiment=sentiment_result["sentiment"],
                sentimentScore=sentiment_result["score"]
            )
            analyzed_reviews.append(analyzed_review)
        
        # Calculate sentiment statistics
        positive_reviews = [r for r in analyzed_reviews if r.sentiment == "positive"]
        negative_reviews = [r for r in analyzed_reviews if r.sentiment == "negative"]
        neutral_reviews = [r for r in analyzed_reviews if r.sentiment == "neutral"]
        
        total_reviews = len(analyzed_reviews)
        avg_sentiment = sum(r.sentimentScore for r in analyzed_reviews) / total_reviews if total_reviews > 0 else 50
        
        sentiment_data = SentimentData(
            averageScore=avg_sentiment,
            reviewCount=total_reviews,
            date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            positivePercentage=int(len(positive_reviews) / total_reviews * 100) if total_reviews > 0 else 0,
            negativePercentage=int(len(negative_reviews) / total_reviews * 100) if total_reviews > 0 else 0,
            neutralPercentage=int(len(neutral_reviews) / total_reviews * 100) if total_reviews > 0 else 0
        )
        
        # Create app info model
        app_info_model = AppInfo(
            name=app_info['title'],
            packageName=app_info['appId'],
            developer=app_info['developer'],
            icon=app_info['icon'],
            rating=str(app_info['score'])
        )
        
        # Create the analysis result
        result = AnalysisResult(
            appInfo=app_info_model,
            sentiment=sentiment_data,
            reviews=analyzed_reviews
        )
        
        # Store in history
        analysis_entry = AppAnalysis(
            id=next_analysis_id,
            appName=app_info_model.name,
            sentimentScore=sentiment_data.averageScore,
            date=sentiment_data.date,
            appIcon=app_info_model.icon
        )
        analysis_history.append(analysis_entry)
        next_analysis_id += 1
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing app reviews: {str(e)}")

@app.get("/api/reviews/history")
async def get_app_analysis_history():
    """Get history of app analyses."""
    return analysis_history

@app.get("/api/reviews/{id}")
async def get_app_analysis_by_id(id: int):
    """Get a specific app analysis by ID."""
    for analysis in analysis_history:
        if analysis.id == id:
            # Re-run the analysis to get the full details
            return await analyze_app_reviews(analysis.appName)
    
    raise HTTPException(status_code=404, detail=f"Analysis with ID {id} not found")

@app.delete("/api/reviews/history")
async def clear_app_analysis_history():
    """Clear the app analysis history."""
    global analysis_history
    analysis_history = []
    return {"message": "Analysis history cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)