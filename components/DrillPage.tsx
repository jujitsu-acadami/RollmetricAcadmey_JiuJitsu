import React, { useState, useRef, useEffect, useCallback, useMemo, useContext } from 'react';
import { PoseLandmarker, DrawingUtils, FilesetResolver, Landmark } from '@mediapipe/tasks-vision';
import { Chat } from '@google/genai';
import { Session, Page, Drill, SessionState, AdvancedKpiType, SettingsContext, PoseMetrics, EngineUpdateResult } from '../types';
import KpiPanel from './KpiPanel';
import { startChatSession, getFeedbackStream } from '../services/geminiService';
import LoadingOverlay from './LoadingOverlay';
import LiveView from './LiveView';
import FeedbackPanel from './FeedbackPanel';
import { ALL_DRILLS, DRILL_CATEGORIES } from '../DrillData';
import { BjjAnalyticsEngine } from '../services/BjjAnalyticsEngine';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface DrillPageProps {
  onSessionEnd: (sessionData: Session) => void;
  onNavigate: (page: Page) => void;
  onSessionStateChange: (state: SessionState) => void;
}

type SessionTitleDisplayConfig = { type: 'title'; value: string; };
type SessionDropdownDisplayConfig = { type: 'dropdown'; label: string; items: string[]; };
type SessionDisplayConfig = SessionTitleDisplayConfig | SessionDropdownDisplayConfig;

const initialKpis: AdvancedKpiType = {
  reactionTime: null, moveSuccess: null, fastScrambles: null, intensityEndurance: null,
  consistency: null, moveVariety: null, balanceStability: null, postureIntegrity: null,
  explosiveness: null, flowRhythm: null, reactionSteadiness: null, readyStanceTime: null,
  hipFlexibility: null, moveAccuracy: null,
};

const SessionTitleDisplay = ({ displayConfig }: { displayConfig: SessionDisplayConfig | null }) => {
  if (!displayConfig) return null;
  const displayText = displayConfig.type === 'title' ? displayConfig.value : displayConfig.label;
  return <h2 className="text-dd-text text-4xl lg:text-5xl font-bold tracking-tighter truncate">{displayText}</h2>;
};

const ImmersivePanelToggleButton = ({ isOpen, onClick, disabled }: { isOpen: boolean, onClick: () => void, disabled?: boolean }) => (
  <button 
      onClick={onClick} 
      disabled={disabled}
      className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 bg-dd-surfaceAlt hover:bg-opacity-80 text-dd-muted hover:text-white rounded-full p-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 z-30 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={isOpen ? 'Collapse panel' : 'Expand panel'}
    >
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  </button>
);


const NoDrillsSelected = ({ onNavigate, isDashboard = false }: { onNavigate: (page: Page) => void, isDashboard?: boolean }) => {
  const buttonClasses = "bg-dd-accent text-dd-bg py-2 px-5 rounded-lg font-semibold text-base hover:opacity-90 transition-opacity";
  if (isDashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h3 className="text-xl font-bold text-white mb-2">No Drills Selected</h3>
        <p className="text-dd-muted mb-6">Please select a drill in your Account Settings to begin.</p>
        <button onClick={() => onNavigate('account')} className={buttonClasses}>
          Go to Settings
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black/70 backdrop-blur-sm p-4 text-center">
      <h2 className="text-2xl font-bold text-white mb-2">No Drills Selected</h2>
      <p className="text-dd-muted max-w-sm mb-6">To start your training session, please go to your account and select at least one drill in your Focus Area.</p>
      <button onClick={() => onNavigate('account')} className={`${buttonClasses} py-3 px-6 text-lg shadow-lg`}>
        Go to Settings
      </button>
    </div>
  );
};


