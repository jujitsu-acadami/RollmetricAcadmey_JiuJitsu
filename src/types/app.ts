import { Drill } from "./bjj";

export type Page = 'home' | 'drill' | 'account';
export type ModelComplexity = 'lite' | 'full' | 'heavy';
export type SessionState = 'idle' | 'running' | 'paused';

export interface VoiceCueSettings {
  enabled: boolean;
  type: string;
  frequency: string;
  style: string;
}

export interface AppSettings {
  modelComplexity: ModelComplexity;
  showSkeleton: boolean;
  skeletonColor: string;
  skeletonThickness: 2 | 5 | 8;
  drillLayout: 'immersive' | 'dashboard';
  focusArea: Drill[];
  skillLevel: string;
  voiceCues: VoiceCueSettings;
  trainingGoals: Record<string, boolean>;
  selfDefense: boolean;
}

export interface SettingsContextType {
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
}