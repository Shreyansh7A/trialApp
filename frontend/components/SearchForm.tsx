'use client';

import { useState } from 'react';

interface SearchFormProps {
  onSubmit: (appName: string) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
  const [appName, setAppName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appName.trim()) {
      setError('Please enter an app name');
      return;
    }
    
    setError('');
    onSubmit(appName.trim());
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Analyze App Reviews</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="appName" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            App Name or ID
          </label>
          <input
            id="appName"
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="e.g. Instagram or com.instagram.android"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn-primary w-full flex justify-center"
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Sentiment'}
          </button>
        </div>

        <div className="mt-2 text-sm text-gray-500">
          <p>Enter the name of any app on Google Play Store to analyze the sentiment of its recent reviews.</p>
        </div>
      </form>
    </div>
  );
}