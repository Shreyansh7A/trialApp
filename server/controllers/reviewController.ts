import { Request, Response } from 'express';
import { format } from 'date-fns';
import * as reviewService from '../services/reviewService';
import { storage } from '../storage';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

export const analyzeAppReviews = async (req: Request, res: Response) => {
  try {
    const { appName } = req.body;

    if (!appName) {
      return res.status(400).json({ 
        message: 'App name or package ID is required' 
      });
    }

    // Get app info and reviews
    const { appInfo, reviews } = await reviewService.getAppReviews(appName);

    // Analyze sentiment
    const analyzedReviews = await reviewService.analyzeSentiment(reviews);

    // Calculate sentiment data
    const sentimentData = reviewService.calculateSentimentData(analyzedReviews);

    // Store the analysis result
    const analysisData = {
      appName: appInfo.name,
      packageName: appInfo.packageName,
      developerName: appInfo.developer,
      appIcon: appInfo.icon,
      appRating: appInfo.rating,
      reviewCount: sentimentData.reviewCount,
      averageSentiment: sentimentData.averageScore,
      positivePercentage: sentimentData.positivePercentage,
      negativePercentage: sentimentData.negativePercentage,
      neutralPercentage: sentimentData.neutralPercentage,
      sampleReviews: analyzedReviews.slice(0, 10),
    };

    const savedAnalysis = await storage.createAppAnalysis(analysisData);

    // Build response object
    const result = {
      appInfo,
      sentimentData,
      reviewSamples: analyzedReviews.slice(0, 10),
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error analyzing app reviews:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: fromZodError(error).message 
      });
    }
    
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    
    return res.status(500).json({ 
      message: 'An unexpected error occurred while analyzing app reviews' 
    });
  }
};

export const getAppAnalysisHistory = async (_req: Request, res: Response) => {
  try {
    const history = await storage.getAppAnalysisHistory();
    return res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch analysis history' 
    });
  }
};

export const getAppAnalysisById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid analysis ID' });
    }
    
    const analysis = await storage.getAppAnalysis(id);
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    // Rebuild the analysis result format
    const result = {
      appInfo: {
        name: analysis.appName,
        packageName: analysis.packageName,
        developer: analysis.developerName,
        icon: analysis.appIcon,
        rating: analysis.appRating,
      },
      sentimentData: {
        averageScore: analysis.averageSentiment,
        reviewCount: analysis.reviewCount,
        date: format(new Date(analysis.createdAt), 'MMM d, yyyy'),
        positivePercentage: analysis.positivePercentage,
        negativePercentage: analysis.negativePercentage,
        neutralPercentage: analysis.neutralPercentage,
      },
      reviewSamples: analysis.sampleReviews,
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching analysis by ID:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch analysis' 
    });
  }
};

export const clearAppAnalysisHistory = async (_req: Request, res: Response) => {
  try {
    await storage.clearAppAnalysisHistory();
    return res.status(200).json({ message: 'Analysis history cleared' });
  } catch (error) {
    console.error('Error clearing analysis history:', error);
    return res.status(500).json({ 
      message: 'Failed to clear analysis history' 
    });
  }
};

export const searchAppSuggestions = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        message: 'Search query is required' 
      });
    }

    // Search for app suggestions
    const suggestions = await reviewService.searchAppSuggestions(query);
    return res.status(200).json(suggestions);
  } catch (error) {
    console.error('Error searching app suggestions:', error);
    return res.status(500).json({ 
      message: 'Failed to search for app suggestions' 
    });
  }
};
