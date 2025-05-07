from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google_play_scraper as gplay
from google_play_scraper.exceptions import NotFoundError
import openai
import os
from datetime import datetime
import json

# Initialize FastAPI app
app = FastAPI(title="App Review Sentiment Analyzer")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check for OpenAI API key
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("Warning: OPENAI_API_KEY environment variable not set")

# Initialize OpenAI client
client = openai.OpenAI(api_key=openai_api_key)

# Define Pydantic models
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

# In-memory storage for analysis history
analysis_history = []
next_analysis_id = 1

async def analyze_sentiment(text: str):
    """Analyze sentiment of a text using OpenAI API."""
    try:
        response = client.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024
            messages=[
                {
                    "role": "system",
                    "content": "You are a sentiment analysis expert. Analyze the sentiment of the review and provide a rating. Return ONLY a JSON object with these fields: sentiment (string: 'positive', 'negative', or 'neutral'), score (number from 0 to 100, where 0 is most negative and 100 is most positive)."
                },
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"}
        )
        result = json.loads(response.choices[0].message.content)
        return result["sentiment"], result["score"]
    except Exception as e:
        print(f"Error analyzing sentiment: {e}")
        return "neutral", 50  # Default fallback

@app.get("/")
def read_root():
    """Root endpoint."""
    return {"message": "App Review Sentiment Analyzer API"}

@app.post("/api/reviews/analyze")
async def analyze_app_reviews(app_name: str):
    """Analyze reviews for a specific app."""
    global next_analysis_id
    
    try:
        # Get app details
        app_details = gplay.app(app_name)
        
        # Get reviews
        reviews_result, _ = gplay.reviews(
            app_name,
            count=100,  # Get 100 most recent reviews
            lang='en',  # English reviews only
            sort=gplay.Sort.NEWEST  # Most recent reviews
        )
        
        # Process reviews with sentiment analysis
        analyzed_reviews = []
        for review in reviews_result:
            sentiment, score = await analyze_sentiment(review['content'])
            analyzed_reviews.append(Review(
                id=review['reviewId'],
                userName=review.get('userName'),
                userImage=review.get('userImage'),
                content=review['content'],
                score=review['score'],
                thumbsUpCount=review['thumbsUpCount'],
                reviewCreatedVersion=review.get('reviewCreatedVersion'),
                at=review['at'],
                replyContent=review.get('replyContent'),
                replyAt=review.get('replyAt'),
                sentiment=sentiment,
                sentimentScore=score
            ))
        
        # Calculate sentiment statistics
        positive_reviews = [r for r in analyzed_reviews if r.sentiment == 'positive']
        negative_reviews = [r for r in analyzed_reviews if r.sentiment == 'negative']
        neutral_reviews = [r for r in analyzed_reviews if r.sentiment == 'neutral']
        
        total_reviews = len(analyzed_reviews)
        positive_percentage = round((len(positive_reviews) / total_reviews) * 100) if total_reviews > 0 else 0
        negative_percentage = round((len(negative_reviews) / total_reviews) * 100) if total_reviews > 0 else 0
        neutral_percentage = 100 - positive_percentage - negative_percentage
        
        average_score = sum(r.sentimentScore for r in analyzed_reviews) / total_reviews if total_reviews > 0 else 50
        
        # Create app info
        app_info = AppInfo(
            name=app_details['title'],
            packageName=app_details['appId'],
            developer=app_details['developer'],
            icon=app_details['icon'],
            rating=str(app_details['score'])
        )
        
        # Create sentiment data
        current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        sentiment_data = SentimentData(
            averageScore=round(average_score, 1),
            reviewCount=total_reviews,
            date=current_date,
            positivePercentage=positive_percentage,
            negativePercentage=negative_percentage,
            neutralPercentage=neutral_percentage
        )
        
        # Create result
        result = AnalysisResult(
            appInfo=app_info,
            sentiment=sentiment_data,
            reviews=analyzed_reviews
        )
        
        # Save to history
        analysis_entry = AppAnalysis(
            id=next_analysis_id,
            appName=app_info.name,
            sentimentScore=round(average_score, 1),
            date=current_date,
            appIcon=app_info.icon
        )
        analysis_history.append(analysis_entry)
        
        # Store the full result in memory (this would go to a database in a production app)
        analysis_entry.full_result = result
        
        # Increment ID for next analysis
        next_analysis_id += 1
        
        return result
        
    except NotFoundError:
        raise HTTPException(status_code=404, detail=f"App not found: {app_name}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing app reviews: {str(e)}")

@app.get("/api/reviews/history", response_model=List[AppAnalysis])
async def get_app_analysis_history():
    """Get history of app analyses."""
    return analysis_history

@app.get("/api/reviews/{id}", response_model=AnalysisResult)
async def get_app_analysis_by_id(id: int):
    """Get a specific app analysis by ID."""
    for analysis in analysis_history:
        if analysis.id == id:
            return analysis.full_result
    raise HTTPException(status_code=404, detail=f"Analysis with ID {id} not found")

@app.delete("/api/reviews/history")
async def clear_app_analysis_history():
    """Clear the app analysis history."""
    global analysis_history
    analysis_history = []
    return {"message": "Analysis history cleared"}