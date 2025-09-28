// Fix: Defined Page type and removed circular import.
export type Page = 'home' | 'drill' | 'account';

export type KpiType = {
  postureHeight: number | null;
  baseWidth: number | null;
  hipHeight: number | null;
};

export interface Session {
  startTime: Date;
  duration: number; // in seconds
  drill: Drill | 'all';
  kpiAverages: KpiType;
  feedbackLog: string[];
}

export type ModelComplexity = 'lite' | 'full' | 'heavy';

// Fix: Moved DrillCategory type here from DrillData.ts to be centrally available.
export type DrillCategory = 'Attack Positions' | 'Defensive Situations' | 'Transitional & Neutral';

export type Drill =
  | 'side-control'
  | 'mount'
  | 'back-control'
  | 'knee-on-belly'
  | 'north-south'
  | 'attacking-guard'
  | 'bottom-mount'
  | 'bottom-back-control'
  | 'bottom-side-control'
  | 'bottom-knee-on-belly'
  | 'bottom-north-south'
  | 'turtle'
  | 'bottom-takedown'
  | 'defensive-guard'
  | 'half-guard'
  | 'open-guard'
  | 'leg-entanglements'
  | 'scramble';


export type SessionState = 'idle' | 'running' | 'paused';

export interface AppSettings {
  modelComplexity: ModelComplexity;
  showSkeleton: boolean;
  skeletonColor: string;
  skeletonThickness: 2 | 5 | 8; // Thin, Normal, Thick
  drillLayout: 'immersive' | 'dashboard';
  focusArea: Drill[]; // User's selected drills
}