'use client';

import { useState } from 'react';
import SearchForm from '../components/SearchForm';
import ResultsCard from '../components/ResultsCard';
import SearchHistory from '../components/SearchHistory';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { analyzeAppReviews, getAnalysisHistory, clearAnalysisHistory } from '../lib/api';
import type { AnalysisResult, AppAnalysis } from '../lib/types';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [historyItems, setHistoryItems] = useState<AppAnalysis[]>([]);

  // Fetch history on mount
  useState(() => {
    fetchHistory();
  });

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
    setResult(null);
    
    try {
      const data = await analyzeAppReviews(appName);
      setResult(data);
      await fetchHistory(); // Refresh history after new analysis
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleClearHistory() {
    try {
      await clearAnalysisHistory();
      setHistoryItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear history');
    }
  }

  function handleNewAnalysis() {
    setResult(null);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="text-center mb-12">
        <h1 className="heading-text mb-4">
          App Review Sentiment Analyzer
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Analyze the sentiment of the latest reviews for any Android app on Google Play Store
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {!result && !isLoading && !error && (
            <SearchForm onSubmit={handleSearch} isLoading={isLoading} />
          )}
          
          {isLoading && <LoadingState />}
          
          {error && <ErrorState errorMessage={error} onDismiss={() => setError(null)} />}
          
          {result && !isLoading && !error && (
            <ResultsCard result={result} onNewAnalysis={handleNewAnalysis} />
          )}
        </div>
        
        <div className="md:col-span-1">
          <SearchHistory 
            historyItems={historyItems} 
            onClearHistory={handleClearHistory}
            onLoadHistoryItem={() => {}} // We'll implement this later
          />
        </div>
      </div>
    </div>
  );
}