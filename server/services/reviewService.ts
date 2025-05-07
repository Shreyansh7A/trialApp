import { analyzeSentiment as openAiAnalyzeSentiment } from '@/lib/openai';
import { format } from 'date-fns';
import pLimit from 'p-limit';
import { Review, AppInfo } from '@shared/schema';

// Interface for app suggestion results
export interface AppSuggestion {
  title: string;
  appId: string;
  developer: string;
  icon: string;
}

// Mock data for popular Android apps
const popularApps = [
  {
    title: 'Instagram',
    appId: 'com.instagram.android',
    developer: 'Instagram',
    icon: 'https://play-lh.googleusercontent.com/c2DcVsBUhJb3a-Q-LOdCfPbkWr2DI7UCiKpYXoHi4FpHtQ0ZOGd1MV5x_mRNxQevB98=s180-rw'
  },
  {
    title: 'Facebook',
    appId: 'com.facebook.katana',
    developer: 'Meta Platforms, Inc.',
    icon: 'https://play-lh.googleusercontent.com/ccWDU4A7fX1R24v-vvT480ySh26AYp97g1VrIB_FIdjRcuQB2JP2WdY7h_wVVAeSpg=s180-rw'
  },
  {
    title: 'WhatsApp Messenger',
    appId: 'com.whatsapp',
    developer: 'WhatsApp LLC',
    icon: 'https://play-lh.googleusercontent.com/bYtqbOcTYOlgc6gqZ2rwb8lptHuwlNE75zYJu6Bn076-hTmvd96HH-6v7S0YUAAJXoJN=s180-rw'
  },
  {
    title: 'TikTok',
    appId: 'com.zhiliaoapp.musically',
    developer: 'TikTok Pte. Ltd.',
    icon: 'https://play-lh.googleusercontent.com/iBYjvXUKh9H_w-1JrGhE8UuHEZIYfpzbKLTtaUIVxYELH6vdID-4bqr6GS_iVLHVuh8=s180-rw'
  },
  {
    title: 'Spotify: Music and Podcasts',
    appId: 'com.spotify.music',
    developer: 'Spotify AB',
    icon: 'https://play-lh.googleusercontent.com/UrY7BAZ-XfXGpfkeWg0zCCeo-7ras4DCoRalC_WXXWTK9q5b0Iw7B0YQMsVxZaNB7DM=s180-rw'
  },
  {
    title: 'Netflix',
    appId: 'com.netflix.mediaclient',
    developer: 'Netflix, Inc.',
    icon: 'https://play-lh.googleusercontent.com/TBRwjS_qfJCSj1m7zZB93FnpJM5fSpMA_wUlFDLxWAb45T9RmwBvQd5cWR5viJJOhkI=s180-rw'
  },
  {
    title: 'YouTube',
    appId: 'com.google.android.youtube',
    developer: 'Google LLC',
    icon: 'https://play-lh.googleusercontent.com/lMoItBgdPPVDJsNOVtP26EKHePkwBg-PkuY9NOrc-fumRtTFP4XhpUNk_22syN4Datc=s180-rw'
  },
  {
    title: 'Google Maps',
    appId: 'com.google.android.apps.maps',
    developer: 'Google LLC',
    icon: 'https://play-lh.googleusercontent.com/Kf8WTct65hFJxBUDm5E-EpYsiDoLQiGGbnuyP6HBNax43YShXti9THPon1YKB6zPYpA=s180-rw'
  },
  {
    title: 'Gmail',
    appId: 'com.google.android.gm',
    developer: 'Google LLC',
    icon: 'https://play-lh.googleusercontent.com/KSuaRLiI_FlDP8cM4MzJ23ml3og5Hxb9AapaGTMZ2GgR103mvJ3AAnoOFz1yheeQBBI=s180-rw'
  },
  {
    title: 'Amazon Shopping',
    appId: 'com.amazon.mShop.android.shopping',
    developer: 'Amazon Mobile LLC',
    icon: 'https://play-lh.googleusercontent.com/QPKtPRTJyhrYoPqYmjpYQadVGqIvKO0Vy-QdZJQjUrGY-Qr8qok6cgnEZk3WGAS3Ls4=s180-rw'
  }
];

