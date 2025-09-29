import React, { useState, useRef, useEffect, useCallback, useMemo, useContext } from 'react';
import { PoseLandmarker, DrawingUtils, FilesetResolver, Landmark } from '@mediapipe/tasks-vision';
import { Session, Page, Drill, SessionState, KpiType, SettingsContext } from '../types';
import KpiPanel from './KpiPanel';
import { getPoseFeedback } from '../services/geminiService';
import LoadingOverlay from './LoadingOverlay';
import LiveView from './LiveView';
import FeedbackPanel from './FeedbackPanel';
import { ALL_DRILLS, DRILL_CATEGORIES } from '../DrillData';

interface DrillPageProps {
  onSessionEnd: (sessionData: Session) => void;
  onNavigate: (page: Page) => void;
  onSessionStateChange: (state: SessionState) => void;
}

type SessionTitleDisplayConfig = { type: 'title'; value: string; };
type SessionDropdownDisplayConfig = { type: 'dropdown'; label: string; items: string[]; };
type SessionDisplayConfig = SessionTitleDisplayConfig | SessionDropdownDisplayConfig;


const LayoutToggleButton = ({ layout, onClick }: { layout: string, onClick: () => void }) => (
    <button onClick={onClick} className="flex-1 bg-[#2d2d2d] text-gray-300 hover:text-[#F0F6FC] py-3 px-4 rounded-lg font-semibold text-base hover:bg-[#3f3f3f] transition-colors flex items-center justify-center gap-2" title={`Switch to ${layout === 'immersive' ? 'Dashboard' : 'Immersive'} View`}>
       {layout === 'immersive' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
       ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 0h-4v4m-4 4h4v4h-4v-4zm0 0V8m0 8v-4m-4 4H8v-4h4v4z" />
        </svg>
       )}
        <span className="truncate">{layout === 'immersive' ? 'Dashboard' : 'Immersive'}</span>
    </button>
);

const SessionTitleDisplay = ({ displayConfig }: { displayConfig: SessionDisplayConfig | null }) => {
  if (!displayConfig) return null;
  const displayText = displayConfig.type === 'title' ? displayConfig.value : displayConfig.label;
  return <h2 className="text-[#F0F6FC] text-4xl lg:text-5xl font-bold tracking-tighter truncate">{displayText}</h2>;
};

