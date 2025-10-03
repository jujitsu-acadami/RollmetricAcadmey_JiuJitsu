import { Landmark } from '@mediapipe/tasks-vision';
import { AdvancedKpiType, EngineUpdateResult, PoseMetrics, SessionReport, DurationMetrics, EffortMetrics, TechniqueQualityMetrics, ScrambleMetrics, MovementPatternMetrics, Scorecard, ScenarioMetrics } from '../types';

// --- CONSTANTS ---
const IDLE_VELOCITY_THRESHOLD = 0.1; // m/s
const SCRAMBLE_ACCEL_THRESHOLD = 6.0; // m/s^2

// --- TYPES ---
interface Kinematics {
    velocity: { x: number; y: number; z: number; magnitude: number; };
    acceleration: { x: number; y: number; z: number; magnitude: number; };
}

interface FrameData {
    timestamp: number;
    kpis: AdvancedKpiType;
    userState: 'IDLE' | 'MOVING';
    balance: number | null;
    posture: number | null;
}

interface Movement {
    startTime: number;
    endTime: number;
    path: { x: number; z: number }[];
    peakAcceleration: number;
}

// --- HELPERS ---
const _magnitude = (vec: { x: number, y: number, z: number }) => Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2);
const _avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const _slope = (y2: number, y1: number, x2: number, x1: number) => (x2 - x1 !== 0) ? (y2 - y1) / (x2 - x1) : 0;


export class BjjAnalyticsEngine {
    private lastTimestamp: number = 0;
    private lastLandmarks: Landmark[] | null = null;
    private lastVelocity: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
    
    // Session-long data logging
    private frameHistory: FrameData[] = [];
    private movementHistory: Movement[] = [];
    private currentMovement: Partial<Movement> | null = null;
    private scrambleTimestamps: number[] = [];
    private lastScrambleTimestamp: number = 0;
    
    // Positional Fingerprinting
    private positionHistory: { position: string, duration: number }[] = [];
    private lastPosition: string = 'Neutral';
    private lastPositionTimestamp: number = 0;


    constructor(options: {}) {
        this.reset();
    }

    public reset(): void {
        this.lastTimestamp = 0;
        this.lastLandmarks = null;
        this.lastVelocity = { x: 0, y: 0, z: 0 };
        this.frameHistory = [];
        this.movementHistory = [];
        this.currentMovement = null;
        this.scrambleTimestamps = [];
        this.lastScrambleTimestamp = 0;
        this.positionHistory = [];
        this.lastPosition = 'Neutral';
        this.lastPositionTimestamp = 0;
    }

    public update(worldLandmarks: Landmark[], timestamp: number, sessionStartTime: number): EngineUpdateResult {
        if (!worldLandmarks || worldLandmarks.length < 33) {
            const emptyKpis = this.getEmptyKpis();
            return { kpis: emptyKpis, reactionTime: null, poseMetrics: { balance: null, posture: null, hipHeight: null, baseWidth: null }, userState: 'IDLE', identifiedPosition: 'Neutral' };
        }

        const dt = this.lastTimestamp > 0 ? (timestamp - this.lastTimestamp) / 1000 : 0.016;
        this.lastTimestamp = timestamp;

        const com = this._getCenterOfMass(worldLandmarks);
        const lastCom = this.lastLandmarks ? this._getCenterOfMass(this.lastLandmarks) : com;

        const kinematics = this._calculateKinematics(com, lastCom, dt);
        const userState = kinematics.velocity.magnitude > IDLE_VELOCITY_THRESHOLD ? 'MOVING' : 'IDLE';

        this._updateMovementTracking(userState, timestamp, com, kinematics.acceleration.magnitude);
        
        const identifiedPosition = this._identifyPosition(worldLandmarks);
        this._updatePositionalTracking(identifiedPosition, timestamp);

        const poseMetrics = this._calculatePoseMetrics(worldLandmarks);
        const kpis = this._calculateLiveKpis(poseMetrics, userState, kinematics);
        
        this.frameHistory.push({ timestamp, kpis, userState, balance: poseMetrics.balance, posture: poseMetrics.posture });

        this.lastLandmarks = worldLandmarks;
        this.lastVelocity = kinematics.velocity;

        return { kpis, reactionTime: null, poseMetrics, userState, identifiedPosition };
    }
    
    // --- PRIVATE CALCULATION METHODS ---

