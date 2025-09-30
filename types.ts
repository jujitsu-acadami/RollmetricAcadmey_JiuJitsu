import { createContext } from 'react';

// Fix: Defined Page type and removed circular import.
export type Page = 'home' | 'drill' | 'account';

export type AdvancedKpiType = {
  reactionTime: number | null;        // How fast you move after something happens (ms)
  moveSuccess: number | null;         // Composite score for transition quality (%)
  fastScrambles: number | null;       // How often you switch directions quickly (Count)
  intensityEndurance: number | null;  // How strong and fast you move, factoring fatigue (%)
  consistency: number | null;         // How steady you are when repeating moves (%)
  moveVariety: number | null;         // How many different moves you use (Count)
  balanceStability: number | null;    // How steady your body stays when you move (%)
  postureIntegrity: number | null;    // How straight and strong your back and head stay (%)
  explosiveness: number | null;       // How strong and fast your first move is from stillness (%)
  flowRhythm: number | null;          // How evenly and smoothly you move (%)
  reactionSteadiness: number | null;  // How close your reaction times are across many tries (%)
  readyStanceTime: number | null;     // Time spent in a solid, ready stance (%)
  hipFlexibility: number | null;      // Hip range of motion during drills (%)
  moveAccuracy: number | null;        // How close your repeated moves are to each other (%)
};


export interface Session {
  startTime: Date;
  duration: number; // in seconds
  drill: Drill | 'all';
  kpiAverages: AdvancedKpiType;
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

// Context for settings to avoid prop drilling
export interface SettingsContextType {
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
}

// Fix: Use a named import for `createContext` to resolve an issue with the default React import. This corrects the type definition of the context, which in turn fixes type inference errors in components consuming this context.
export const SettingsContext = createContext<SettingsContextType | null>(null);