import React from 'react';

export default function LoadingState() {
  return (
    <div className="card flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      <h3 className="mt-4 text-xl font-semibold">Analyzing Reviews</h3>
      <p className="mt-2 text-gray-600 text-center">
        Fetching and analyzing app reviews. This may take a moment depending on the number of reviews.
      </p>
    </div>
  );
}