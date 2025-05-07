'use client';

import { useState, useEffect } from 'react';
import SearchForm from '../components/SearchForm';
import ResultsCard from '../components/ResultsCard';
import SearchHistory from '../components/SearchHistory';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { analyzeAppReviews, getAnalysisHistory, getAnalysisById, clearAnalysisHistory } from '../lib/api';
import type { AnalysisResult, AppAnalysis } from '../lib/types';

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [historyItems, setHistoryItems] = useState<AppAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchHistory();
  }, []);
  
  async function fetchHistory() {
    try {
      const history = await getAnalysisHistory();
      setHistoryItems(history);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  }
  
  async function handleSearch(appName: string) {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    
    try {
      const result = await analyzeAppReviews(appName);
      setAnalysisResult(result);
      fetchHistory(); // Refresh history after analysis
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing the app reviews');
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleLoadHistoryItem(id: number) {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getAnalysisById(id);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load analysis');
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleClearHistory() {
    try {
      await clearAnalysisHistory();
      setHistoryItems([]);
    } catch (err: any) {
      setError(err.message || 'Failed to clear history');
    }
  }
  
  function handleNewAnalysis() {
    setAnalysisResult(null);
  }
  
  function handleDismissError() {
    setError(null);
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
          App Review Sentiment Analyzer
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Analyze the sentiment of Google Play Store reviews for any Android app. Discover how users really feel about an application with AI-powered sentiment analysis.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          {!analysisResult && !isLoading && !error && (
            <SearchForm onSubmit={handleSearch} isLoading={isLoading} />
          )}
          
          {historyItems.length > 0 && !isLoading && (
            <div className="mt-6">
              <SearchHistory 
                historyItems={historyItems}
                onLoadHistoryItem={handleLoadHistoryItem}
                onClearHistory={handleClearHistory}
              />
            </div>
          )}
        </div>
        
        <div className="md:col-span-2">
          {isLoading && <LoadingState />}
          
          {error && (
            <ErrorState 
              errorMessage={error} 
              onDismiss={handleDismissError} 
            />
          )}
          
          {analysisResult && !isLoading && !error && (
            <ResultsCard 
              result={analysisResult} 
              onNewAnalysis={handleNewAnalysis} 
            />
          )}
        </div>
      </div>
    </main>
  );
}