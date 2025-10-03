export type AdvancedKpiType = {
  reactionTime: number | null;
  moveSuccess: number | null;
  fastScrambles: number | null;
  intensityEndurance: number | null;
  consistency: number | null;
  moveVariety: number | null;
  balanceStability: number | null;
  postureIntegrity: number | null;
  explosiveness: number | null;
  flowRhythm: number | null;
  reactionSteadiness: number | null;
  readyStanceTime: number | null;
  hipFlexibility: number | null;
  moveAccuracy: number | null;
};

export interface DurationMetrics {
  totalTime: number; // seconds
  activeTime: number; // seconds
  activeTimePercentage: number;
  readyStanceTime: number; // seconds
  readyStancePercentage: number;
}

export interface EffortMetrics {
  averageIntensity: number; // 0-100
  peakIntensity: number; // 0-100
  dutyCycle: number; // % MOVING
  fatigueTrend: number; // pp/s (points per second)
}

export interface TechniqueQualityMetrics {
  postureQuality: number; // 0-100
  baseStability: number; // 0-100
  flowSmoothness: number; // 0-100
  consistency: number; // 0-100
}

export interface ScrambleMetrics {
  count: number;
  stabilizationRate: number; // %
  outcomeImpact: number; // delta in scorecard
}

export interface MovementPatternMetrics {
  variety: number; // count of unique patterns
  repeatedPatterns: { signature: string; count: number }[];
}

export interface Scorecard {
  value: number; // 0-100
  weights: {
    balance: number;
    posture: number;
    flow: number;
    intensity: number;
    accuracy: number;
  };
}

export interface ScenarioMetrics {
  stableControlTime?: number; // %
  guardMobilityIndex?: number;
  guardActivityRate?: number;
  transitionCompletions?: number;
  transitionMedianTime?: number;
  transitionErrors?: number;
  reactionTimeAvg?: number;
  reactionTimeBest?: number;
  reactionSteadiness?: number;
}


export interface SessionReport {
  duration: DurationMetrics;
  effort: EffortMetrics;
  technique: TechniqueQualityMetrics;
  scramble: ScrambleMetrics;
  patterns: MovementPatternMetrics;
  scorecard: Scorecard;
  scenario: ScenarioMetrics;
}

export interface Session {
  startTime: Date;
  duration: number; // in seconds
  drill: Drill | 'all';
  focusArea: Drill[]; // Keep focus area for context
  report: SessionReport;
  feedbackLog: string[];
}

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

export interface PoseMetrics {
  balance: number | null;
  posture: number | null;
  hipHeight: number | null;
  baseWidth: number | null;
}

export interface EngineUpdateResult {
    kpis: AdvancedKpiType;
    reactionTime: number | null;
    poseMetrics: PoseMetrics;
    userState: 'IDLE' | 'MOVING';
    identifiedPosition: string;
}