    private _getCenterOfMass(landmarks: Landmark[]): { x: number; y: number; z: number } {
        const hips = [landmarks[23], landmarks[24]];
        const shoulders = [landmarks[11], landmarks[12]];
        const points = [...hips, ...shoulders].filter(Boolean);
        if (points.length === 0) return { x: 0, y: 0, z: 0 };
        return {
            x: _avg(points.map(p => p.x)),
            y: _avg(points.map(p => p.y)),
            z: _avg(points.map(p => p.z)),
        };
    }

    private _calculateKinematics(com: any, lastCom: any, dt: number): Kinematics {
        if (dt <= 0) return { velocity: {x:0,y:0,z:0, magnitude:0}, acceleration: {x:0,y:0,z:0, magnitude:0} };
        const velocity = {
            x: (com.x - lastCom.x) / dt,
            y: (com.y - lastCom.y) / dt,
            z: (com.z - lastCom.z) / dt,
        };
        const acceleration = {
            x: (velocity.x - this.lastVelocity.x) / dt,
            y: (velocity.y - this.lastVelocity.y) / dt,
            z: (velocity.z - this.lastVelocity.z) / dt,
        };
        return {
            velocity: { ...velocity, magnitude: _magnitude(velocity) },
            acceleration: { ...acceleration, magnitude: _magnitude(acceleration) },
        };
    }
    
    private _updateMovementTracking(userState: 'IDLE' | 'MOVING', timestamp: number, com: any, acceleration: number) {
        const isMoving = userState === 'MOVING';
        const wasMoving = this.currentMovement !== null;

        if (isMoving && !wasMoving) { // Movement started
            this.currentMovement = { startTime: timestamp, path: [{x: com.x, z: com.z}], peakAcceleration: 0 };
        } else if (isMoving && wasMoving) { // Movement continues
            this.currentMovement!.path!.push({x: com.x, z: com.z});
            this.currentMovement!.peakAcceleration = Math.max(this.currentMovement!.peakAcceleration!, acceleration);
            if (acceleration > SCRAMBLE_ACCEL_THRESHOLD && (timestamp - this.lastScrambleTimestamp) > 2000) { // 2s cooldown
                this.scrambleTimestamps.push(timestamp);
                this.lastScrambleTimestamp = timestamp;
            }
        } else if (!isMoving && wasMoving) { // Movement ended
            this.currentMovement!.endTime = timestamp;
            if (this.currentMovement!.path!.length > 5) { // Filter out micro-movements
                this.movementHistory.push(this.currentMovement as Movement);
            }
            this.currentMovement = null;
        }
    }
    
     private _updatePositionalTracking(currentPosition: string, timestamp: number) {
        if (currentPosition !== this.lastPosition) {
            const duration = timestamp - this.lastPositionTimestamp;
            if (duration > 1000) { // Only log positions held for >1s
                this.positionHistory.push({ position: this.lastPosition, duration: duration / 1000 });
            }
            this.lastPosition = currentPosition;
            this.lastPositionTimestamp = timestamp;
        }
    }

    private _identifyPosition(landmarks: Landmark[]): string {
        const pm = this._calculatePoseMetrics(landmarks);
        if (pm.hipHeight === null || pm.baseWidth === null) return 'Neutral';

        // Fingerprint for Top Mount/Side Control (very low hips)
        if (pm.hipHeight < 0.25 && pm.baseWidth > 0.4) {
            return 'Top-Control';
        }
        // Fingerprint for Guard (high knees, upright posture)
        const lKnee = landmarks[25];
        const rKnee = landmarks[26];
        const hipMid = this._getCenterOfMass([landmarks[23], landmarks[24]]);
        if (!lKnee || !rKnee || !hipMid) return 'Neutral';
        if (lKnee.y > hipMid.y && rKnee.y > hipMid.y && pm.posture! > 75) {
            return 'Guard';
        }

        return 'Neutral';
    }


