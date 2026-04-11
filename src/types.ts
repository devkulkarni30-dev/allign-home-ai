export interface User {
  _id: string;
  email: string;
  name: string;
  contact?: string;
  picture?: string;
  isAdmin: boolean;
  subscription: {
    plan: 'basic' | 'pro' | 'enterprise' | 'yearly';
    usage: {
      single: number;
      compare: number;
      live: number;
    };
  };
  preferences?: any;
  createdAt: string;
}

export interface Property {
  _id: string;
  userId: string;
  name: string;
  address?: string;
  type: string;
  createdAt: string;
}

export interface ZoneAnalysis {
  direction: string;
  room: string;
  status: 'Positive' | 'Neutral' | 'Negative';
  description: string;
}

export interface VastuResult {
  score: number;
  potentialScore: number;
  verdict: string;
  summary: string;
  zones: ZoneAnalysis[];
  remedies: string[];
}

export interface SavedReport {
  _id: string;
  userId: string;
  propertyId?: string;
  name: string;
  result: VastuResult;
  preview: string;
  timestamp: string;
}
