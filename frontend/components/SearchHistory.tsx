'use client';

import React from 'react';
import Image from 'next/image';
import type { AppAnalysis } from '../lib/types';

interface SearchHistoryProps {
  historyItems: AppAnalysis[];
  onLoadHistoryItem: (id: number) => void;
  onClearHistory: () => void;
}

export default function SearchHistory({ 
  historyItems, 
  onLoadHistoryItem, 
  onClearHistory 
}: SearchHistoryProps) {
  if (historyItems.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Analysis History</h2>
        <p className="text-gray-500">No previous analyses found</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Analysis History</h2>
        <button
          onClick={onClearHistory}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          Clear History
        </button>
      </div>
      
      <div className="space-y-3">
        {historyItems.map((item) => (
          <div 
            key={item.id}
            className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onLoadHistoryItem(item.id)}
          >
            <div className="flex-shrink-0 mr-3 relative w-10 h-10">
              {item.appIcon && (
                <Image
                  src={item.appIcon}
                  alt={item.appName}
                  fill
                  className="rounded-md"
                />
              )}
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="font-medium text-gray-800 truncate">{item.appName}</h3>
              <p className="text-sm text-gray-500">{item.date}</p>
            </div>
            <div className="flex-shrink-0 ml-2">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${getSentimentColor(item.sentimentScore)}`}
              >
                {item.sentimentScore}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getSentimentColor(score: number): string {
  if (score >= 70) return 'bg-green-100 text-green-800';
  if (score <= 40) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}