    private _calculatePoseMetrics(landmarks: Landmark[]): PoseMetrics {
        const [ls, rs, lh, rh, lk, rk] = [11, 12, 23, 24, 25, 26].map(i => landmarks[i]);
        if (!ls || !rs || !lh || !rh || !lk || !rk) return { balance: null, posture: null, hipHeight: null, baseWidth: null };

        const shoulderMid = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
        const hipMid = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
        const torsoHeight = Math.abs(shoulderMid.y - hipMid.y);

        const hipHeight = torsoHeight;
        const baseWidth = Math.abs(lk.x - rk.x);

        const hipShoulderVec = { x: shoulderMid.x - hipMid.x, y: shoulderMid.y - hipMid.y, z: 0 };
        const mag = Math.sqrt(hipShoulderVec.x**2 + hipShoulderVec.y**2);
        const postureScore = mag > 0 ? (Math.abs(hipShoulderVec.y) / mag) * 100 : 0;
        
        const com = this._getCenterOfMass(landmarks);
        const balanceOffset = Math.abs(com.x - (lk.x + rk.x) / 2);
        const balanceScore = Math.max(0, 100 - (balanceOffset / (baseWidth / 2)) * 100);

        return {
            balance: isNaN(balanceScore) ? null : balanceScore,
            posture: isNaN(postureScore) ? null : postureScore,
            hipHeight: isNaN(hipHeight) ? null : hipHeight,
            baseWidth: isNaN(baseWidth) ? null : baseWidth
        };
    }
    
    private _calculateLiveKpis(poseMetrics: PoseMetrics, userState: 'IDLE' | 'MOVING', kinematics: Kinematics): AdvancedKpiType {
        const empty = this.getEmptyKpis();
        const lastFrame = this.frameHistory[this.frameHistory.length-1];
        
        const intensity = kinematics.velocity.magnitude * 25; // Scaled for 0-100 range
        const flow = Math.max(0, 100 - (_magnitude(kinematics.acceleration) / 9.8) * 20);

        return {
            ...empty,
            balanceStability: poseMetrics.balance,
            postureIntegrity: poseMetrics.posture,
            intensityEndurance: isMoving(userState) ? intensity : lastFrame?.kpis.intensityEndurance || null,
            flowRhythm: isMoving(userState) ? flow : lastFrame?.kpis.flowRhythm || null,
            explosiveness: isMoving(userState) ? (this.currentMovement?.peakAcceleration || 0) * 10 : null,
            readyStanceTime: userState === 'IDLE' && poseMetrics.balance! > 85 && poseMetrics.posture! > 85 ? 100 : 0,
            fastScrambles: this.scrambleTimestamps.length,
            moveVariety: new Set(this.movementHistory.map(m => this._getMovementSignature(m))).size,
        };
    }
    
    private getEmptyKpis = (): AdvancedKpiType => ({
        reactionTime: null, moveSuccess: null, fastScrambles: null, intensityEndurance: null,
        consistency: null, moveVariety: null, balanceStability: null, postureIntegrity: null,
        explosiveness: null, flowRhythm: null, reactionSteadiness: null, readyStanceTime: null,
        hipFlexibility: null, moveAccuracy: null,
    });
    
     private _getMovementSignature(movement: Movement): string {
        if (movement.path.length < 3) return '';
        const points = [
            movement.path[0],
            movement.path[Math.floor(movement.path.length * 0.5)],
            movement.path[movement.path.length - 1]
        ];
        return points.map(p => `${Math.round(p.x * 5)}_${Math.round(p.z * 5)}`).join(',');
    }

