import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PoseLandmarker, DrawingUtils, FilesetResolver } from '@mediapipe/tasks-vision';
import { Session, AppSettings, Page } from '../types';
import KpiPanel from './KpiPanel';
import { getPoseFeedback } from '../services/geminiService';
import LoadingOverlay from './LoadingOverlay';
import LiveView from './LiveView';
import FeedbackPanel from './FeedbackPanel';

interface DrillPageProps {
  onSessionEnd: (sessionData: Session) => void;
  settings: AppSettings;
  onNavigate: (page: Page) => void;
  onSettingsChange: (settings: AppSettings) => void;
}

type KpiType = {
  postureHeight: number | null;
  baseWidth: number | null;
  hipHeight: number | null;
};

const LayoutToggleButton = ({ layout, onClick }: { layout: string, onClick: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center justify-center gap-2 bg-[#2d2d2d] text-gray-300 hover:text-[#F0F6FC] py-3 rounded-lg font-semibold text-base hover:bg-[#3f3f3f] transition-colors" title={`Switch to ${layout === 'immersive' ? 'Dashboard' : 'Immersive'} View`}>
       {layout === 'immersive' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
       ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 0h-4v4m-4 4h4v4h-4v-4zm0 0V8m0 8v-4m-4 4H8v-4h4v4z" />
        </svg>
       )}
        <span>{layout === 'immersive' ? 'Dashboard View' : 'Immersive View'}</span>
    </button>
);


export default function DrillPage({ onSessionEnd, settings, onNavigate, onSettingsChange }: DrillPageProps) {
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [feedback, setFeedback] = useState('Start the session to get feedback.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [kpis, setKpis] = useState<KpiType>({ postureHeight: null, baseWidth: null, hipHeight: null });
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastAnalysisTime = useRef<number>(0);

  const handleToggleLayout = () => {
    const newLayout = settings.drillLayout === 'immersive' ? 'dashboard' : 'immersive';
    onSettingsChange({ ...settings, drillLayout: newLayout });
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

  const predict = useCallback(async () => {
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
            const landmarkRadius = skeletonThickness + 2;
            drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: skeletonColor, lineWidth });
            drawingUtils.drawLandmarks(landmarks, { color: skeletonColor, radius: landmarkRadius });
        }
        const requiredLandmarks = [11, 12, 23, 24, 25, 26].every(i => landmarks[i] && landmarks[i].visibility && landmarks[i].visibility > 0.5);
        let newKpis: KpiType = { postureHeight: null, baseWidth: null, hipHeight: null };
        if (requiredLandmarks) {
          const midShoulderY = (landmarks[11].y + landmarks[12].y) / 2;
          const midHipY = (landmarks[23].y + landmarks[24].y) / 2;
          newKpis = {
            postureHeight: Math.abs(midShoulderY - midHipY) * 100,
            baseWidth: Math.abs(landmarks[25].x - landmarks[26].x) * 100,
            hipHeight: midHipY * 100
          };
          setKpis(newKpis);
          
          const now = performance.now();
          if (now - lastAnalysisTime.current > 3000 && !isAnalyzing) {
            setIsAnalyzing(true);
            lastAnalysisTime.current = now;
            getPoseFeedback(landmarks).then(newFeedback => {
              if (newFeedback) {
                  setFeedback(newFeedback);
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
         setKpis({ postureHeight: null, baseWidth: null, hipHeight: null });
         setFeedback("No pose detected.");
      }
      canvasCtx.restore();
    } catch (e) {
      console.error("MediaPipe Error:", e);
      setError("An error occurred during pose detection.");
      setIsSessionActive(false);
    }
  }, [poseLandmarker, isAnalyzing, settings]);

  useEffect(() => {
    const loop = () => {
      if (isSessionActive) {
        predict();
        animationFrameId.current = requestAnimationFrame(loop);
      }
    };
    if (isSessionActive) {
      animationFrameId.current = requestAnimationFrame(loop);
    } else {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    }
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isSessionActive, predict]);

  useEffect(() => {
    if (!poseLandmarker || !videoRef.current) return;
    const video = videoRef.current;
    let stream: MediaStream | null = null;
    const startWebcam = async () => {
      if (video.srcObject) (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      try {
        const constraints: MediaStreamConstraints = { video: { width: 1280, height: 720, facingMode: cameraFacingMode } };
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
  }, [poseLandmarker, cameraFacingMode]);

  const handleToggleSession = () => {
    triggerHapticFeedback(50);
    setIsSessionActive(prev => {
      if (!prev) {
        setSessionStartTime(new Date());
        setFeedback("AI coach is warming up...");
      } else {
        setKpis({ postureHeight: null, baseWidth: null, hipHeight: null });
        setFeedback("Session paused.");
      }
      return !prev;
    });
  };
  
  const handleCameraSwitch = () => {
    if (videoDevices.length > 1) {
      setCameraFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
      triggerHapticFeedback(30);
    }
  };

  const handleEndSession = () => {
    triggerHapticFeedback(100);
    if (sessionStartTime) {
      onSessionEnd({
        startTime: sessionStartTime,
        duration: (new Date().getTime() - sessionStartTime.getTime()) / 1000,
      });
    }
    setIsSessionActive(false);
  };

  return (
    <div className={`w-full flex-grow bg-[#0D1117] flex flex-col ${settings.drillLayout === 'dashboard' ? 'lg:flex-row lg:gap-8 lg:p-8' : 'lg:absolute lg:inset-0'}`}>
      
      {/* --- Live View Container (Video & Canvas) --- */}
      <div className="relative w-full flex-1 overflow-hidden lg:rounded-2xl">
        <LoadingOverlay isLoading={isLoading} error={error} onGoBack={() => onNavigate('home')} />
        <LiveView videoRef={videoRef} canvasRef={canvasRef} cameraFacingMode={cameraFacingMode} />

        {/* --- Immersive Mode Desktop UI --- */}
        {!isLoading && !error && settings.drillLayout === 'immersive' && (
          <div className="hidden lg:flex flex-col gap-4 absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl bg-[#1c1c1c]/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 z-20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-base">You're in</p>
                <h2 className="text-[#F0F6FC] text-5xl font-bold tracking-tighter">SIDE CONTROL</h2>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={handleToggleSession} className="bg-[#58A6FF] text-black py-4 px-8 text-xl rounded-lg font-bold hover:bg-blue-500 transition-colors">{isSessionActive ? 'Pause' : 'Start'}</button>
                <button onClick={handleEndSession} className="bg-red-600 text-white py-4 px-8 text-xl rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 disabled:bg-[#2d2d2d] disabled:opacity-50 disabled:shadow-none disabled:hover:bg-[#2d2d2d]" disabled={!sessionStartTime}>End Session</button>
              </div>
            </div>
            <FeedbackPanel feedback={feedback} isAnalyzing={isAnalyzing} isSessionActive={isSessionActive} />
            {isSessionActive && <KpiPanel kpis={kpis} />}
            <div className="border-t border-gray-700/50 pt-4 mt-2">
                <LayoutToggleButton layout={settings.drillLayout} onClick={handleToggleLayout} />
            </div>
          </div>
        )}
      </div>

      {/* --- Dashboard Mode Desktop UI --- */}
      {!isLoading && !error && settings.drillLayout === 'dashboard' && (
        <div className="hidden lg:flex w-full max-w-sm flex-shrink-0 flex-col gap-6 bg-[#1c1c1c] p-6 rounded-2xl">
            <div>
              <p className="text-gray-400 text-base">You're in</p>
              <h2 className="text-[#F0F6FC] text-5xl font-bold tracking-tighter">SIDE CONTROL</h2>
            </div>
            <FeedbackPanel feedback={feedback} isAnalyzing={isAnalyzing} isSessionActive={isSessionActive} />
            {isSessionActive ? <KpiPanel kpis={kpis} /> : <div className="h-[96px] bg-[#2d2d2d] rounded-lg flex items-center justify-center text-gray-400">KPIs appear here</div>}
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handleToggleSession} className="bg-[#58A6FF] text-black py-4 text-xl rounded-lg font-bold hover:bg-blue-500 transition-colors">{isSessionActive ? 'Pause' : 'Start'}</button>
              <button onClick={handleEndSession} className="bg-red-600 text-white py-4 text-xl rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 disabled:bg-[#2d2d2d] disabled:opacity-50 disabled:shadow-none" disabled={!sessionStartTime}>End Session</button>
            </div>
            <div className="border-t border-gray-700/50 pt-4 mt-auto">
              <LayoutToggleButton layout={settings.drillLayout} onClick={handleToggleLayout} />
            </div>
        </div>
      )}

      {/* --- Mobile "Video Call" Layout (Common to both modes) --- */}
      {!isLoading && !error && (
        <div className="lg:hidden absolute inset-0 z-20 p-4 flex flex-col justify-between pointer-events-none">
          {/* Top Floating Elements */}
          <div className="flex justify-between items-start pointer-events-auto">
            {isSessionActive && (
              <div className="bg-black/30 backdrop-blur-sm rounded-xl shadow-lg">
                <KpiPanel kpis={kpis} />
              </div>
            )}
            <div className="flex-grow"></div>
            {videoDevices.length > 1 && (
              <button onClick={handleCameraSwitch} className="bg-black/40 p-3 rounded-full hover:bg-black/60 transition-colors shadow-lg" aria-label="Switch camera">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#F0F6FC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 20L20 4M20 4V9h-5M4 20v-5h5" transform="rotate(90 12 12)"/>
                </svg>
              </button>
            )}
          </div>
          
          {/* Subtitle Feedback */}
          <div className="absolute bottom-28 left-4 right-4 flex justify-center">
            <p className="bg-black/60 backdrop-blur-sm text-[#58A6FF] font-medium text-center text-lg rounded-full px-6 py-3 shadow-lg">
              {isSessionActive ? (isAnalyzing ? 'Analyzing...' : feedback) : 'Session Paused'}
            </p>
          </div>

          {/* Bottom Control Buttons */}
          <div className="absolute bottom-0 left-0 right-0 w-full px-4 pb-6 pt-10 bg-gradient-to-t from-black/60 to-transparent pointer-events-auto">
              <div className="grid grid-cols-2 gap-4">
                  <button onClick={handleToggleSession} className="bg-[#58A6FF] text-black py-4 rounded-lg font-bold text-xl hover:bg-blue-500 transition-colors shadow-lg transform active:scale-95">{isSessionActive ? 'Pause' : 'Start'}</button>
                  <button onClick={handleEndSession} disabled={!sessionStartTime} className="bg-red-600 text-white py-4 rounded-lg font-bold text-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 transform active:scale-95 disabled:bg-[#2d2d2d] disabled:opacity-50 disabled:shadow-none disabled:hover:bg-[#2d2d2d]">End Session</button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
