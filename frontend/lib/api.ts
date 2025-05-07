import axios from 'axios';
import type { AnalysisResult, AppAnalysis } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function analyzeAppReviews(appName: string): Promise<AnalysisResult> {
  try {
    const response = await api.post('/api/reviews/analyze', null, {
      params: { app_name: appName }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to analyze app reviews');
    }
    throw new Error('Failed to connect to server');
  }
}

export async function getAnalysisHistory(): Promise<AppAnalysis[]> {
  try {
    const response = await api.get('/api/reviews/history');
    return response.data;
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    return [];
  }
}

export async function getAnalysisById(id: number): Promise<AnalysisResult> {
  try {
    const response = await api.get(`/api/reviews/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to fetch analysis');
    }
    throw new Error('Failed to connect to server');
  }
}

export async function clearAnalysisHistory(): Promise<void> {
  try {
    await api.delete('/api/reviews/history');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to clear history');
    }
    throw new Error('Failed to connect to server');
  }
}