const ImmersivePanelToggleButton = ({ isOpen, onClick, disabled }: { isOpen: boolean, onClick: () => void, disabled?: boolean }) => (
  <button 
      onClick={onClick} 
      disabled={disabled}
      className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 bg-[#2d2d2d] hover:bg-[#3f3f3f] text-gray-300 hover:text-white rounded-full p-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 z-30 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={isOpen ? 'Collapse panel' : 'Expand panel'}
    >
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  </button>
);


// Helper function to calculate the angle between three 2D points
const calculateAngle = (a: Landmark, b: Landmark, c: Landmark) => {
  const angle = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = angle * (180 / Math.PI);
  degrees = Math.abs(degrees);
  if (degrees > 180) {
    degrees = 360 - degrees;
  }
  return degrees;
};

const NoDrillsSelected = ({ onNavigate, isDashboard = false }: { onNavigate: (page: Page) => void, isDashboard?: boolean }) => {
  if (isDashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h3 className="text-xl font-bold text-white mb-2">No Drills Selected</h3>
        <p className="text-gray-300 mb-6">Please select a drill in your Account Settings to begin.</p>
        <button
          onClick={() => onNavigate('account')}
          className="bg-[#58A6FF] text-black py-2 px-5 rounded-lg font-semibold text-base hover:bg-blue-500 transition-colors"
        >
          Go to Settings
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black/70 backdrop-blur-sm p-4 text-center">
      <h2 className="text-2xl font-bold text-white mb-2">No Drills Selected</h2>
      <p className="text-gray-300 max-w-sm mb-6">To start your training session, please go to your account and select at least one drill in your Focus Area.</p>
      <button
        onClick={() => onNavigate('account')}
        className="bg-[#58A6FF] text-black py-3 px-6 rounded-lg font-bold text-lg hover:bg-blue-500 transition-colors shadow-lg"
      >
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
  const [kpis, setKpis] = useState<KpiType>({ postureHeight: null, baseWidth: null, hipHeight: null, spineAngle: null, kneeToElbow: null });
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [currentDrill, setCurrentDrill] = useState<Drill | 'all'>(settings.focusArea[0] || 'side-control');
  
  const [kpiHistory, setKpiHistory] = useState<KpiType[]>([]);
  const [feedbackLog, setFeedbackLog] = useState<Set<string>>(new Set());
  const [isImmersiveKpiPanelVisible, setIsImmersiveKpiPanelVisible] = useState(false);
  const [isMobileKpiPanelOpen, setIsMobileKpiPanelOpen] = useState(false);


  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastAnalysisTime = useRef<number>(0);
  
  const isSessionActive = sessionState === 'running';

  // Report session state changes to the parent component.
  useEffect(() => {
    onSessionStateChange(sessionState);
    if (sessionState === 'idle') {
      setIsImmersiveKpiPanelVisible(false); // Close panel when session ends
    }
  }, [sessionState, onSessionStateChange]);

  const availableDrills = useMemo(() => {
    const focusArea = settings.focusArea || [];
    if (focusArea.length === 0) return [];
    return ALL_DRILLS.filter(drill => focusArea.includes(drill.id));
  }, [settings.focusArea]);

  const sessionDisplay = useMemo<SessionDisplayConfig | null>(() => {
    const { focusArea } = settings;
    if (focusArea.length === 0) {
      return { type: 'title', value: 'NO DRILL SELECTED' };
    }
    if (focusArea.length === 1) {
      const drillName = ALL_DRILLS.find(d => d.id === focusArea[0])?.name.toUpperCase() || 'DRILL';
      return { type: 'title', value: drillName };
    }
    if (focusArea.length === ALL_DRILLS.length) {
      return { type: 'title', value: 'ALL POSITIONS' };
    }

    const fullySelectedCategories: string[] = [];
    const partiallySelectedCategories: string[] = [];
    const focusAreaSet = new Set(focusArea);

    for (const category of DRILL_CATEGORIES) {
      const categoryDrills = ALL_DRILLS.filter(d => d.category === category);
      const categoryDrillIds = categoryDrills.map(d => d.id);
      const selectedInCategoryCount = categoryDrillIds.filter(id => focusAreaSet.has(id)).length;

      if (selectedInCategoryCount === categoryDrills.length && selectedInCategoryCount > 0) {
        fullySelectedCategories.push(category);
      } else if (selectedInCategoryCount > 0) {
        partiallySelectedCategories.push(category);
      }
    }

    if (fullySelectedCategories.length === 1 && partiallySelectedCategories.length === 0) {
      return { type: 'title', value: fullySelectedCategories[0].toUpperCase() };
    }
    if (fullySelectedCategories.length > 1 && partiallySelectedCategories.length === 0) {
      return {
        type: 'dropdown',
        label: `${fullySelectedCategories.length} CATEGORIES`,
        items: fullySelectedCategories,
      };
    }

    // All other cases are a custom mix of drills.
    return {
      type: 'dropdown',
      label: `${focusArea.length} CUSTOM DRILLS`,
      items: ALL_DRILLS.filter(drill => focusAreaSet.has(drill.id)).map(drill => drill.name),
    };
  }, [settings.focusArea]);


  useEffect(() => {
    const isCurrentDrillAvailable = currentDrill === 'all' || availableDrills.some(d => d.id === currentDrill);
    if (availableDrills.length > 0 && !isCurrentDrillAvailable) {
        setCurrentDrill(availableDrills[0].id);
    } else if (availableDrills.length === 0) {
        setFeedback("No drills selected. Go to Account > Settings to choose your focus area.");
    }
  }, [availableDrills, currentDrill]);


  const handleToggleLayout = () => {
    const newLayout = settings.drillLayout === 'immersive' ? 'dashboard' : 'immersive';
    onSettingsChange({ ...settings, drillLayout: newLayout });
    setIsImmersiveKpiPanelVisible(false); // Reset panel state on layout change
  };

  const triggerHapticFeedback = (pattern: VibratePattern) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn("Haptic feedback failed:", e);
      }
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
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError("Camera access is required for the drill. Please allow camera permissions in your browser settings and refresh the page.");
        } else {
            setError("Could not access camera. Please ensure it is not in use and refresh.");
        }
      }
    };
    getDevices();
  }, []);

  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
        const modelName = `pose_landmarker_${settings.modelComplexity}`;
        const modelPath = `https://storage.googleapis.com/mediapipe-models/pose_landmarker/${modelName}/float16/1/${modelName}.task`;
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: modelPath, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1, minPoseDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
        });
        setPoseLandmarker(landmarker);
      } catch (e) {
        console.error("Initialization Error:", e);
        setError("Failed to load AI model. Your device might not be supported, or you can try refreshing.");
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

  const predict = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !poseLandmarker) return;
    const video = videoRef.current;
    if (video.readyState < 2) return;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const startTimeMs = performance.now();
    try {
      const results = poseLandmarker.detectForVideo(video, startTimeMs);
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        if (settings.showSkeleton) {
            const drawingUtils = new DrawingUtils(canvasCtx);
            const { skeletonColor, skeletonThickness } = settings;
            const lineWidth = skeletonThickness;
            const landmarkRadius = skeletonThickness / 2;
            drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: skeletonColor, lineWidth });
            drawingUtils.drawLandmarks(landmarks, { color: skeletonColor, radius: landmarkRadius });
        }
        const requiredLandmarks = [11, 12, 13, 14, 23, 24, 25, 26].every(i => landmarks[i] && landmarks[i].visibility && landmarks[i].visibility > 0.5);
        let newKpis: KpiType = { postureHeight: null, baseWidth: null, hipHeight: null, spineAngle: null, kneeToElbow: null };
        if (requiredLandmarks) {
          const midShoulder = { x: (landmarks[11].x + landmarks[12].x) / 2, y: (landmarks[11].y + landmarks[12].y) / 2 };
          const midHip = { x: (landmarks[23].x + landmarks[24].x) / 2, y: (landmarks[23].y + landmarks[24].y) / 2 };
          const midKnee = { x: (landmarks[25].x + landmarks[26].x) / 2, y: (landmarks[25].y + landmarks[26].y) / 2 };
          const leftKneeToElbow = Math.hypot(landmarks[13].x - landmarks[25].x, landmarks[13].y - landmarks[25].y) * 100;
          const rightKneeToElbow = Math.hypot(landmarks[14].x - landmarks[26].x, landmarks[14].y - landmarks[26].y) * 100;

          newKpis = {
            postureHeight: Math.abs(midShoulder.y - midHip.y) * 100,
            baseWidth: Math.abs(landmarks[25].x - landmarks[26].x) * 100,
            hipHeight: midHip.y * 100,
            spineAngle: calculateAngle(midShoulder as Landmark, midHip as Landmark, midKnee as Landmark),
            kneeToElbow: (leftKneeToElbow + rightKneeToElbow) / 2
          };

          setKpis(newKpis);
          setKpiHistory(prev => [...prev, newKpis]);
          
          const now = performance.now();
          if (now - lastAnalysisTime.current > 3000 && !isAnalyzing) {
            setIsAnalyzing(true);
            lastAnalysisTime.current = now;
            getPoseFeedback(landmarks, currentDrill, settings.focusArea).then(newFeedback => {
              if (newFeedback) {
                  setFeedback(newFeedback);
                  setFeedbackLog(prev => new Set(prev).add(newFeedback));
                  
                  if (settings.enableAudioFeedback) {
                    const utterance = new SpeechSynthesisUtterance(newFeedback);
                    speechSynthesis.cancel(); // Stop any previous speech
                    speechSynthesis.speak(utterance);
                  }

                  const lowerCaseFeedback = newFeedback.toLowerCase();
                  const isPositiveFeedback = ['excellent', 'awesome', 'solid', 'consistent', 'great'].some(w => lowerCaseFeedback.includes(w));
                  if (!isPositiveFeedback) triggerHapticFeedback([50, 30, 50]);
              }
              setIsAnalyzing(false);
            });
          }
        } else {
          setKpis(newKpis);
          setFeedback("Please make your full body visible.");
        }
      } else {
         setKpis({ postureHeight: null, baseWidth: null, hipHeight: null, spineAngle: null, kneeToElbow: null });
         setFeedback("No pose detected.");
      }
      canvasCtx.restore();
    } catch (e) {
      console.error("MediaPipe Error:", e);
      setError("An error occurred during pose detection.");
      setSessionState('paused');
    }
  }, [poseLandmarker, isAnalyzing, settings, currentDrill]);

  useEffect(() => {
    const loop = () => {
      if (sessionState === 'running') {
        predict();
        animationFrameId.current = requestAnimationFrame(loop);
      }
    };
    if (sessionState === 'running') {
      animationFrameId.current = requestAnimationFrame(loop);
    } else {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    }
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [sessionState, predict]);

  useEffect(() => {
    if (!poseLandmarker || !videoRef.current || !selectedDeviceId) return;
    const video = videoRef.current;
    let stream: MediaStream | null = null;
    const startWebcam = async () => {
      if (video.srcObject) (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      try {
        const constraints: MediaStreamConstraints = { 
            video: { 
                width: 1280, 
                height: 720, 
                deviceId: { exact: selectedDeviceId } 
            } 
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
        setError(null);
      } catch (err: any) {
        console.error("Camera Access Error:", err);
         if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError("Camera access is required for the drill. Please allow camera permissions in your browser settings and refresh the page.");
        } else {
            setError("Could not access camera. Please ensure it is not in use and refresh.");
        }
      }
    };
    startWebcam();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [poseLandmarker, selectedDeviceId]);

  const handleToggleSession = () => {
    if (availableDrills.length === 0) return;
    triggerHapticFeedback(50);
    if (sessionState === 'running') {
      setSessionState('paused');
      setKpis({ postureHeight: null, baseWidth: null, hipHeight: null, spineAngle: null, kneeToElbow: null });
      setFeedback("Session paused.");
    } else { // 'idle' or 'paused'
      if (sessionState === 'idle') {
        setSessionStartTime(new Date());
        setKpiHistory([]);
        setFeedbackLog(new Set());
      }
      setSessionState('running');
      setFeedback("AI coach is warming up...");
    }
  };

  const handleEndSession = () => {
    triggerHapticFeedback(100);
    if (sessionStartTime) {
      const calculateAverages = (history: KpiType[]): KpiType => {
        const sums = history.reduce((acc, kpi) => {
          return {
            postureHeight: acc.postureHeight + (kpi.postureHeight || 0),
            baseWidth: acc.baseWidth + (kpi.baseWidth || 0),
            hipHeight: acc.hipHeight + (kpi.hipHeight || 0),
            spineAngle: acc.spineAngle + (kpi.spineAngle || 0),
            kneeToElbow: acc.kneeToElbow + (kpi.kneeToElbow || 0),
          };
        }, { postureHeight: 0, baseWidth: 0, hipHeight: 0, spineAngle: 0, kneeToElbow: 0 });

        const count = history.length || 1;
        return {
          postureHeight: sums.postureHeight / count,
          baseWidth: sums.baseWidth / count,
          hipHeight: sums.hipHeight / count,
          spineAngle: sums.spineAngle / count,
          kneeToElbow: sums.kneeToElbow / count,
        };
      };

      onSessionEnd({
        startTime: sessionStartTime,
        duration: (new Date().getTime() - sessionStartTime.getTime()) / 1000,
        drill: currentDrill,
        kpiAverages: calculateAverages(kpiHistory),
        feedbackLog: Array.from(feedbackLog),
      });
    }
    setSessionState('idle');
    setSessionStartTime(null);
    setKpis({ postureHeight: null, baseWidth: null, hipHeight: null, spineAngle: null, kneeToElbow: null });
    setFeedback('Start the session to get feedback.');
    setKpiHistory([]);
    setFeedbackLog(new Set());
  };
  
  const isUserFacing = useMemo(() => {
    if (!selectedDeviceId || videoDevices.length === 0) return true;
    const selectedDevice = videoDevices.find(d => d.deviceId === selectedDeviceId);
    if (!selectedDevice || !selectedDevice.label) return true; // Default to user-facing if no label
    
    const label = selectedDevice.label.toLowerCase();
    if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
        return false;
    }
    return true;
  }, [selectedDeviceId, videoDevices]);

  const sessionButtonText = useMemo(() => {
    if (sessionState === 'running') return 'Pause';
    if (sessionState === 'paused') return 'Resume';
    return 'Start';
  }, [sessionState]);

  const ImmersiveControlGroup = () => (
    <div className="flex items-center gap-4">
      {/* Drill Selector */}
      <div className="relative flex-1">
        <select
          value={currentDrill}
          onChange={(e) => setCurrentDrill(e.target.value as Drill | 'all')}
          className="w-full bg-[#2d2d2d] text-gray-300 py-3 pl-4 pr-10 rounded-lg font-semibold text-base hover:bg-[#3f3f3f] focus:outline-none focus:ring-2 focus:ring-[#58A6FF] transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed truncate"
          disabled={sessionState !== 'idle' || availableDrills.length === 0}
        >
          {availableDrills.length > 1 && <option value="all">ALL (Flow)</option>}
          {availableDrills.map((drill) => (
            <option key={drill.id} value={drill.id}>{drill.name}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
        </div>
      </div>
      {/* Camera Selector */}
      <div className="relative flex-1">
        <select
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          className="w-full bg-[#2d2d2d] text-gray-300 py-3 pl-4 pr-10 rounded-lg font-semibold text-base hover:bg-[#3f3f3f] focus:outline-none focus:ring-2 focus:ring-[#58A6FF] transition-all appearance-none disabled:opacity-50 truncate"
          disabled={sessionState !== 'idle' || videoDevices.length <= 1}
        >
          {videoDevices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
        </div>
      </div>
      <LayoutToggleButton layout={settings.drillLayout} onClick={handleToggleLayout} />
    </div>
  );
  
  const DashboardControlGroup = () => (
    <div className="flex flex-col gap-4">
      <div>
          <label className="text-gray-400 font-semibold mb-2 px-1 text-base block">Drill</label>
          <div className="relative">
              <select
                  value={currentDrill}
                  onChange={(e) => setCurrentDrill(e.target.value as Drill | 'all')}
                  className="w-full bg-[#2d2d2d] text-gray-300 py-3 pl-4 pr-10 rounded-lg font-semibold text-base hover:bg-[#3f3f3f] focus:outline-none focus:ring-2 focus:ring-[#58A6FF] transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed truncate"
                  disabled={sessionState !== 'idle' || availableDrills.length === 0}
              >
                  {availableDrills.length > 1 && <option value="all">ALL (Flow)</option>}
                  {availableDrills.map((drill) => (
                      <option key={drill.id} value={drill.id}>
                          {drill.name}
                      </option>
                  ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
              </div>
          </div>
      </div>
      <div>
          <label className="text-gray-400 font-semibold mb-2 px-1 text-base block">Camera</label>
          <div className="relative">
              <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full bg-[#2d2d2d] text-gray-300 py-3 pl-4 pr-10 rounded-lg font-semibold text-base hover:bg-[#3f3f3f] focus:outline-none focus:ring-2 focus:ring-[#58A6FF] transition-all appearance-none disabled:opacity-50 truncate"
                  disabled={sessionState !== 'idle' || videoDevices.length <= 1}
              >
                  {videoDevices.map((device, index) => (
                      <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${index + 1}`}
                      </option>
                  ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
              </div>
          </div>
      </div>
      <LayoutToggleButton layout={settings.drillLayout} onClick={handleToggleLayout} />
    </div>
  );

  const MobileKpiSummary = () => (
    <div className="flex items-center justify-around w-full text-xs text-center">
        <div className="flex flex-col"><span className="text-gray-400">P</span><span className="font-bold text-white">{kpis.postureHeight?.toFixed(0) || '--'}</span></div>
        <div className="flex flex-col"><span className="text-gray-400">B</span><span className="font-bold text-white">{kpis.baseWidth?.toFixed(0) || '--'}</span></div>
        <div className="flex flex-col"><span className="text-gray-400">H</span><span className="font-bold text-white">{kpis.hipHeight?.toFixed(0) || '--'}</span></div>
        <div className="flex flex-col"><span className="text-gray-400">S</span><span className="font-bold text-white">{kpis.spineAngle?.toFixed(0) || '--'}</span></div>
        <div className="flex flex-col"><span className="text-gray-400">K</span><span className="font-bold text-white">{kpis.kneeToElbow?.toFixed(0) || '--'}</span></div>
    </div>
  );


  return (
    <div className={`w-full flex-grow bg-[#0D1117] flex flex-col ${settings.drillLayout === 'dashboard' ? 'lg:flex-row lg:gap-8 lg:p-8' : 'lg:absolute lg:inset-0'}`}>
      
      {/* --- Live View Container (Video & Canvas) --- */}
      <div className="relative w-full flex-1 overflow-hidden lg:rounded-2xl">
        <LoadingOverlay isLoading={isLoading} error={error} onGoBack={() => onNavigate('home')} />
        <LiveView videoRef={videoRef} canvasRef={canvasRef} isUserFacing={isUserFacing} />
        {availableDrills.length === 0 && !isLoading && !error && <NoDrillsSelected onNavigate={onNavigate} />}


        {/* --- Immersive Mode Desktop UI --- */}
        {!isLoading && !error && settings.drillLayout === 'immersive' && (
          <div className="hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 w-auto z-20">
            <div className="flex items-stretch">
              <div className="relative">
                  {/* Main Control Panel */}
                  <div className="flex-shrink-0 bg-[#1c1c1c]/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 w-[720px]">
                     <div className="flex items-center justify-between gap-6">
                         <div>
                             <p className="text-gray-400 text-base">You're in</p>
                             <div className="mt-1">
                                 <SessionTitleDisplay displayConfig={sessionDisplay} />
                             </div>
                         </div>
                         <div className="flex flex-col gap-4">
                             <button onClick={handleToggleSession} className="bg-[#58A6FF] text-black py-4 px-8 text-xl rounded-lg font-bold hover:bg-blue-500 transition-colors w-40 disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={availableDrills.length === 0}>{sessionButtonText}</button>
                             <button onClick={handleEndSession} className="bg-transparent text-gray-400 hover:bg-red-600/20 hover:text-red-400 py-4 px-8 text-xl rounded-lg font-bold transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400" disabled={sessionState === 'idle'}>End Session</button>
                         </div>
                      </div>
                      <FeedbackPanel feedback={feedback} isAnalyzing={isAnalyzing} isSessionActive={isSessionActive} />
                      <ImmersiveControlGroup />
                  </div>
                   <ImmersivePanelToggleButton 
                        isOpen={isImmersiveKpiPanelVisible} 
                        onClick={() => setIsImmersiveKpiPanelVisible(!isImmersiveKpiPanelVisible)}
                        disabled={sessionState === 'idle'}
                     />
              </div>
              
              {/* Conditionally Visible KPI Panel */}
              {sessionState !== 'idle' && (
                  <div className={`flex-shrink-0 bg-[#1c1c1c]/80 backdrop-blur-md rounded-r-2xl shadow-2xl border-l border-gray-700/50 p-4 transition-all duration-300 ${isImmersiveKpiPanelVisible ? 'w-48 opacity-100' : 'w-0 opacity-0'}`}>
                      <div className="w-full h-full">
                          <KpiPanel kpis={kpis} layout="vertical" />
                      </div>
                  </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- Dashboard Mode Desktop UI --- */}
      {!isLoading && !error && settings.drillLayout === 'dashboard' && (
        <div className="hidden lg:flex lg:w-full lg:max-w-sm flex-shrink-0 flex-col gap-6 bg-[#1c1c1c] p-6 rounded-2xl">
          {availableDrills.length > 0 ? (
            <>
              <div>
                <p className="text-gray-400 text-base">You're in</p>
                <div className="mt-1">
                  <SessionTitleDisplay displayConfig={sessionDisplay} />
                </div>
              </div>
              <FeedbackPanel feedback={feedback} isAnalyzing={isAnalyzing} isSessionActive={isSessionActive} />
              
              <KpiPanel kpis={kpis} layout="horizontal" />

              <DashboardControlGroup />

              {/* Main session buttons pushed to the bottom */}
              <div className="grid grid-cols-2 gap-4 mt-auto">
                <button onClick={handleToggleSession} className="bg-[#58A6FF] text-black py-4 text-xl rounded-lg font-bold hover:bg-blue-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={availableDrills.length === 0}>{sessionButtonText}</button>
                <button onClick={handleEndSession} className="bg-transparent text-gray-400 hover:bg-red-600/20 hover:text-red-400 py-4 text-xl rounded-lg font-bold transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400" disabled={sessionState === 'idle'}>End Session</button>
              </div>
            </>
          ) : (
             <NoDrillsSelected onNavigate={onNavigate} isDashboard={true} />
          )}
        </div>
      )}

      {/* --- Mobile "Video Call" Layout (Common to both modes) --- */}
      {!isLoading && !error && (
        <div className="lg:hidden absolute inset-0 z-20 p-4 flex flex-col justify-between pointer-events-none">
          {/* Top Floating Elements */}
          <div className="flex justify-between items-start flex-wrap gap-2 pointer-events-auto">
            {/* THIS KPI PANEL IS REMOVED IN THE NEW DESIGN */}
            <div className="ml-auto bg-black/40 backdrop-blur-sm text-white py-2 px-4 rounded-lg text-right">
              <p className="text-sm text-gray-400">You're in</p>
              <h2 className="text-xl font-bold text-white truncate">
                {sessionDisplay?.type === 'title' ? sessionDisplay.value : sessionDisplay?.label}
              </h2>
            </div>
          </div>
          
          {/* Subtitle Feedback */}
          <div className="absolute bottom-64 left-4 right-4 flex justify-center">
            <p className="bg-black/60 backdrop-blur-sm text-[#58A6FF] font-medium text-center text-lg lg:text-xl rounded-full px-6 py-3 shadow-lg">
              {sessionState === 'running' ? (isAnalyzing ? 'Analyzing...' : feedback) : (availableDrills.length > 0 ? 'Session Paused' : 'Select a drill in Settings')}
            </p>
          </div>

          {/* Bottom Control Buttons */}
          <div className="absolute bottom-0 left-0 right-0 w-full px-4 pb-6 pt-10 bg-gradient-to-t from-black/60 to-transparent pointer-events-auto">
              <div className="flex flex-col gap-4">
                
                {/* NEW INTERACTIVE KPI BAR */}
                {sessionState !== 'idle' && (
                  <div className="w-full">
                    <button 
                      onClick={() => setIsMobileKpiPanelOpen(!isMobileKpiPanelOpen)}
                      className="w-full bg-[#2d2d2d]/80 backdrop-blur-sm text-gray-200 py-2 px-3 rounded-lg font-semibold text-base transition-all flex items-center"
                    >
                      <MobileKpiSummary />
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 ml-auto transition-transform duration-300 ${isMobileKpiPanelOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMobileKpiPanelOpen ? 'max-h-96 mt-2' : 'max-h-0'}`}>
                      <div className="bg-[#2d2d2d]/80 backdrop-blur-sm rounded-lg p-2">
                        <KpiPanel kpis={kpis} layout="vertical" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* SELECTORS ROW */}
                <div className="flex items-center gap-4">
                   <div className="relative flex-1">
                       <select
                           value={currentDrill}
                           onChange={(e) => setCurrentDrill(e.target.value as Drill | 'all')}
                           className="w-full bg-[#2d2d2d]/80 backdrop-blur-sm text-gray-200 py-3 pl-4 pr-10 rounded-lg font-semibold text-base hover:bg-[#3f3f3f] focus:outline-none focus:ring-2 focus:ring-white/50 transition-all appearance-none disabled:opacity-60 truncate"
                           disabled={sessionState !== 'idle' || availableDrills.length === 0}
                       >
                           {availableDrills.length > 1 && <option value="all">ALL (Flow)</option>}
                           {availableDrills.map((drill) => (
                               <option key={drill.id} value={drill.id} className="bg-[#1c1c1c] font-semibold">
                                   {drill.name}
                               </option>
                           ))}
                           {availableDrills.length === 0 && <option>Go to Settings</option>}
                       </select>
                       <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                           <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                           </svg>
                       </div>
                   </div>
                   <div className="relative flex-1">
                       <select
                           value={selectedDeviceId}
                           onChange={(e) => setSelectedDeviceId(e.target.value)}
                           className="w-full bg-[#2d2d2d]/80 backdrop-blur-sm text-gray-200 py-3 pl-4 pr-10 rounded-lg font-semibold text-base hover:bg-[#3f3f3f] focus:outline-none focus:ring-2 focus:ring-white/50 transition-all appearance-none disabled:opacity-60 truncate"
                           disabled={sessionState !== 'idle' || videoDevices.length <= 1}
                       >
                           {videoDevices.map((device, index) => (
                               <option key={device.deviceId} value={device.deviceId} className="bg-[#1c1c1c] font-semibold">
                                   {device.label || `Camera ${index + 1}`}
                               </option>
                           ))}
                       </select>
                       <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                           <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                           </svg>
                       </div>
                   </div>
                </div>

                {/* MAIN ACTION BUTTONS */}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleToggleSession} disabled={availableDrills.length === 0} className="bg-[#58A6FF] text-black py-4 rounded-lg font-bold text-xl hover:bg-blue-500 transition-colors shadow-lg transform active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed">{sessionButtonText}</button>
                    <button onClick={handleEndSession} disabled={sessionState === 'idle'} className="bg-red-600 text-white py-4 rounded-lg font-bold text-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 transform active:scale-95 disabled:bg-[#2d2d2d] disabled:opacity-50 disabled:shadow-none disabled:hover:bg-[#2d2d2d]">End Session</button>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}