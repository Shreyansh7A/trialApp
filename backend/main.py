from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os
import json
from datetime import datetime
import google_play_scraper as gplay
from google_play_scraper.exceptions import NotFoundError
from dotenv import load_dotenv
import openai
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Load environment variables
load_dotenv()

# Set up OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize FastAPI app
app = FastAPI(
    title="App Review Sentiment Analyzer",
    description="API for analyzing sentiment of Google Play Store reviews",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
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
current_id = 1

# Helper function to analyze sentiment using OpenAI
async def analyze_sentiment(text: str):
    try:
        response = await openai.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages=[
                {"role": "system", "content": "You are a sentiment analysis expert. Analyze the sentiment of the provided text and return a JSON object with: 'sentiment' (positive, negative, or neutral) and 'score' (0-100 where 0 is extremely negative, 50 is neutral, and 100 is extremely positive). Consider both the tone and content of the text."},
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return {
            "sentiment": result["sentiment"],
            "score": result["score"]
        }
    except Exception as e:
        print(f"Error analyzing sentiment: {e}")
        return {
            "sentiment": "neutral",
            "score": 50
        }

# Routes
@app.get("/")
def read_root():
    return {"status": "ok", "message": "API is running"}

@app.post("/api/reviews/analyze")
async def analyze_app_reviews(app_name: str):
    try:
        # First determine if input is a package name or app title
        app_id = app_name
        
        # If it doesn't look like a package name, search for it
        if "." not in app_name:
            search_results = gplay.search(app_name, n_hits=1)
            
            if not search_results:
                raise HTTPException(status_code=404, detail=f"No app found with name: {app_name}")
            
            app_id = search_results[0]["appId"]
        
        # Get app details
        try:
            app_details = gplay.app(app_id)
        except NotFoundError:
            raise HTTPException(status_code=404, detail=f"App not found: {app_id}")
        
        # Get recent reviews (100)
        reviews_result = gplay.reviews(
            app_id,
            lang='en',
            country='us',
            sort=gplay.Sort.NEWEST,
            count=100
        )
        
        raw_reviews = reviews_result[0]
        
        # Process reviews with sentiment analysis
        async def process_review(review):
            if not review["content"] or review["content"].strip() == "":
                return None
            
            sentiment_result = await analyze_sentiment(review["content"])
            
            return {
                "id": review["reviewId"],
                "userName": review["userName"],
                "userImage": review.get("userImage"),
                "content": review["content"],
                "score": review["score"],
                "thumbsUpCount": review["thumbsUp"],
                "reviewCreatedVersion": review.get("reviewCreatedVersion"),
                "at": review["at"],
                "replyContent": review.get("replyContent"),
                "replyAt": review.get("replyAt"),
                "sentiment": sentiment_result["sentiment"],
                "sentimentScore": sentiment_result["score"]
            }
        
        # Process reviews in parallel with a limit of 5 concurrent requests
        reviews = []
        
        # Create a semaphore to limit concurrent API calls
        sem = asyncio.Semaphore(5)
        
        async def process_with_semaphore(review):
            async with sem:
                return await process_review(review)
        
        # Process reviews in parallel
        tasks = [process_with_semaphore(review) for review in raw_reviews]
        processed_reviews = await asyncio.gather(*tasks)
        reviews = [r for r in processed_reviews if r is not None]
        
        # Calculate sentiment statistics
        def calculate_sentiment_data(reviews):
            review_count = len(reviews)
            
            if review_count == 0:
                return {
                    "averageScore": 0,
                    "reviewCount": 0,
                    "date": datetime.now().strftime("%b %d, %Y"),
                    "positivePercentage": 0,
                    "negativePercentage": 0,
                    "neutralPercentage": 0
                }
            
            total_score = 0
            positive_count = 0
            negative_count = 0
            neutral_count = 0
            
            for review in reviews:
                total_score += review["sentimentScore"]
                
                if review["sentiment"] == "positive":
                    positive_count += 1
                elif review["sentiment"] == "negative":
                    negative_count += 1
                else:
                    neutral_count += 1
            
            average_score = round(total_score / review_count)
            positive_percentage = round((positive_count / review_count) * 100)
            negative_percentage = round((negative_count / review_count) * 100)
            neutral_percentage = 100 - positive_percentage - negative_percentage
            
            return {
                "averageScore": average_score,
                "reviewCount": review_count,
                "date": datetime.now().strftime("%b %d, %Y"),
                "positivePercentage": positive_percentage,
                "negativePercentage": negative_percentage,
                "neutralPercentage": neutral_percentage
            }
        
        sentiment_data = calculate_sentiment_data(reviews)
        
        app_info = {
            "name": app_details["title"],
            "packageName": app_details["appId"],
            "developer": app_details["developer"],
            "icon": app_details["icon"],
            "rating": str(app_details["score"])
        }
        
        # Create result
        result = {
            "appInfo": app_info,
            "sentiment": sentiment_data,
            "reviews": reviews
        }
        
        # Save to history
        global current_id
        analysis = {
            "id": current_id,
            "appName": app_details["title"],
            "sentimentScore": sentiment_data["averageScore"],
            "date": datetime.now().strftime("%b %d, %Y"),
            "appIcon": app_details["icon"]
        }
        analysis_history.append(analysis)
        current_id += 1
        
        return result
    
    except Exception as e:
        print(f"Error analyzing app reviews: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze app reviews: {str(e)}")

@app.get("/api/reviews/history")
async def get_app_analysis_history():
    return analysis_history

@app.get("/api/reviews/{id}")
async def get_app_analysis_by_id(id: int):
    # This is a simplified implementation since we don't have persistent storage
    # In a real application, you would retrieve the analysis from a database
    for item in analysis_history:
        if item["id"] == id:
            # For demonstration purposes, we'll return a mock analysis
            # In a real application, you'd retrieve the full analysis from storage
            raise HTTPException(status_code=404, detail=f"Full analysis data not available for id: {id}")
    
    raise HTTPException(status_code=404, detail=f"Analysis not found for id: {id}")

@app.delete("/api/reviews/history")
async def clear_app_analysis_history():
    global analysis_history
    analysis_history = []
    return {"message": "Analysis history cleared"}

# Run the application
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)