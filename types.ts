
export interface RoomDetection {
  name: string;
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
}

export interface RemedyObject {
  conflict: string;
  remedy: string;
  impact: string;
}

export interface FurnitureDetection {
  name: string;
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  zone: string;
  isCompliant: boolean;
  remedy?: string;
  message: string;
}

export interface VastuResult {
  isValidFloorPlan: boolean;
  validationError?: string;
  score: number;
  projectedScore?: number; // Score after applying remedies
  scannedElementsCount?: number; // Total number of architectural elements scanned
  status: string;
  verdict?: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL';
  verdictDescription?: string;
  inferredNorth?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'TILTED_CLOCKWISE' | 'TILTED_ANTICLOCKWISE';
  inferredNorthDescription?: string; // e.g. "North is showing at 30° North East"
  multipleUnitsDetected: boolean;
  detectedUnits?: string[]; 
  shapeType?: 'RECTANGULAR' | 'SQUARE' | 'L_SHAPED' | 'U_SHAPED' | 'IRREGULAR' | 'CIRCULAR';
  layoutComplexity?: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'EXTREME';
  complianceTable: Array<{
    area: string;
    currentZone: string;
    status: string;
    idealZone: string;
  }>;
  conflicts: string[];
  remedies: string[];
  remedyObjects?: RemedyObject[]; 
  generatedSymbolUrl?: string;
  roomDetections?: RoomDetection[];
  furnitureDetections?: FurnitureDetection[];
  propertyBoundary?: [number, number, number, number]; 
}

export type AppState = 'IDLE' | 'UPLOADING' | 'SCANNING' | 'RESULTS' | 'CAMERA_CAPTURE' | 'VIEWING_3D' | 'COMPARE_SCANNING' | 'COMPARE_RESULTS' | 'LOGIN' | 'LIVE_AUDIT' | 'SUBSCRIPTION' | 'UNIT_SELECTION' | 'PROFILE' | 'EDITING_BOUNDARIES';

export interface Property {
  id: string;
  name: string;
  address: string;
  type: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL';
  createdAt: number;
}

export interface SavedReport {
  id: string;
  propertyId?: string;
  timestamp: number;
  result: VastuResult;
  preview: string;
  name: string;
  category?: string;
}

export interface ThreeDModelData {
  url: string;
  type: 'glb' | 'obj';
  name: string;
}

export interface ComparisonData {
  resultA: VastuResult;
  resultB: VastuResult;
  previewA: string;
  previewB: string;
}

export type SubscriptionPlan = 'basic' | 'daily' | 'monthly' | 'yearly';

export interface User {
  id: string;
  name: string;
  email: string;
  contact: string;
  preferences?: string;
  isGoogleUser?: boolean;
  isAdmin?: boolean;
  subscription: {
    plan: SubscriptionPlan;
    expiry?: number; // timestamp
    usage: {
      single: number;
      compare: number;
      live: number;
    }
  }
}

export interface SavedSession {
  mode: 'single' | 'compare' | 'live';
  timestamp: number;
  singleResult?: VastuResult;
  singlePreview?: string;
  compareResults?: ComparisonData;
}

export interface LiveAnalysisFeedback {
  object: string;
  zone: string;
  isCompliant: boolean;
  remedy?: string;
  message: string;
  hindiMessage?: string;
}