// Rate limit for API calls (5 per second)
const limit = pLimit(5);

// Sample review data structure
interface ReviewItem {
  id: string;
  userName: string;
  userImage: string | null;
  text: string;
  score: number;
  thumbsUp: number;
  reviewCreatedVersion: string | null;
  at: string;
  replyText: string | null;
  repliedAt: string | null;
}

interface AppReviewsResult {
  appInfo: AppInfo;
  reviews: ReviewItem[];
}

// Generate mock reviews for an app
function generateMockReviews(appId: string, count: number = 100): ReviewItem[] {
  const reviews: ReviewItem[] = [];
  const possibleScores = [1, 2, 3, 4, 5];
  const possibleTexts = [
    "I love this app, it's the best!",
    "Works great most of the time, but sometimes crashes.",
    "Horrible experience, can't even log in.",
    "The latest update fixed all my issues, very happy now.",
    "Average app, nothing special but gets the job done.",
    "Would be better if it had more features.",
    "Great user interface but slow performance.",
    "App is good but battery usage is excessive.",
    "Best app in its category, highly recommend!",
    "Constantly crashes on my device, uninstalling.",
    "Love the new features in the recent update.",
    "Can't believe this app is free, it's amazing!",
    "Ads are too intrusive, ruins the experience.",
    "Solid app, been using it for years.",
    "Customer support is excellent, fixed my issue quickly."
  ];
  
  for (let i = 0; i < count; i++) {
    const randomScore = possibleScores[Math.floor(Math.random() * possibleScores.length)];
    const randomText = possibleTexts[Math.floor(Math.random() * possibleTexts.length)];
    const randomDate = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
    
    reviews.push({
      id: `review-${appId}-${i}`,
      userName: `User${i}`,
      userImage: null,
      text: randomText,
      score: randomScore,
      thumbsUp: Math.floor(Math.random() * 50),
      reviewCreatedVersion: `1.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
      at: randomDate.toISOString(),
      replyText: Math.random() > 0.7 ? "Thank you for your feedback!" : null,
      repliedAt: Math.random() > 0.7 ? new Date(randomDate.getTime() + 24 * 60 * 60 * 1000).toISOString() : null
    });
  }
  
  return reviews;
}

// Fetch app information and reviews (using built-in data)
export async function getAppReviews(appNameOrId: string): Promise<AppReviewsResult> {
  try {
    // Find the app by name or ID
    let app = popularApps.find(a => a.appId.toLowerCase() === appNameOrId.toLowerCase());
    
    // If not found by ID, try to find by name
    if (!app) {
      app = popularApps.find(a => a.title.toLowerCase().includes(appNameOrId.toLowerCase()));
    }
    
    if (!app) {
      throw new Error(`No app found with name or ID: ${appNameOrId}`);
    }
    
    // Generate mock reviews
    const mockReviews = generateMockReviews(app.appId);
    
    const appInfo: AppInfo = {
      name: app.title,
      packageName: app.appId,
      developer: app.developer,
      icon: app.icon,
      rating: (3 + Math.random() * 2).toFixed(1), // Random rating between 3-5
    };
    
    return {
      appInfo,
      reviews: mockReviews
    };
  } catch (error) {
    console.error('Error fetching app reviews:', error);
    throw new Error(`Failed to fetch app reviews: ${(error as Error).message}`);
  }
}

// Analyze sentiment of reviews
export async function analyzeSentiment(reviews: ReviewItem[]): Promise<Review[]> {
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

// Search for app suggestions based on query
export async function searchAppSuggestions(query: string, searchLimit: number = 5): Promise<AppSuggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Filter apps based on query
    const lowerQuery = query.toLowerCase();
    const matchingApps = popularApps
      .filter(app => 
        app.title.toLowerCase().includes(lowerQuery) || 
        app.appId.toLowerCase().includes(lowerQuery) ||
        app.developer.toLowerCase().includes(lowerQuery)
      )
      .slice(0, searchLimit);
    
    return matchingApps;
  } catch (error) {
    console.error('Error searching for app suggestions:', error);
    return [];
  }
}

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