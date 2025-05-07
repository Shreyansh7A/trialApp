import { Request, Response } from 'express';
import { format } from 'date-fns';
import axios from 'axios';
import * as reviewService from '../services/reviewService';
import { storage } from '../storage';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// FastAPI backend URL
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export const analyzeAppReviews = async (req: Request, res: Response) => {
  try {
    const appName = req.body.appName || req.query.appName;

    if (!appName) {
      return res.status(400).json({ 
        message: 'App name or package ID is required' 
      });
    }

    // Forward the request to FastAPI backend
    try {
      console.log(`Forwarding request to FastAPI backend: ${FASTAPI_URL}/api/reviews/analyze?app_name=${encodeURIComponent(appName)}`);
      const fastApiResponse = await axios.post(`${FASTAPI_URL}/api/reviews/analyze`, null, {
        params: { app_name: appName }
      });
      
      return res.status(200).json(fastApiResponse.data);
    } catch (fastApiError: any) {
      console.error('Error from FastAPI backend:', fastApiError.response?.data || fastApiError.message);
      
      // If we got a response from FastAPI with an error
      if (fastApiError.response) {
        // If we got a response with an error status from FastAPI, pass it through
        return res.status(fastApiError.response.status).json(fastApiError.response.data);
      }
      
      // Connection refused or other non-response errors
      
      // Fallback to legacy implementation if FastAPI is not available
      console.log('Falling back to legacy implementation...');
      const { appInfo, reviews } = await reviewService.getAppReviews(appName as string);
      const analyzedReviews = await reviewService.analyzeSentiment(reviews);
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
        sentiment: sentimentData,
        reviews: analyzedReviews,
      };

      return res.status(200).json(result);
    }
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
    // Forward the request to FastAPI backend
    try {
      console.log(`Forwarding request to FastAPI backend: ${FASTAPI_URL}/api/reviews/history`);
      const fastApiResponse = await axios.get(`${FASTAPI_URL}/api/reviews/history`);
      return res.status(200).json(fastApiResponse.data);
    } catch (fastApiError: any) {
      console.error('Error from FastAPI backend:', fastApiError.response?.data || fastApiError.message);
      
      // If FastAPI failed, fall back to the legacy implementation
      console.log('Falling back to legacy implementation...');
      const history = await storage.getAppAnalysisHistory();
      return res.status(200).json(history);
    }
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
    
    // Forward the request to FastAPI backend
    try {
      console.log(`Forwarding request to FastAPI backend: ${FASTAPI_URL}/api/reviews/${id}`);
      const fastApiResponse = await axios.get(`${FASTAPI_URL}/api/reviews/${id}`);
      return res.status(200).json(fastApiResponse.data);
    } catch (fastApiError: any) {
      console.error('Error from FastAPI backend:', fastApiError.response?.data || fastApiError.message);
      
      // If FastAPI failed, fall back to the legacy implementation
      console.log('Falling back to legacy implementation...');
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
        sentiment: {
          averageScore: analysis.averageSentiment,
          reviewCount: analysis.reviewCount,
          date: format(new Date(analysis.createdAt), 'yyyy-MM-dd HH:mm:ss'),
          positivePercentage: analysis.positivePercentage,
          negativePercentage: analysis.negativePercentage,
          neutralPercentage: analysis.neutralPercentage,
        },
        reviews: analysis.sampleReviews,
      };

      return res.status(200).json(result);
    }
  } catch (error) {
    console.error('Error fetching analysis by ID:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch analysis' 
    });
  }
};

export const clearAppAnalysisHistory = async (_req: Request, res: Response) => {
  try {
    // Forward the request to FastAPI backend
    try {
      console.log(`Forwarding request to FastAPI backend: ${FASTAPI_URL}/api/reviews/history`);
      const fastApiResponse = await axios.delete(`${FASTAPI_URL}/api/reviews/history`);
      return res.status(200).json(fastApiResponse.data);
    } catch (fastApiError: any) {
      console.error('Error from FastAPI backend:', fastApiError.response?.data || fastApiError.message);
      
      // If FastAPI failed, fall back to the legacy implementation
      console.log('Falling back to legacy implementation...');
      await storage.clearAppAnalysisHistory();
      return res.status(200).json({ message: 'Analysis history cleared' });
    }
  } catch (error) {
    console.error('Error clearing analysis history:', error);
    return res.status(500).json({ 
      message: 'Failed to clear analysis history' 
    });
  }
};