    public computeSessionReport(): SessionReport {
        const totalFrames = this.frameHistory.length;
        if (totalFrames < 2) throw new Error("Not enough data for a report.");

        // --- DURATION ---
        const totalTime = (this.frameHistory[totalFrames - 1].timestamp - this.frameHistory[0].timestamp) / 1000;
        const activeFrames = this.frameHistory.filter(f => f.userState === 'MOVING').length;
        const activeTime = (activeFrames / totalFrames) * totalTime;
        const readyStanceFrames = this.frameHistory.filter(f => f.userState === 'IDLE' && f.kpis.balanceStability! > 85 && f.kpis.postureIntegrity! > 85).length;
        
        const idleFrames = totalFrames - activeFrames;
        const readyStanceTimeValue = idleFrames > 0 ? (readyStanceFrames / idleFrames) * (totalTime - activeTime) : 0;

        const duration: DurationMetrics = {
            totalTime, activeTime, activeTimePercentage: (activeTime / totalTime) * 100,
            readyStanceTime: readyStanceTimeValue, 
            readyStancePercentage: (totalTime - activeTime) > 0 ? (readyStanceTimeValue / (totalTime - activeTime)) * 100 : 0
        };
        
        // --- EFFORT & ENDURANCE ---
        const intensities = this.frameHistory.map(f => f.kpis.intensityEndurance).filter(v => v !== null) as number[];
        const postures = this.frameHistory.map(f => f.kpis.postureIntegrity).filter(v => v !== null) as number[];
        const fatigueTrend = _slope(
            _avg(postures.slice(-Math.floor(totalFrames * 0.2))), _avg(postures.slice(0, Math.floor(totalFrames * 0.2))),
            totalTime * 0.9, totalTime * 0.1
        );
        const effort: EffortMetrics = {
            averageIntensity: _avg(intensities),
            peakIntensity: Math.max(...intensities, 0),
            dutyCycle: duration.activeTimePercentage,
            fatigueTrend: isNaN(fatigueTrend) ? 0 : fatigueTrend
        };

        // --- TECHNIQUE & SCRAMBLE ---
        const signatures = this.movementHistory.map(m => this._getMovementSignature(m)).filter(Boolean);
        const uniqueMoves = new Set(signatures).size;
        const totalMoves = this.movementHistory.length;
        const consistencyValue = totalMoves > 0 ? (1 - (uniqueMoves / totalMoves)) * 100 : 0;
        
        const technique: TechniqueQualityMetrics = {
            postureQuality: _avg(postures),
            baseStability: _avg(this.frameHistory.map(f => f.kpis.balanceStability).filter(v => v !== null) as number[]),
            flowSmoothness: _avg(this.frameHistory.map(f => f.kpis.flowRhythm).filter(v => v !== null) as number[]),
            consistency: consistencyValue,
        };
        
        let stabilizedScrambles = 0;
        for (const scrambleTime of this.scrambleTimestamps) {
            const recoveryWindow = this.frameHistory.filter(f => f.timestamp > scrambleTime && f.timestamp <= scrambleTime + 1500);
            if (recoveryWindow.length > 0) {
                const avgBalance = _avg(recoveryWindow.map(f => f.balance).filter(v => v !== null) as number[]);
                const avgPosture = _avg(recoveryWindow.map(f => f.posture).filter(v => v !== null) as number[]);
                if (avgBalance > 80 && avgPosture > 80) {
                    stabilizedScrambles++;
                }
            }
        }
        
        const scramble: ScrambleMetrics = {
            count: this.scrambleTimestamps.length,
            stabilizationRate: this.scrambleTimestamps.length > 0 ? (stabilizedScrambles / this.scrambleTimestamps.length) * 100 : 100,
            outcomeImpact: 0
        };
        
        // --- PATTERNS & SCORECARD ---
        const signatureCounts = signatures.reduce((acc, sig) => ({ ...acc, [sig]: (acc[sig] || 0) + 1 }), {} as Record<string, number>);
        const patterns: MovementPatternMetrics = {
            variety: uniqueMoves,
            repeatedPatterns: Object.entries(signatureCounts).filter(([_, count]) => count >= 2).sort((a,b) => b[1] - a[1]).slice(0,3).map(([signature, count]) => ({signature, count}))
        };
        const weights = { balance: 0.30, posture: 0.25, flow: 0.20, intensity: 0.15, accuracy: 0.10 };
        const score = (technique.baseStability * weights.balance) + (technique.postureQuality * weights.posture) + (technique.flowSmoothness * weights.flow) + (effort.averageIntensity * weights.intensity);
        const scorecard: Scorecard = { value: score, weights };

        // --- SCENARIO ---
        const totalPositionTime = this.positionHistory.reduce((sum, p) => sum + p.duration, 0);
        const topControlTime = this.positionHistory.filter(p => p.position === 'Top-Control').reduce((sum, p) => sum + p.duration, 0);
        const guardTime = this.positionHistory.filter(p => p.position === 'Guard').reduce((sum, p) => sum + p.duration, 0);
        const hipFlexValues = this.frameHistory.map(f => f.kpis.hipFlexibility).filter(v => v !== null) as number[];
        const scenario: ScenarioMetrics = {
            stableControlTime: totalPositionTime > 0 ? (topControlTime / totalPositionTime) * 100 : 0,
            guardActivityRate: totalPositionTime > 0 ? (guardTime / totalPositionTime) * 100 : 0,
            guardMobilityIndex: _avg(hipFlexValues)
        };

        return { duration, effort, technique, scramble, patterns, scorecard, scenario };
    }
}

const isMoving = (state: 'IDLE' | 'MOVING') => state === 'MOVING';