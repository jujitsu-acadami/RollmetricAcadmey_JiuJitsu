import { Landmark } from '@mediapipe/tasks-vision';
import { AdvancedKpiType } from '../types';

// Using landmark indices for torso to approximate center of mass and base
const LANDMARK_INDICES = {
  NOSE: 0,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

// A simple 3D vector type for calculations
type Vector3 = { x: number; y: number; z: number };

// Configuration interface for the engine to allow tuning
export interface EngineConfig {
  historySize: number;
  velocityThreshold: number; // in body-lengths/s
  idleFramesThreshold: number;
  scrambleAccelThreshold: number; // in body-lengths/s^2
  flowJerkThreshold: number; // in body-lengths/s^2
  explosivenessWindow: number; // Frames to check for peak acceleration
  moveSignaturePathLength: number; // Number of frames to define a move
}

// A single frame's data, including calculated kinematics
interface FrameData {
  landmarks: Landmark[];
  timestamp: number;
  com?: Vector3;
  velocity?: Vector3;
  acceleration?: Vector3;
  jerk?: Vector3;
}

export interface EngineUpdateResult {
    kpis: AdvancedKpiType;
    reactionTime: number | null; // This is now a one-shot event, separated from continuous KPIs
}

export class BjjAnalyticsEngine {
  private config: EngineConfig;
  private frameHistory: FrameData[] = [];
  private userState: 'IDLE' | 'MOVING' = 'IDLE';
  private idleFrameCounter: number = 0;
  
  // --- New fields based on technical review ---
  private emaCom?: Vector3;
  private bodyScale?: number;

  // --- KPI-specific state ---
  private scrambleCount: number = 0;
  private lastScrambleTime: number = 0;
  private intensityHistory: { value: number, timestamp: number }[] = [];
  private flowHistory: number[] = [];
  private moveSignatures: Set<string> = new Set();
  private lastSignature: string = '';
  private currentMovePath: Vector3[] = [];
  private reactionTimeHistory: number[] = [];
  private readyStanceTimeMs: number = 0;
  private lastFrameTime: number = 0;
  private minHipY: number = Infinity;
  private maxHipY: number = -Infinity;
  private lastExplosivePower: number = 0;
  private framesSinceMoveStart: number | null = null;
  
  // --- New Reaction Time State (Decoupled) ---
  private isAwaitingReaction: boolean = false;
  private stimulusTime: number = 0;
  private lastReactionTime: number | null = null;
  private lastOnsetTs?: number;
  private quietMs = 200;
  private onsetHoldMs = 80;
  private onsetArmed = false;
  private speedHistory: {t:number, s:number}[] = [];


  constructor(config: Partial<EngineConfig> = {}) {
    this.config = {
      historySize: 60,
      velocityThreshold: 0.5, // Normalized: 0.2 m/s / 0.4m body scale = 0.5 bl/s
      idleFramesThreshold: 30,
      scrambleAccelThreshold: 22.5, // Normalized: 9.0 m/s^2 / 0.4m body scale
      flowJerkThreshold: 0.5, // Tuned for normalized speed jerk
      explosivenessWindow: 15, // ~0.5s at 30fps
      moveSignaturePathLength: 20, // ~0.66s path
      ...config,
    };
  }
  
  public startReactionTest(): void {
    this.isAwaitingReaction = true;
    this.stimulusTime = performance.now();
    this.lastReactionTime = null;
    this.onsetArmed = false;
    this.lastOnsetTs = undefined;
    this.speedHistory = []; // Clear history for a clean baseline
  }

  public update(worldLandmarks: Landmark[] | undefined, timestamp: number, sessionStartTime: number): EngineUpdateResult {
    if (!worldLandmarks || worldLandmarks.length < 29) {
      return this._getResetState();
    }
    
    // Handle one-shot reaction time event
    const reactionTimeEvent = this.lastReactionTime;
    if (this.lastReactionTime) this.lastReactionTime = null;

    this.frameHistory.unshift({ landmarks: worldLandmarks, timestamp });
    if (this.frameHistory.length > this.config.historySize) this.frameHistory.pop();
    this._calculateKinematics(); 

    const previousState = this.userState;
    const currentVelocity = this.frameHistory[0]?.velocity;
    const velocityMagnitude = currentVelocity ? this._vectorMagnitude(currentVelocity) : 0;
    
    // Decoupled onset detection for reaction time
    this._detectOnset(velocityMagnitude, timestamp);

    if (velocityMagnitude > this.config.velocityThreshold) {
      this.userState = 'MOVING';
      this.idleFrameCounter = 0;
    } else {
      this.idleFrameCounter++;
      if (this.userState === 'MOVING' && this.idleFrameCounter >= this.config.idleFramesThreshold) {
        this.userState = 'IDLE';
      }
    }

    if (this.userState === 'MOVING' && previousState === 'IDLE') {
        this._onMovementStart();
    } else if (this.userState === 'IDLE' && previousState === 'MOVING') {
        this._onMovementEnd();
    }
    
    this._updateAdvancedMetrics(timestamp);
    
    const kpis = this._calculateAllKpis(velocityMagnitude, timestamp, sessionStartTime);
    kpis.reactionTime = reactionTimeEvent;
    
    return {
        kpis,
        reactionTime: reactionTimeEvent
    };
  }

  public reset(): void {
      this.frameHistory = [];
      this.userState = 'IDLE';
      this.idleFrameCounter = 0;
      this.scrambleCount = 0;
      this.lastScrambleTime = 0;
      this.intensityHistory = [];
      this.flowHistory = [];
      this.isAwaitingReaction = false;
      this.lastReactionTime = null;
      this.lastExplosivePower = 0;
      this.framesSinceMoveStart = null;
      this.moveSignatures = new Set();
      this.lastSignature = '';
      this.currentMovePath = [];
      this.reactionTimeHistory = [];
      this.readyStanceTimeMs = 0;
      this.lastFrameTime = 0;
      this.minHipY = Infinity;
      this.maxHipY = -Infinity;
      this.emaCom = undefined;
      this.bodyScale = undefined;
      this.speedHistory = [];
      this.lastOnsetTs = undefined;
      this.onsetArmed = false;
  }
  
  private _calculateAllKpis(velocityMagnitude: number, timestamp: number, sessionStartTime: number): AdvancedKpiType {
    const sessionDurationMs = timestamp - sessionStartTime;

    const balance = this._calculateBalanceStability();
    const posture = this._calculatePostureIntegrity();
    const flow = this._calculateFlowRhythm();

    if(this.userState === 'MOVING' && flow !== null) {
      this.flowHistory.push(flow);
      if(this.flowHistory.length > 100) this.flowHistory.shift();
    }

    return {
      reactionTime: this.reactionTimeHistory.length > 0 ? this.reactionTimeHistory[this.reactionTimeHistory.length - 1] : null,
      moveSuccess: this._calculateMoveSuccess(balance, posture, flow),
      fastScrambles: this.scrambleCount,
      intensityEndurance: this._calculateIntensityEndurance(velocityMagnitude, timestamp),
      consistency: this._calculateConsistency(),
      moveVariety: this.moveSignatures.size,
      balanceStability: balance,
      postureIntegrity: posture,
      explosiveness: this._calculateExplosiveness(),
      flowRhythm: flow,
      reactionSteadiness: this._calculateReactionSteadiness(),
      readyStanceTime: sessionDurationMs > 0 ? (this.readyStanceTimeMs / sessionDurationMs) * 100 : 0,
      hipFlexibility: this._calculateHipFlexibility(),
      moveAccuracy: this._calculateMoveAccuracy(),
    };
  }

  private _onMovementStart() {
    this.framesSinceMoveStart = 0;
    this.lastExplosivePower = 0;
    this.currentMovePath = [];
    // Reaction time is now handled by _detectOnset
  }

  private _onMovementEnd() {
    this.framesSinceMoveStart = null;
    this._finalizeMoveSignature();
  }

  private _getResetState(): EngineUpdateResult {
    const kpis: AdvancedKpiType = {
      reactionTime: null, moveSuccess: null, fastScrambles: null, intensityEndurance: null,
      consistency: null, moveVariety: null, balanceStability: null, postureIntegrity: null,
      explosiveness: null, flowRhythm: null, reactionSteadiness: null, readyStanceTime: null,
      hipFlexibility: null, moveAccuracy: null,
    };
    return { kpis, reactionTime: null };
  }

  private _calculateCoM(landmarks: Landmark[]): Vector3 {
    const { LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP } = LANDMARK_INDICES;
    return {
      x: (landmarks[LEFT_SHOULDER].x + landmarks[RIGHT_SHOULDER].x + landmarks[LEFT_HIP].x + landmarks[RIGHT_HIP].x) / 4,
      y: (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y + landmarks[LEFT_HIP].y + landmarks[RIGHT_HIP].y) / 4,
      z: (landmarks[LEFT_SHOULDER].z + landmarks[RIGHT_SHOULDER].z + landmarks[LEFT_HIP].z + landmarks[RIGHT_HIP].z) / 4,
    };
  }

  private _calculateKinematics(): void {
    if (this.frameHistory.length < 2) return;

    const currentFrame = this.frameHistory[0];
    const prevFrame = this.frameHistory[1];
    const lm = currentFrame.landmarks;

    // --- EMA Smoothing ---
    const rawCom = this._calculateCoM(lm);
    this.emaCom = this._emaV(this.emaCom, rawCom, 0.3);
    currentFrame.com = this.emaCom;

    // --- Body-Scale Normalization ---
    const sW = this._vectorMagnitude(this._subtract(lm[LANDMARK_INDICES.LEFT_SHOULDER], lm[LANDMARK_INDICES.RIGHT_SHOULDER]));
    const hW = this._vectorMagnitude(this._subtract(lm[LANDMARK_INDICES.LEFT_HIP], lm[LANDMARK_INDICES.RIGHT_HIP]));
    const rawScale = Math.max(sW, hW);
    this.bodyScale = this._ema(this.bodyScale ?? rawScale, rawScale, 0.2);
    if (!this.bodyScale || this.bodyScale < 1e-3) return; // Quality gate

    const dt = (currentFrame.timestamp - prevFrame.timestamp) / 1000;
    if (dt <= 0 || !prevFrame.com) return;
    
    // --- Normalized Kinematics ---
    currentFrame.velocity = this._scale(this._subtract(currentFrame.com, prevFrame.com), 1 / dt / this.bodyScale);
    if (prevFrame.velocity) {
       currentFrame.acceleration = this._scale(this._subtract(currentFrame.velocity, prevFrame.velocity), 1 / dt);
    }
    if (prevFrame.acceleration) {
        currentFrame.jerk = this._scale(this._subtract(currentFrame.acceleration, prevFrame.acceleration), 1 / dt);
    }
  }

  private _detectOnset(speed: number, timestamp: number) {
    const now = timestamp;
    this.speedHistory.push({ t: now, s: speed });
    this.speedHistory = this.speedHistory.filter(e => now - e.t < 500);
    
    const quietWindow = this.speedHistory.filter(e => now - e.t > 50 && now - e.t < this.quietMs);
    
    if (quietWindow.length > 4) this.onsetArmed = true;

    if (!this.isAwaitingReaction || !this.onsetArmed) return;

    const baseline = quietWindow.length ? quietWindow.reduce((a, b) => a + b.s, 0) / quietWindow.length : 0;
    const noise = Math.sqrt((quietWindow.reduce((a, b) => a + (b.s - baseline) ** 2, 0) / (quietWindow.length || 1)));
    const threshold = baseline + 3 * noise + 0.05; // Use a small floor for normalized speed
    
    const isAboveThreshold = speed > threshold;
    if (isAboveThreshold) {
      if (!this.lastOnsetTs) this.lastOnsetTs = now;
      if (now - this.lastOnsetTs >= this.onsetHoldMs) {
        this.lastReactionTime = now - this.stimulusTime;
        this.reactionTimeHistory.push(this.lastReactionTime);
        this.isAwaitingReaction = false;
        this.onsetArmed = false;
        this.lastOnsetTs = undefined;
      }
    } else {
      this.lastOnsetTs = undefined;
    }
  }

  private _calculateIntensityEndurance(velocityMagnitude: number, timestamp: number): number {
    const maxReasonableVelocity = 8.0; // Normalized: 4.0 m/s / 0.5m scale = 8.0 bl/s
    const instantIntensity = Math.min(100, (velocityMagnitude / maxReasonableVelocity) * 100);

    this.intensityHistory.push({ value: instantIntensity, timestamp });
    this.intensityHistory = this.intensityHistory.filter(entry => timestamp - entry.timestamp < 20000);
    if (this.intensityHistory.length < 10) return instantIntensity;

    const sessionAverage = this.intensityHistory.reduce((sum, entry) => sum + entry.value, 0) / this.intensityHistory.length;
    const recentAverage = this.intensityHistory.slice(-10).reduce((sum, entry) => sum + entry.value, 0) / 10;

    const fatigueFactor = Math.max(0, (sessionAverage - recentAverage) / (sessionAverage + 1));
    const finalIntensity = instantIntensity * (1 - fatigueFactor * 0.5);
    return Math.max(0, Math.min(100, finalIntensity));
  }

  private _calculateFlowRhythm(): number | null {
    if (this.frameHistory.length < 10) return 100;
    const speeds = this.frameHistory.slice(0, 10).map(f => f.velocity ? this._vectorMagnitude(f.velocity) : null).filter((s): s is number => s !== null);
    if (speeds.length < 5) return 100;

    const jerks = [];
    for (let i = 1; i < speeds.length; i++) {
        jerks.push((speeds[i] - speeds[i-1]));
    }
    const avgAbsJerk = jerks.reduce((a, b) => a + Math.abs(b), 0) / jerks.length;
    return Math.max(0, Math.min(100, 100 - (avgAbsJerk / this.config.flowJerkThreshold) * 100));
  }

  private _updateAdvancedMetrics(timestamp: number): void {
    const frame = this.frameHistory[0];
    if (!frame) return;

    if (frame.acceleration) {
        const accMag = this._vectorMagnitude(frame.acceleration);
        if (accMag > this.config.scrambleAccelThreshold && (timestamp - this.lastScrambleTime > 1500)) {
            this.scrambleCount++;
            this.lastScrambleTime = timestamp;
        }
    }
    
    if (frame.com) {
        const rawComY = this._calculateCoM(frame.landmarks).y;
        this.minHipY = Math.min(this.minHipY, rawComY);
        this.maxHipY = Math.max(this.maxHipY, rawComY);
    }

    if (this.lastFrameTime > 0) {
        const posture = this._calculatePostureIntegrity() ?? 0;
        if (this.userState === 'IDLE' && posture > 80) {
            this.readyStanceTimeMs += timestamp - this.lastFrameTime;
        }
    }
    this.lastFrameTime = timestamp;
  }

  private _calculateBalanceStability(): number | null {
    const lm = this.frameHistory[0]?.landmarks;
    if (!lm || !this.bodyScale || !this.frameHistory[0]?.com) return null;
    
    const lAnk = lm[LANDMARK_INDICES.LEFT_ANKLE];
    const rAnk = lm[LANDMARK_INDICES.RIGHT_ANKLE];
    
    // Use raw landmark coords for base of support, not smoothed CoM
    const midFeetX = (lAnk.x + rAnk.x) / 2;
    const baseWidth = Math.abs(lAnk.x - rAnk.x);

    // Use smoothed CoM for stability check
    const comX = this.frameHistory[0].com!.x;
    
    const offset = Math.abs(comX - midFeetX);
    
    // Score is based on how far the CoM is from the center of the base, as a percentage of the base width.
    // Being within half the base width is considered stable.
    const score = 100 * (1 - Math.min(1, offset / (baseWidth * 0.5 + 1e-4)));
    return Math.max(0, Math.min(100, score));
  }
  
  private _calculatePostureIntegrity(): number | null {
    const landmarks = this.frameHistory[0].landmarks;
    const { LEFT_HIP, RIGHT_HIP, LEFT_SHOULDER, RIGHT_SHOULDER, NOSE } = LANDMARK_INDICES;

    const hipCenter = this._midpoint(landmarks[LEFT_HIP], landmarks[RIGHT_HIP]);
    const shoulderCenter = this._midpoint(landmarks[LEFT_SHOULDER], landmarks[RIGHT_SHOULDER]);
    const head = landmarks[NOSE];

    const spineVec = this._normalize(this._subtract(shoulderCenter, hipCenter));
    const neckVec = this._normalize(this._subtract(head, shoulderCenter));

    const alignment = this._dot(spineVec, neckVec);
    return ((alignment + 1) / 2) * 100;
  }

  private _calculateExplosiveness(): number | null {
    if (this.framesSinceMoveStart === null) {
        return this.userState === 'IDLE' ? null : this.lastExplosivePower;
    }

    if (this.framesSinceMoveStart < this.config.explosivenessWindow) {
        const frame = this.frameHistory[0];
        if (frame?.acceleration) {
            const currentAccel = this._vectorMagnitude(frame.acceleration);
            this.lastExplosivePower = Math.max(this.lastExplosivePower, currentAccel);
        }
        this.framesSinceMoveStart++;
    }

    const maxReasonableAccel = 60.0; // Normalized: 25 m/s^2 / ~0.4m body scale
    return Math.min(100, (this.lastExplosivePower / maxReasonableAccel) * 100);
  }

  private _calculateHipFlexibility(): number | null {
      if (this.minHipY === Infinity || !this.bodyScale) return null;
      const range = this.maxHipY - this.minHipY;
      // Normalize range by body scale. A range of 1 body scale is considered max flexibility.
      const maxReasonableRange = this.bodyScale; 
      return Math.min(100, (range / maxReasonableRange) * 100);
  }

  private _calculateReactionSteadiness(): number | null {
      if (this.reactionTimeHistory.length < 2) return null;
      const mean = this.reactionTimeHistory.reduce((a, b) => a + b, 0) / this.reactionTimeHistory.length;
      if (mean === 0) return 100;
      const stdDev = this._stdDev(this.reactionTimeHistory);
      const coefficientOfVariation = stdDev / mean;
      return Math.max(0, 100 - (coefficientOfVariation * 200));
  }

  private _calculateMoveSuccess(balance: number | null, posture: number | null, flow: number | null): number | null {
    if (this.userState !== 'MOVING' || balance === null || posture === null || flow === null) {
      return null;
    }
    return (balance * 0.4) + (posture * 0.3) + (flow * 0.3);
  }

  private _calculateConsistency(): number | null {
    if (this.userState !== 'MOVING' || this.flowHistory.length < 20) return null;
    const stdDev = this._stdDev(this.flowHistory);
    return Math.max(0, Math.min(100, 100 - (stdDev * 4)));
  }

  private _calculateMoveAccuracy(): number | null {
    if (!this.lastSignature) return null;
    const currentPath = this.currentMovePath;
    if (currentPath.length < this.config.moveSignaturePathLength) return null;

    const firstPoint = currentPath[0];
    const normalizedPath = currentPath.map(p => this._subtract(p, firstPoint));
    const currentSignature = normalizedPath.map(p => 
      `${Math.round(p.x * 10)},${Math.round(p.y * 10)},${Math.round(p.z * 10)}`
    ).join(';');
    
    const distance = this._levenshteinDistance(currentSignature, this.lastSignature);
    const maxPossibleDistance = Math.max(currentSignature.length, this.lastSignature.length);
    if (maxPossibleDistance === 0) return 100;

    const similarity = (1 - (distance / maxPossibleDistance)) * 100;
    return Math.max(0, similarity);
  }

  private _finalizeMoveSignature(): void {
    if (this.currentMovePath.length < this.config.moveSignaturePathLength / 2) {
      this.currentMovePath = [];
      return;
    }

    const firstPoint = this.currentMovePath[0];
    const normalizedPath = this.currentMovePath.map(p => this._subtract(p, firstPoint));
    const signature = normalizedPath.map(p => 
      `${Math.round(p.x * 10)},${Math.round(p.y * 10)},${Math.round(p.z * 10)}`
    ).join(';');

    this.moveSignatures.add(signature);
    this.lastSignature = signature;
    this.currentMovePath = [];
  }

  // --- Vector and Math Helpers ---
  private _ema(prev: number | undefined, curr: number, a=0.3){ return prev===undefined ? curr : a*curr + (1-a)*prev; }
  private _emaV(prev: Vector3 | undefined, curr: Vector3, a=0.3): Vector3 {
    if (!prev) return curr;
    return { x: this._ema(prev.x, curr.x, a), y: this._ema(prev.y, curr.y, a), z: this._ema(prev.z, curr.z, a) };
  }
  private _vectorMagnitude = (v: Vector3): number => Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
  private _add = (v1: Vector3, v2: Vector3): Vector3 => ({ x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z });
  private _subtract = (v1: Vector3, v2: Vector3): Vector3 => ({ x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z });
  private _scale = (v: Vector3, s: number): Vector3 => ({ x: v.x * s, y: v.y * s, z: v.z * s });
  private _normalize(v: Vector3): Vector3 {
      const mag = this._vectorMagnitude(v);
      return mag > 0 ? this._scale(v, 1/mag) : {x:0, y:0, z:0};
  }
  private _dot = (v1: Vector3, v2: Vector3): number => v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  private _midpoint = (p1: Landmark, p2: Landmark): Vector3 => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, z: (p1.z + p2.z) / 2 });
  
  private _stdDev(arr: number[]): number {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
    const variance = arr.reduce((acc, val) => acc + (val - mean) ** 2, 0) / (arr.length - 1);
    return Math.sqrt(variance);
  }

  private _levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) { matrix[0][i] = i; }
    for (let j = 0; j <= b.length; j++) { matrix[j][0] = j; }
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost,
        );
      }
    }
    return matrix[b.length][a.length];
  }
}
