export type Page = 'home' | 'drill' | 'account';

export interface Session {
  startTime: Date;
  duration: number; // in seconds
}

export type ModelComplexity = 'lite' | 'full' | 'heavy';

export type Drill = 'side-control' | 'mount';

export type SessionState = 'idle' | 'running' | 'paused';

export interface AppSettings {
  modelComplexity: ModelComplexity;
  showSkeleton: boolean;
  skeletonColor: string;
  skeletonThickness: 2 | 5 | 8; // Thin, Normal, Thick
  drillLayout: 'immersive' | 'dashboard';
}