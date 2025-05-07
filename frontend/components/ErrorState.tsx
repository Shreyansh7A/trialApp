import React from 'react';

interface ErrorStateProps {
  errorMessage: string;
  onDismiss: () => void;
}

export default function ErrorState({ errorMessage, onDismiss }: ErrorStateProps) {
  return (
    <div className="card bg-red-50 border border-red-200">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-semibold text-red-700">Error</h3>
        <button 
          onClick={onDismiss}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      </div>
      
      <p className="mt-2 text-red-600">{errorMessage}</p>
      
      <div className="mt-4">
        <button 
          onClick={onDismiss}
          className="btn-primary bg-red-600 hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}