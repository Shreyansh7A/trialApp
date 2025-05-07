import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as reviewController from './controllers/reviewController';

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.post('/api/reviews/analyze', reviewController.analyzeAppReviews);
  app.get('/api/reviews/history', reviewController.getAppAnalysisHistory);
  app.get('/api/reviews/search', reviewController.searchAppSuggestions);
  app.get('/api/reviews/:id', reviewController.getAppAnalysisById);
  app.delete('/api/reviews/history', reviewController.clearAppAnalysisHistory);

  const httpServer = createServer(app);

  return httpServer;
}
