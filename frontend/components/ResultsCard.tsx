'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { AnalysisResult, Review } from '../lib/types';

interface ResultsCardProps {
  result: AnalysisResult;
  onNewAnalysis: () => void;
}

export default function ResultsCard({ result, onNewAnalysis }: ResultsCardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  
  const { appInfo, sentiment, reviews } = result;
  
  // Get top positive and negative reviews
  const positiveReviews = reviews
    .filter(review => review.sentiment === 'positive')
    .sort((a, b) => b.sentimentScore - a.sentimentScore)
    .slice(0, 3);
    
  const negativeReviews = reviews
    .filter(review => review.sentiment === 'negative')
    .sort((a, b) => a.sentimentScore - b.sentimentScore)
    .slice(0, 3);

  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <div className="flex-shrink-0 w-16 h-16 mr-4 relative">
          <Image 
            src={appInfo.icon} 
            alt={appInfo.name}
            fill
            className="rounded-md"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{appInfo.name}</h2>
          <p className="text-gray-600">{appInfo.developer}</p>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex border-b">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'overview' 
                ? 'border-b-2 border-primary-600 text-primary-600' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'reviews' 
                ? 'border-b-2 border-primary-600 text-primary-600' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('reviews')}
          >
            Sample Reviews
          </button>
        </div>
      </div>
      
      {activeTab === 'overview' ? (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-2">Sentiment Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">Overall Score</p>
                <p className="text-3xl font-bold">{sentiment.averageScore}/100</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700 font-medium">Positive</p>
                <p className="text-3xl font-bold">{sentiment.positivePercentage}%</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-700 font-medium">Negative</p>
                <p className="text-3xl font-bold">{sentiment.negativePercentage}%</p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Analysis Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Reviews Analyzed</span>
                <span className="font-medium">{sentiment.reviewCount}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Analysis Date</span>
                <span className="font-medium">{sentiment.date}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">App Rating</span>
                <span className="font-medium">{appInfo.rating} ⭐</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Package Name</span>
                <span className="font-medium">{appInfo.packageName}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Top Positive Reviews</h3>
            <div className="space-y-4">
              {positiveReviews.length > 0 ? (
                positiveReviews.map(review => (
                  <ReviewItem key={review.id} review={review} />
                ))
              ) : (
                <p className="text-gray-500">No positive reviews found</p>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Top Negative Reviews</h3>
            <div className="space-y-4">
              {negativeReviews.length > 0 ? (
                negativeReviews.map(review => (
                  <ReviewItem key={review.id} review={review} />
                ))
              ) : (
                <p className="text-gray-500">No negative reviews found</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 text-center">
        <button 
          onClick={onNewAnalysis}
          className="btn-primary"
        >
          Analyze Another App
        </button>
      </div>
    </div>
  );
}

interface ReviewItemProps {
  review: Review;
}

function ReviewItem({ review }: ReviewItemProps) {
  const sentimentColor = 
    review.sentiment === 'positive' ? 'green' :
    review.sentiment === 'negative' ? 'red' : 'gray';
    
  const formattedDate = new Date(review.at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className="mr-3">
            {review.userImage ? (
              <Image 
                src={review.userImage} 
                alt={review.userName || 'User'} 
                width={32} 
                height={32} 
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-sm">
                  {review.userName ? review.userName.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="font-medium">{review.userName || 'Anonymous'}</p>
            <p className="text-sm text-gray-500">{formattedDate}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-sm font-medium bg-${sentimentColor}-100 text-${sentimentColor}-800`}>
          {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)} ({review.sentimentScore})
        </div>
      </div>
      
      <div className="mt-3">
        <div className="flex items-center mb-1">
          <div className="flex">
            {[...Array(review.score)].map((_, i) => (
              <span key={i} className="text-yellow-400">★</span>
            ))}
            {[...Array(5 - review.score)].map((_, i) => (
              <span key={i} className="text-gray-300">★</span>
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-500">
            {review.reviewCreatedVersion ? `Version ${review.reviewCreatedVersion}` : ''}
          </span>
        </div>
        
        <p className="text-gray-800">{review.content}</p>
        
        {review.replyContent && (
          <div className="mt-3 pl-3 border-l-2 border-gray-300">
            <p className="text-sm font-medium">Developer Response:</p>
            <p className="text-sm text-gray-600">{review.replyContent}</p>
          </div>
        )}
      </div>
    </div>
  );
}