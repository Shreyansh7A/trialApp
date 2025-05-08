'use client';

import { useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { format } from 'date-fns';

// Types
interface AppInfo {
  name: string;
  packageName: string;
  developer: string;
  icon: string;
  rating: string;
}

interface Review {
  id: string;
  userName: string | null;
  userImage: string | null;
  content: string;
  score: number;
  thumbsUpCount: number;
  reviewCreatedVersion: string | null;
  at: string;
  replyContent: string | null;
  replyAt: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
}

interface SentimentData {
  averageScore: number;
  reviewCount: number;
  date: string;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
}

interface AnalysisResult {
  appInfo: AppInfo;
  sentiment: SentimentData;
  reviews: Review[];
}

interface AppAnalysis {
  id: number;
  appName: string;
  sentimentScore: number;
  date: string;
  appIcon?: string;
}

export default function Home() {
  const [appName, setAppName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AppAnalysis[]>([]);
  
  async function fetchHistory() {
    try {
      const response = await axios.get('/api/reviews/history');
      setHistory(response.data);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  }
  
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    
    if (!appName.trim()) {
      setError('Please enter an app name or package ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`/api/reviews/analyze?app_name=${encodeURIComponent(appName)}`);
      setResult(response.data);
      
      // Refresh history after a successful search
      await fetchHistory();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to analyze app reviews';
      setError(errorMessage);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleLoadHistoryItem(id: number) {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/reviews/${id}`);
      setResult(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load analysis';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleClearHistory() {
    try {
      await axios.delete('/api/reviews/history');
      setHistory([]);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  }
  
  function handleNewAnalysis() {
    setResult(null);
  }
  
  function handleDismissError() {
    setError(null);
  }
  
  // Fetch history on component mount
  useState(() => {
    fetchHistory();
  });

  function getSentimentColor(score: number): string {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          App Review Sentiment Analysis
        </h1>
        <p className="text-gray-600 mt-2">
          Analyze Google Play Store app reviews using advanced sentiment analysis
        </p>
      </header>
      
      {!result ? (
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Enter app name or package ID (e.g., com.instagram.android)"
                className="form-input flex-grow"
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Analyze Reviews'}
              </button>
            </div>
          </form>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 relative">
              <span>{error}</span>
              <button 
                onClick={handleDismissError}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Analyzing app reviews...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a moment as we process up to 100 reviews</p>
            </div>
          ) : (
            history.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Recent Analyses</h2>
                  <button
                    onClick={handleClearHistory}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear History
                  </button>
                </div>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadHistoryItem(item.id)}
                      className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      {item.appIcon && (
                        <div className="w-10 h-10 rounded-md overflow-hidden mr-3">
                          <Image 
                            src={item.appIcon} 
                            alt={item.appName} 
                            width={40} 
                            height={40} 
                          />
                        </div>
                      )}
                      <div className="flex-grow">
                        <h3 className="font-medium">{item.appName}</h3>
                        <div className="text-sm text-gray-500">
                          {format(new Date(item.date), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                      <div className={`text-lg font-semibold ${getSentimentColor(item.sentimentScore)}`}>
                        {Math.round(item.sentimentScore)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="w-16 h-16 rounded-xl overflow-hidden">
                <Image 
                  src={result.appInfo.icon} 
                  alt={result.appInfo.name} 
                  width={64} 
                  height={64}
                />
              </div>
              <div className="flex-grow text-center md:text-left">
                <h2 className="text-2xl font-bold">{result.appInfo.name}</h2>
                <p className="text-gray-600">{result.appInfo.developer}</p>
                <p className="text-sm text-gray-500">{result.appInfo.packageName}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="card bg-gradient-to-br from-blue-100 to-blue-50">
                <h3 className="text-lg font-semibold mb-2">Average Sentiment</h3>
                <div className={`text-4xl font-bold ${getSentimentColor(result.sentiment.averageScore)}`}>
                  {Math.round(result.sentiment.averageScore)}
                </div>
                <p className="text-sm text-gray-600 mt-1">Out of 100</p>
              </div>
              
              <div className="card bg-gradient-to-br from-indigo-100 to-indigo-50">
                <h3 className="text-lg font-semibold mb-2">Reviews Analyzed</h3>
                <div className="text-4xl font-bold text-indigo-600">{result.sentiment.reviewCount}</div>
                <p className="text-sm text-gray-600 mt-1">Most recent reviews</p>
              </div>
              
              <div className="card bg-gradient-to-br from-purple-100 to-purple-50">
                <h3 className="text-lg font-semibold mb-2">Sentiment Breakdown</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Positive: {result.sentiment.positivePercentage}%</span>
                  <span className="text-yellow-600">Neutral: {result.sentiment.neutralPercentage}%</span>
                  <span className="text-red-600">Negative: {result.sentiment.negativePercentage}%</span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div className="flex h-full">
                    <div 
                      className="bg-green-500 h-full" 
                      style={{ width: `${result.sentiment.positivePercentage}%` }}
                    ></div>
                    <div 
                      className="bg-yellow-500 h-full" 
                      style={{ width: `${result.sentiment.neutralPercentage}%` }}
                    ></div>
                    <div 
                      className="bg-red-500 h-full" 
                      style={{ width: `${result.sentiment.negativePercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Review Samples</h2>
              <button
                onClick={handleNewAnalysis}
                className="btn btn-secondary"
              >
                New Analysis
              </button>
            </div>
            
            <div className="space-y-4">
              {result.reviews.slice(0, 10).map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="flex-shrink-0 mr-3">
                      {review.userImage ? (
                        <Image 
                          src={review.userImage} 
                          alt={review.userName || 'User'} 
                          width={40} 
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                          {(review.userName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{review.userName || 'Anonymous User'}</p>
                      <div className="flex items-center">
                        <div className="flex mr-2">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < review.score ? "text-yellow-500" : "text-gray-300"}>★</span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(new Date(review.at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-auto">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        review.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                        review.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)} ({Math.round(review.sentimentScore)})
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700">{review.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}