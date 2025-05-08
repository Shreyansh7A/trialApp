import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as reviewController from './controllers/reviewController';
import axios from 'axios';
import { log } from './vite';

// Define the FastAPI backend URL
const FASTAPI_URL = "http://localhost:8000";

// Helper function to forward requests to FastAPI backend
async function forwardToFastAPI(req: Request, res: Response, endpoint: string) {
  try {
    log(`Forwarding request to FastAPI backend: ${FASTAPI_URL}${endpoint}`);
    
    // Determine the HTTP method and handle request data
    const method = req.method.toLowerCase();
    const requestConfig: any = {
      method,
      url: `${FASTAPI_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // Add body for POST/PUT requests
    if (method === 'post' || method === 'put') {
      requestConfig.data = req.body;
    }
    
    // Add query parameters
    if (Object.keys(req.query).length > 0) {
      requestConfig.params = req.query;
    }
    
    // Make the request to FastAPI
    const response = await axios(requestConfig);
    
    // Forward the response back to the client
    res.status(response.status).json(response.data);
  } catch (error) {
    log(`Error from FastAPI backend: ${error.message}`);
    
    // Fall back to the legacy implementation
    log('Falling back to legacy implementation...');
    return false;
  }
  
  return true;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes with FastAPI forwarding
  app.post('/api/reviews/analyze', async (req, res, next) => {
    const success = await forwardToFastAPI(req, res, '/api/reviews/analyze');
    if (!success) {
      // Fall back to legacy implementation
      next();
    }
  }, reviewController.analyzeAppReviews);
  
  app.get('/api/reviews/history', async (req, res, next) => {
    const success = await forwardToFastAPI(req, res, '/api/reviews/history');
    if (!success) {
      // Fall back to legacy implementation
      next();
    }
  }, reviewController.getAppAnalysisHistory);
  
  app.get('/api/reviews/:id', async (req, res, next) => {
    const success = await forwardToFastAPI(req, res, `/api/reviews/${req.params.id}`);
    if (!success) {
      // Fall back to legacy implementation
      next();
    }
  }, reviewController.getAppAnalysisById);
  
  app.delete('/api/reviews/history', async (req, res, next) => {
    const success = await forwardToFastAPI(req, res, '/api/reviews/history');
    if (!success) {
      // Fall back to legacy implementation
      next();
    }
  }, reviewController.clearAppAnalysisHistory);
  
  // Direct sentiment analysis endpoint with FastAPI forwarding
  app.post('/api/sentiment', async (req, res, next) => {
    const success = await forwardToFastAPI(req, res, '/api/sentiment');
    if (!success) {
      // Fall back to legacy implementation
      next();
    }
  }, reviewController.analyzeSentiment);

  const httpServer = createServer(app);

  return httpServer;
}
