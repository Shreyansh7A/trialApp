import { apiRequest } from "./queryClient";
import { AnalysisResult, AppAnalysis } from "@shared/schema";

export interface AppSuggestion {
  title: string;
  appId: string;
  developer: string;
  icon: string;
}

export async function analyzeAppReviews(appName: string): Promise<AnalysisResult> {
  const response = await apiRequest("POST", "/api/reviews/analyze", { appName });
  return await response.json();
}

export async function getAnalysisHistory(): Promise<AppAnalysis[]> {
  const response = await apiRequest("GET", "/api/reviews/history");
  return await response.json();
}

export async function getAnalysisById(id: number): Promise<AnalysisResult> {
  const response = await apiRequest("GET", `/api/reviews/${id}`);
  return await response.json();
}

export async function clearAnalysisHistory(): Promise<void> {
  await apiRequest("DELETE", "/api/reviews/history");
}

export async function searchAppSuggestions(query: string): Promise<AppSuggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  const response = await apiRequest("GET", `/api/reviews/search?query=${encodeURIComponent(query)}`);
  return await response.json();
}
