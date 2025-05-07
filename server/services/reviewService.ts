import gplay from 'google-play-scraper';
import { analyzeSentiment as openAiAnalyzeSentiment } from '@/lib/openai';
import { format } from 'date-fns';
import pLimit from 'p-limit';
import { Review, AppInfo } from '@shared/schema';

// Rate limit for API calls (5 per second)
const limit = pLimit(5);

interface AppReviewsResult {
  appInfo: AppInfo;
  reviews: gplay.IReviewsItem[];
}

// Fetch app information and reviews
export async function getAppReviews(appNameOrId: string): Promise<AppReviewsResult> {
  try {
    // First determine if input is a package name or app title
    let appId = appNameOrId;
    
    // If it doesn't look like a package name, search for it
    if (!appNameOrId.includes('.')) {
      const searchResults = await gplay.search({
        term: appNameOrId,
        num: 1
      });
      
      if (searchResults.length === 0) {
        throw new Error(`No app found with name: ${appNameOrId}`);
      }
      
      appId = searchResults[0].appId;
    }
    
    // Get app details
    const appDetails = await gplay.app({ appId });
    
    // Get recent reviews (100)
    const reviews = await gplay.reviews({
      appId,
      sort: gplay.sort.NEWEST,
      num: 100
    });
    
    const appInfo: AppInfo = {
      name: appDetails.title,
      packageName: appDetails.appId,
      developer: appDetails.developer,
      icon: appDetails.icon,
      rating: appDetails.score.toString(),
    };
    
    return {
      appInfo,
      reviews: reviews.data
    };
  } catch (error) {
    console.error('Error fetching app reviews:', error);
    throw new Error(`Failed to fetch app reviews: ${(error as Error).message}`);
  }
}

// Analyze sentiment of reviews
export async function analyzeSentiment(reviews: gplay.IReviewsItem[]): Promise<Review[]> {
  try {
    // Process reviews with rate limiting
    const analyzedReviews = await Promise.all(
      reviews.map(review => limit(async () => {
        try {
          // Skip empty reviews
          if (!review.text || review.text.trim() === '') {
            return null;
          }
          
          // Analyze sentiment
          const sentimentResult = await openAiAnalyzeSentiment(review.text);
          
          return {
            id: review.id,
            userName: review.userName || null,
            userImage: review.userImage || null,
            content: review.text,
            score: review.score,
            thumbsUpCount: review.thumbsUp,
            reviewCreatedVersion: review.reviewCreatedVersion || null,
            at: review.at,
            replyContent: review.replyText || null,
            replyAt: review.repliedAt || null,
            sentiment: sentimentResult.sentiment,
            sentimentScore: sentimentResult.score,
          } as Review;
        } catch (error) {
          console.error(`Error analyzing review ${review.id}:`, error);
          // Return review without sentiment analysis on error
          return {
            id: review.id,
            userName: review.userName || null,
            userImage: review.userImage || null,
            content: review.text,
            score: review.score,
            thumbsUpCount: review.thumbsUp,
            reviewCreatedVersion: review.reviewCreatedVersion || null,
            at: review.at,
            replyContent: review.replyText || null,
            replyAt: review.repliedAt || null,
            sentiment: 'neutral',
            sentimentScore: 50,
          } as Review;
        }
      }))
    );
    
    // Filter out null entries
    return analyzedReviews.filter(Boolean) as Review[];
  } catch (error) {
    console.error('Error during sentiment analysis:', error);
    throw new Error(`Failed to analyze sentiment: ${(error as Error).message}`);
  }
}

// Calculate sentiment statistics
export function calculateSentimentData(reviews: Review[]) {
  const reviewCount = reviews.length;
  
  if (reviewCount === 0) {
    return {
      averageScore: 0,
      reviewCount: 0,
      date: format(new Date(), 'MMM d, yyyy'),
      positivePercentage: 0,
      negativePercentage: 0,
      neutralPercentage: 0,
    };
  }
  
  let totalScore = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  
  reviews.forEach(review => {
    totalScore += review.sentimentScore || 50;
    
    switch (review.sentiment) {
      case 'positive':
        positiveCount++;
        break;
      case 'negative':
        negativeCount++;
        break;
      case 'neutral':
      default:
        neutralCount++;
        break;
    }
  });
  
  const averageScore = Math.round(totalScore / reviewCount);
  const positivePercentage = Math.round((positiveCount / reviewCount) * 100);
  const negativePercentage = Math.round((negativeCount / reviewCount) * 100);
  const neutralPercentage = 100 - positivePercentage - negativePercentage;
  
  return {
    averageScore,
    reviewCount,
    date: format(new Date(), 'MMM d, yyyy'),
    positivePercentage,
    negativePercentage,
    neutralPercentage,
  };
}
