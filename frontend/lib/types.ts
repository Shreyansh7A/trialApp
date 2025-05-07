export interface AppInfo {
  name: string;
  packageName: string;
  developer: string;
  icon: string;
  rating: string;
}

export interface Review {
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

export interface SentimentData {
  averageScore: number;
  reviewCount: number;
  date: string;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
}

export interface AnalysisResult {
  appInfo: AppInfo;
  sentiment: SentimentData;
  reviews: Review[];
}

export interface AppAnalysis {
  id: number;
  appName: string;
  sentimentScore: number;
  date: string;
  appIcon?: string;
}