export default function DrillPage({ onSessionEnd, onNavigate, onSessionStateChange }: DrillPageProps) {
  const settingsContext = useContext(SettingsContext);
  if (!settingsContext) throw new Error("DrillPage must be used within a SettingsProvider");
  const { settings, onSettingsChange } = settingsContext;

  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [feedback, setFeedback] = useState('Start the session to get feedback.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [kpis, setKpis] = useState<AdvancedKpiType>(initialKpis);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [currentDrill, setCurrentDrill] = useState<Drill | 'all'>(settings.focusArea[0] || 'side-control');
  
  const [feedbackLog, setFeedbackLog] = useState<Set<string>>(new Set());
  const [isImmersiveKpiPanelVisible, setIsImmersiveKpiPanelVisible] = useState(false);
  const [isMobileKpiPanelOpen, setIsMobileKpiPanelOpen] = useState(false);
  const [fps, setFps] = useState<number>(0);
  const [lastSpokenTimestamp, setLastSpokenTimestamp] = useState<number>(0);
  const [lastKnownPosition, setLastKnownPosition] = useState<string>('Neutral');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const analyticsEngine = useRef<BjjAnalyticsEngine | null>(null);
  const frameCount = useRef(0);
  const lastFpsUpdate = useRef(performance.now());
  const poseMetricsHistory = useRef<PoseMetrics[]>([]);
  
  const idleFrameCounter = useRef(0);
  const chatSession = useRef<Chat | null>(null);
  const feedbackLogRef = useRef(feedbackLog);

  const { speak, cancel } = useSpeechSynthesis(settings.voiceCues);

  useEffect(() => {
    feedbackLogRef.current = feedbackLog;
  }, [feedbackLog]);
  
  const isSessionActive = sessionState === 'running';

  useEffect(() => {
    analyticsEngine.current = new BjjAnalyticsEngine({});
  }, []);

  useEffect(() => {
    onSessionStateChange(sessionState);
    if (sessionState === 'idle') {
      setIsImmersiveKpiPanelVisible(false);
    }
  }, [sessionState, onSessionStateChange]);

  const availableDrills = useMemo(() => {
    const focusArea = settings.focusArea || [];
    if (focusArea.length === 0) return [];
    return ALL_DRILLS.filter(drill => focusArea.includes(drill.id));
  }, [settings.focusArea]);

  const sessionDisplay = useMemo<SessionDisplayConfig | null>(() => {
    const { focusArea } = settings;
    if (focusArea.length === 0) return { type: 'title', value: 'NO DRILL SELECTED' };
    if (focusArea.length === 1) {
      const drillName = ALL_DRILLS.find(d => d.id === focusArea[0])?.name.toUpperCase() || 'DRILL';
      return { type: 'title', value: drillName };
    }
    if (focusArea.length === ALL_DRILLS.length) return { type: 'title', value: 'ALL POSITIONS' };

    const focusAreaSet = new Set(focusArea);
    const fullySelectedCategories = DRILL_CATEGORIES.filter(category => 
        ALL_DRILLS.filter(d => d.category === category).every(d => focusAreaSet.has(d.id))
    );

    if (fullySelectedCategories.length === 1) return { type: 'title', value: fullySelectedCategories[0].toUpperCase() };
    if (fullySelectedCategories.length > 1) return { type: 'dropdown', label: `${fullySelectedCategories.length} CATEGORIES`, items: fullySelectedCategories };

    return { type: 'dropdown', label: `${focusArea.length} CUSTOM DRILLS`, items: ALL_DRILLS.filter(drill => focusAreaSet.has(drill.id)).map(drill => drill.name) };
  }, [settings.focusArea]);

  useEffect(() => {
    const isCurrentDrillAvailable = currentDrill === 'all' || availableDrills.some(d => d.id === currentDrill);
    if (availableDrills.length > 0 && !isCurrentDrillAvailable) {
        setCurrentDrill(availableDrills[0].id);
    } else if (availableDrills.length === 0) {
        setFeedback("No drills selected. Go to Account > Settings to choose your focus area.");
    }
  }, [availableDrills, currentDrill]);

  const triggerHapticFeedback = (pattern: VibratePattern) => {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(pattern); } catch (e) { console.warn("Haptic feedback failed:", e); }
    }
  };

  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch (err: any) {
        console.error("Error enumerating devices:", err);
        const permissionErrors = ['NotAllowedError', 'PermissionDeniedError'];
        setError(permissionErrors.includes(err.name)
            ? "Camera access is required. Please allow camera permissions and refresh."
            : "Could not access camera. Please ensure it is not in use and refresh."
        );
      }
    };
    getDevices();
  }, [selectedDeviceId]);

  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
        const modelName = `pose_landmarker_${settings.modelComplexity}`;
        const modelPath = `https://storage.googleapis.com/mediapipe-models/pose_landmarker/${modelName}/float16/1/${modelName}.task`;
        const landmarkerOptions: any = {
          baseOptions: { modelAssetPath: modelPath, delegate: 'GPU' },
          runningMode: 'VIDEO', outputWorldLandmarks: true, numPoses: 1, 
          minPoseDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
        };
        const landmarker = await PoseLandmarker.createFromOptions(vision, landmarkerOptions);
        setPoseLandmarker(landmarker);
      } catch (e) {
        console.error("Initialization Error:", e);
        setError("Failed to load AI model. Your device might not be supported, or try refreshing.");
      } finally {
        setIsLoading(false);
      }
    };
    if (poseLandmarker) {
        poseLandmarker.close();
        setPoseLandmarker(null);
    }
    initializeMediaPipe();
    return () => {
      poseLandmarker?.close();
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [settings.modelComplexity]);

  const handleFeedbackRequest = useCallback(async () => {
      if (isAnalyzing || !chatSession.current) return;
      
      setIsAnalyzing(true);

      try {
          let fullResponse = '';
          setFeedback(''); // Clear previous feedback immediately for streaming effect

          for await (const chunk of getFeedbackStream(
              chatSession.current,
              poseMetricsHistory.current,
              feedbackLogRef.current,
              currentDrill,
              settings.voiceCues.type,
              kpis
          )) {
              fullResponse += chunk;
              setFeedback(fullResponse);
          }
          
          if (fullResponse && !feedbackLogRef.current.has(fullResponse)) {
              setFeedbackLog(prev => new Set(prev).add(fullResponse));
              
              const isPlaceholder = ["Analyzing pose...", "Keep moving to get feedback."].includes(fullResponse);
              if (!isPlaceholder) {
                  speak(fullResponse);
              }

              const isPositive = ['excellent', 'awesome', 'solid', 'great'].some(w => fullResponse.toLowerCase().includes(w));
              if (!isPositive) triggerHapticFeedback([50, 30, 50]);
          }
      } catch (error) {
          console.error("Feedback stream error:", error);
          setFeedback("Error getting feedback.");
      } finally {
          setIsAnalyzing(false);
      }
  }, [isAnalyzing, currentDrill, speak, settings.voiceCues.type, kpis]);

  const predict = useCallback(() => {
    const now = performance.now();
    frameCount.current++;
    if (now - lastFpsUpdate.current > 1000) {
      setFps(frameCount.current * 1000 / (now - lastFpsUpdate.current));
      frameCount.current = 0;
      lastFpsUpdate.current = now;
    }

    if (!videoRef.current || videoRef.current.readyState < 2 || !canvasRef.current || !poseLandmarker || !sessionStartTime) return;
    const { videoWidth, videoHeight } = videoRef.current;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    try {
      const results = poseLandmarker.detectForVideo(videoRef.current, performance.now());
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (results.landmarks?.[0]) {
        if (settings.showSkeleton) {
            const drawingUtils = new DrawingUtils(canvasCtx);
            const { skeletonColor, skeletonThickness } = settings;
            drawingUtils.drawConnectors(results.landmarks[0], PoseLandmarker.POSE_CONNECTIONS, { color: skeletonColor, lineWidth: skeletonThickness });
            drawingUtils.drawLandmarks(results.landmarks[0], { color: skeletonColor, radius: skeletonThickness / 2 });
        }
        
        if (analyticsEngine.current) {
          const engineResults: EngineUpdateResult = analyticsEngine.current.update(results.worldLandmarks?.[0], performance.now(), sessionStartTime.getTime());
          setKpis(engineResults.kpis);
          
          if (engineResults.poseMetrics.balance !== null) {
            poseMetricsHistory.current = [engineResults.poseMetrics, ...poseMetricsHistory.current].slice(0, 5);
          }
        
          // Voice Cue Trigger Logic
          const { frequency, enabled } = settings.voiceCues;
          let shouldTriggerFeedback = false;

          if (enabled && isSessionActive) {
              switch (frequency) {
                  case 'Smart Mode (context-aware, AI-driven)':
                      if (engineResults.userState === 'IDLE') {
                          idleFrameCounter.current++;
                      } else {
                          idleFrameCounter.current = 0;
                      }
                      const IDLE_TRIGGER_FRAMES = 45; // Approx 1.5 seconds at 30fps
                      if (idleFrameCounter.current > IDLE_TRIGGER_FRAMES) {
                          shouldTriggerFeedback = true;
                          idleFrameCounter.current = 0; // Reset to prevent immediate re-trigger
                      }
                      break;
                  
                  case 'Every 30 Seconds':
                      if (now - lastSpokenTimestamp > 30000) {
                          shouldTriggerFeedback = true;
                      }
                      break;
                  
                  case 'Only on Position Change':
                      // Only trigger on meaningful, non-neutral positions
                      if (engineResults.identifiedPosition !== 'Neutral' && engineResults.identifiedPosition !== lastKnownPosition) {
                          shouldTriggerFeedback = true;
                          setLastKnownPosition(engineResults.identifiedPosition);
                      }
                      break;

                  case 'End of Round Only':
                      // This frequency means no real-time feedback.
                      break;
              }
          }

          if (shouldTriggerFeedback) {
              handleFeedbackRequest();
              setLastSpokenTimestamp(now);
          }
        }
      } else {
         setKpis(initialKpis);
         setFeedback("No pose detected.");
      }
    } catch (e) {
      console.error("MediaPipe Error:", e);
      setError("An error occurred during pose detection.");
      setSessionState('paused');
    }
  }, [poseLandmarker, settings, sessionStartTime, handleFeedbackRequest, lastSpokenTimestamp, lastKnownPosition, isSessionActive]);

  useEffect(() => {
    let loopId: number;
    const loop = () => {
      predict();
      loopId = requestAnimationFrame(loop);
    };
    if (sessionState === 'running') loopId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(loopId); };
  }, [sessionState, predict]);

  useEffect(() => {
    if (!poseLandmarker || !videoRef.current || !selectedDeviceId) return;
    const video = videoRef.current;
    let stream: MediaStream | null = null;
    const startWebcam = async () => {
      if (video.srcObject) (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      try {
        const constraints: MediaStreamConstraints = { video: { width: 1280, height: 720, deviceId: { exact: selectedDeviceId } } };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
        setError(null);
      } catch (err: any) {
        console.error("Camera Access Error:", err);
        const permissionErrors = ['NotAllowedError', 'PermissionDeniedError'];
        setError(permissionErrors.includes(err.name)
            ? "Camera access is required. Please allow camera permissions and refresh."
            : "Could not access camera. Please ensure it is not in use and refresh."
        );
      }
    };
    startWebcam();
    return () => { stream?.getTracks().forEach(track => track.stop()); };
  }, [poseLandmarker, selectedDeviceId]);

  const handleToggleSession = () => {
    if (availableDrills.length === 0) return;
    triggerHapticFeedback(50);
    if (sessionState === 'running') {
      cancel(); // Stop any active speech
      setSessionState('paused');
      setKpis(initialKpis);
      setFeedback("Session paused.");
      poseMetricsHistory.current = [];
    } else {
      // Re-initialize chat session on every resume/start to pick up latest settings
      chatSession.current = startChatSession(currentDrill, settings.focusArea, settings.voiceCues.type);

      if (sessionState === 'idle') {
        setSessionStartTime(new Date());
        analyticsEngine.current?.reset();
        poseMetricsHistory.current = [];
        idleFrameCounter.current = 0;
        setLastSpokenTimestamp(performance.now());
        setLastKnownPosition('Neutral');
      }
      setSessionState('running');
      setFeedback("AI coach is warming up...");
    }
  };

  const handleEndSession = () => {
    cancel(); // Stop any active speech
    triggerHapticFeedback(100);
    if (sessionStartTime && analyticsEngine.current) {
        const finalReport = analyticsEngine.current.computeSessionReport();
        onSessionEnd({
            startTime: sessionStartTime,
            duration: (new Date().getTime() - sessionStartTime.getTime()) / 1000,
            drill: currentDrill,
            focusArea: settings.focusArea,
            report: finalReport,
            feedbackLog: Array.from(feedbackLog),
        });
    }
    analyticsEngine.current?.reset();
    setSessionState('idle');
    setSessionStartTime(null);
    setKpis(initialKpis);
    setFeedback('Start the session to get feedback.');
    setFeedbackLog(new Set());
    poseMetricsHistory.current = [];
    idleFrameCounter.current = 0;
    chatSession.current = null; // End chat session
    if (canvasRef.current) canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };
  
  const isUserFacing = useMemo(() => {
    if (!selectedDeviceId || videoDevices.length === 0) return true;
    const selectedDevice = videoDevices.find(d => d.deviceId === selectedDeviceId);
    if (!selectedDevice?.label) return true;
    const label = selectedDevice.label.toLowerCase();
    return !label.includes('back') && !label.includes('rear') && !label.includes('environment');
  }, [selectedDeviceId, videoDevices]);

  const sessionButtonText = sessionState === 'running' ? 'Pause' : sessionState === 'paused' ? 'Resume' : 'Start';

  const commonSelectClasses = "w-full bg-dd-surfaceAlt text-dd-text py-3 pl-4 pr-10 rounded-lg font-semibold text-base hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-dd-accent transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed truncate";
  const commonButtonClasses = "bg-dd-surfaceAlt text-dd-text py-3 px-4 rounded-lg font-semibold text-base hover:bg-opacity-80 flex items-center justify-center gap-2";

  const DesktopConfigureButton = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className={`${commonButtonClasses} w-full`} title="Configure Settings">
      <span className="material-symbols-outlined text-dd-muted">settings</span>
      <span className="truncate">Configure</span>
    </button>
  );
  
  const LayoutToggleButton = () => {
    const handleLayoutChange = () => {
        const newLayout = settings.drillLayout === 'immersive' ? 'dashboard' : 'immersive';
        onSettingsChange({ ...settings, drillLayout: newLayout });
    };

    return (
        <button 
            onClick={handleLayoutChange} 
            className={`${commonButtonClasses} w-full`}
            title={`Switch to ${settings.drillLayout === 'immersive' ? 'Dashboard' : 'Immersive'} View`}
        >
            <span className="material-symbols-outlined text-dd-muted">
                {settings.drillLayout === 'immersive' ? 'dashboard' : 'fullscreen'}
            </span>
            <span className="truncate">
                {settings.drillLayout === 'immersive' ? 'Dashboard' : 'Immersive'}
            </span>
        </button>
    );
  };

  const ImmersiveControlGroup = () => (
    <div className="flex items-center gap-4">
      <div className="relative flex-1">
        <select value={currentDrill} onChange={(e) => setCurrentDrill(e.target.value as Drill | 'all')} className={commonSelectClasses} disabled={sessionState !== 'idle' || availableDrills.length === 0}>
          {availableDrills.length > 1 && <option value="all">ALL (Flow)</option>}
          {availableDrills.map((drill) => (<option key={drill.id} value={drill.id}>{drill.name}</option>))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none"><span className="material-symbols-outlined text-dd-muted">unfold_more</span></div>
      </div>
      <div className="relative flex-1">
        <select value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)} className={commonSelectClasses} disabled={sessionState !== 'idle' || videoDevices.length <= 1}>
          {videoDevices.map((device, index) => (<option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none"><span className="material-symbols-outlined text-dd-muted">unfold_more</span></div>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-4">
        <DesktopConfigureButton onClick={() => onNavigate('account')} />
        <LayoutToggleButton />
      </div>
    </div>
  );
  
  const DashboardControlGroup = () => (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-dd-muted font-semibold mb-2 px-1 text-base block">Drill</label>
        <div className="relative">
          <select value={currentDrill} onChange={(e) => setCurrentDrill(e.target.value as Drill | 'all')} className={commonSelectClasses} disabled={sessionState !== 'idle' || availableDrills.length === 0}>
            {availableDrills.length > 1 && <option value="all">ALL (Flow)</option>}
            {availableDrills.map((drill) => (<option key={drill.id} value={drill.id}>{drill.name}</option>))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none"><span className="material-symbols-outlined text-dd-muted">unfold_more</span></div>
        </div>
      </div>
      <div>
        <label className="text-dd-muted font-semibold mb-2 px-1 text-base block">Camera</label>
        <div className="relative">
          <select value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)} className={commonSelectClasses} disabled={sessionState !== 'idle' || videoDevices.length <= 1}>
            {videoDevices.map((device, index) => (<option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none"><span className="material-symbols-outlined text-dd-muted">unfold_more</span></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DesktopConfigureButton onClick={() => onNavigate('account')} />
        <LayoutToggleButton />
      </div>
    </div>
  );

  const MobileKpiSummary = () => (
    <div className="flex items-center justify-around w-full text-xs text-center">
        <div className="flex flex-col"><span className="text-dd-muted">POS</span><span className="font-bold text-white">{kpis.postureIntegrity?.toFixed(0) || '--'}</span></div>
        <div className="flex flex-col"><span className="text-dd-muted">BAL</span><span className="font-bold text-white">{kpis.balanceStability?.toFixed(0) || '--'}</span></div>
        <div className="flex flex-col"><span className="text-dd-muted">POW</span><span className="font-bold text-white">{kpis.explosiveness?.toFixed(0) || '--'}</span></div>
        <div className="flex flex-col"><span className="text-dd-muted">FLO</span><span className="font-bold text-white">{kpis.flowRhythm?.toFixed(0) || '--'}</span></div>
        <div className="flex flex-col"><span className="text-dd-muted">INT</span><span className="font-bold text-white">{kpis.intensityEndurance?.toFixed(0) || '--'}</span></div>
    </div>
  );

  return (
    <div className={`w-full flex-grow bg-dd-bg flex flex-col ${settings.drillLayout === 'dashboard' ? 'lg:flex-row lg:gap-8 lg:p-8' : 'lg:absolute lg:inset-0'}`}>
      
      <div className="relative w-full flex-1 overflow-hidden lg:rounded-2xl bg-black">
        <LoadingOverlay isLoading={isLoading} error={error} onGoBack={() => onNavigate('home')} />
        <LiveView videoRef={videoRef} canvasRef={canvasRef} isUserFacing={isUserFacing} />
        {sessionState !== 'idle' && (<div className="absolute top-2 left-2 bg-black/50 text-white text-lg font-bold p-2 rounded-lg pointer-events-none">FPS: {fps.toFixed(1)}</div>)}
        {availableDrills.length === 0 && !isLoading && !error && <NoDrillsSelected onNavigate={onNavigate} />}

        {!isLoading && !error && settings.drillLayout === 'immersive' && (
          <div className="hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 w-auto z-20">
            <div className="relative">
              <div className={`flex-shrink-0 bg-dd-surface/80 backdrop-blur-md shadow-2xl p-6 flex flex-col gap-4 w-[720px] transition-all duration-300 ${isImmersiveKpiPanelVisible ? 'rounded-l-2xl' : 'rounded-2xl'}`}>
                  <div className="flex items-center justify-between gap-6">
                      <div>
                          <p className="text-dd-muted text-base">You're in</p>
                          <div className="mt-1"><SessionTitleDisplay displayConfig={sessionDisplay} /></div>
                      </div>
                      <div className="flex flex-col gap-4">
                          <button onClick={handleToggleSession} className="bg-dd-accent text-dd-bg py-4 px-8 text-xl rounded-lg font-bold hover:opacity-90 transition-opacity w-40 disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={availableDrills.length === 0}>{sessionButtonText}</button>
                          <button onClick={handleEndSession} className="bg-transparent text-dd-muted hover:bg-red-600/20 hover:text-red-400 py-4 px-8 text-xl rounded-lg font-bold transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-dd-muted" disabled={sessionState === 'idle'}>End Session</button>
                      </div>
                  </div>
                  <FeedbackPanel feedback={feedback} isAnalyzing={isAnalyzing} isSessionActive={isSessionActive} />
                  <ImmersiveControlGroup />
              </div>
              <ImmersivePanelToggleButton isOpen={isImmersiveKpiPanelVisible} onClick={() => setIsImmersiveKpiPanelVisible(!isImmersiveKpiPanelVisible)} disabled={sessionState === 'idle'}/>
              {sessionState !== 'idle' && (
                <div className={`absolute top-0 left-full h-full bg-dd-surface/80 backdrop-blur-md rounded-r-2xl shadow-2xl border-l border-dd-border/50 p-4 transition-all duration-300 overflow-y-auto ${isImmersiveKpiPanelVisible ? 'w-80' : 'w-0 opacity-0'}`}>
                  <KpiPanel kpis={kpis} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!isLoading && !error && settings.drillLayout === 'dashboard' && (
        <div className="hidden lg:flex lg:w-full lg:max-w-sm flex-shrink-0 flex-col gap-6 bg-dd-surface p-6 rounded-2xl">
          {availableDrills.length > 0 ? (
            <>
              <div>
                <p className="text-dd-muted text-base">You're in</p>
                <div className="mt-1"><SessionTitleDisplay displayConfig={sessionDisplay} /></div>
              </div>
              <FeedbackPanel feedback={feedback} isAnalyzing={isAnalyzing} isSessionActive={isSessionActive} />
              <div className="flex-grow min-h-0 overflow-y-auto"><KpiPanel kpis={kpis} /></div>
              <DashboardControlGroup />
              <div className="grid grid-cols-2 gap-4 mt-auto">
                <button onClick={handleToggleSession} className="bg-dd-accent text-dd-bg py-4 text-xl rounded-lg font-bold hover:opacity-90 transition-opacity disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={availableDrills.length === 0}>{sessionButtonText}</button>
                <button onClick={handleEndSession} className="bg-transparent text-dd-muted hover:bg-red-600/20 hover:text-red-400 py-4 text-xl rounded-lg font-bold transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-dd-muted" disabled={sessionState === 'idle'}>End Session</button>
              </div>
            </>
          ) : ( <NoDrillsSelected onNavigate={onNavigate} isDashboard={true} /> )}
        </div>
      )}

      {!isLoading && !error && (
        <div className="lg:hidden absolute inset-0 z-20 p-4 flex flex-col justify-between pointer-events-none">
          <div className="absolute bottom-64 left-4 right-4 flex justify-center">
            <p className="bg-black/60 backdrop-blur-sm text-dd-accent font-medium text-center text-lg rounded-full px-6 py-3 shadow-lg">
              {sessionState === 'running' ? (isAnalyzing ? 'Analyzing...' : feedback) : (availableDrills.length > 0 ? 'Session Paused' : 'Select a drill in Settings')}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 w-full px-4 pb-6 pt-10 bg-gradient-to-t from-black/60 to-transparent pointer-events-auto">
              <div className="flex flex-col gap-4">
                {sessionState !== 'idle' && (
                  <div className="w-full">
                    <button onClick={() => setIsMobileKpiPanelOpen(!isMobileKpiPanelOpen)} className="w-full bg-dd-surfaceAlt/80 backdrop-blur-sm text-dd-text py-2 px-3 rounded-lg font-semibold text-base transition-all flex items-center">
                      <MobileKpiSummary />
                      <span className={`material-symbols-outlined text-dd-muted ml-auto transition-transform duration-300 ${isMobileKpiPanelOpen ? 'rotate-180' : ''}`}>expand_less</span>
                    </button>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMobileKpiPanelOpen ? 'max-h-[50vh] mt-2' : 'max-h-0'}`}>
                      <div className="bg-dd-surfaceAlt/80 backdrop-blur-sm rounded-lg p-2 max-h-[50vh] overflow-y-auto"><KpiPanel kpis={kpis} /></div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4">
                   <div className="relative flex-1">
                       <select value={currentDrill} onChange={(e) => setCurrentDrill(e.target.value as Drill | 'all')} className={`${commonSelectClasses} bg-dd-surfaceAlt/80 backdrop-blur-sm`} disabled={sessionState !== 'idle' || availableDrills.length === 0}>
                           {availableDrills.length > 1 && <option value="all">ALL (Flow)</option>}
                           {availableDrills.map((drill) => (<option key={drill.id} value={drill.id} className="bg-dd-surface font-semibold">{drill.name}</option>))}
                           {availableDrills.length === 0 && <option>Go to Settings</option>}
                       </select>
                       <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none"><span className="material-symbols-outlined text-dd-muted">unfold_more</span></div>
                   </div>
                   <div className="relative flex-1">
                       <select value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)} className={`${commonSelectClasses} bg-dd-surfaceAlt/80 backdrop-blur-sm`} disabled={sessionState !== 'idle' || videoDevices.length <= 1}>
                           {videoDevices.map((device, index) => (<option key={device.deviceId} value={device.deviceId} className="bg-dd-surface font-semibold">{device.label || `Camera ${index + 1}`}</option>))}
                       </select>
                       <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none"><span className="material-symbols-outlined text-dd-muted">unfold_more</span></div>
                   </div>
                   <button onClick={() => onNavigate('account')} className="flex-shrink-0 bg-dd-surfaceAlt/80 backdrop-blur-sm text-dd-text p-3.5 rounded-lg hover:bg-opacity-80 transition-colors active:scale-95" title="Configure Settings">
                      <span className="material-symbols-outlined">settings</span>
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleToggleSession} disabled={availableDrills.length === 0} className="bg-dd-accent text-dd-bg py-4 rounded-lg font-bold text-xl hover:opacity-90 transition-opacity shadow-lg transform active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed">{sessionButtonText}</button>
                    <button onClick={handleEndSession} disabled={sessionState === 'idle'} className="bg-red-600 text-white py-4 rounded-lg font-bold text-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 transform active:scale-95 disabled:bg-dd-surfaceAlt disabled:opacity-50 disabled:shadow-none disabled:hover:bg-dd-surfaceAlt">End Session</button>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}