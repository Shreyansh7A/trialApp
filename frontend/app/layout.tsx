import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'App Review Sentiment Analyzer',
  description: 'Analyze the sentiment of Google Play Store reviews for any Android app.',
  keywords: 'sentiment analysis, app reviews, google play store, android apps, review analyzer',
  authors: [{ name: 'App Sentiment Analyzer Team' }],
  openGraph: {
    title: 'App Review Sentiment Analyzer',
    description: 'Analyze the sentiment of Google Play Store reviews for any Android app.',
    url: 'https://app-review-analyzer.com',
    siteName: 'App Review Sentiment Analyzer',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}