import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PoseLandmarker, DrawingUtils, FilesetResolver } from '@mediapipe/tasks-vision';
import { Session, AppSettings } from '../types';
import KpiPanel from './KpiPanel';
import { getPoseFeedback } from '../services/geminiService';

interface DrillPageProps {
  onSessionEnd: (sessionData: Session) => void;
  settings: AppSettings;
}

export default function DrillPage({ onSessionEnd, settings }: DrillPageProps) {
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [feedback, setFeedback] = useState('Start the session to get feedback.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [kpis, setKpis] = useState<{
    postureHeight: number | null;
    baseWidth: number | null;
    hipHeight: number | null;
  }>({ postureHeight: null, baseWidth: null, hipHeight: null });
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');


  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastAnalysisTime = useRef<number>(0);

  // Helper for haptic feedback
  const triggerHapticFeedback = (pattern: VibratePattern) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn("Haptic feedback failed:", e);
      }
    }
  };

  // Enumerate video devices on mount
  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true }); // Request permission first
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoInputs);
      } catch (err) {
        console.error("Error enumerating devices:", err);
        setError("Camera permission is required. Please allow and refresh.");
      }
    };
    getDevices();
  }, []);

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        const modelName = `pose_landmarker_${settings.modelComplexity}`;
        const modelPath = `https://storage.googleapis.com/mediapipe-models/pose_landmarker/${modelName}/float16/1/${modelName}.task`;

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
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
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.modelComplexity]);

  const predict = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !poseLandmarker) {
      return;
    }
    
    const video = videoRef.current;
    if (video.readyState < 2) { 
      return;
    }

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

        const requiredLandmarks = [11, 12, 23, 24, 25, 26].every(
          i => landmarks[i] && landmarks[i].visibility && landmarks[i].visibility > 0.5
        );

        if (requiredLandmarks) {
          const midShoulderY = (landmarks[11].y + landmarks[12].y) / 2;
          const midHipY = (landmarks[23].y + landmarks[24].y) / 2;
          
          const postureHeight = Math.abs(midShoulderY - midHipY) * 100;
          const baseWidth = Math.abs(landmarks[25].x - landmarks[26].x) * 100;
          const hipHeight = midHipY * 100;

          setKpis({ postureHeight, baseWidth, hipHeight });
          
          const now = performance.now();
          if (now - lastAnalysisTime.current > 3000 && !isAnalyzing) {
            setIsAnalyzing(true);
            lastAnalysisTime.current = now;
            getPoseFeedback(landmarks).then(newFeedback => {
              setFeedback(newFeedback);
              setIsAnalyzing(false);
              if (!newFeedback.toLowerCase().includes("excellent form")) {
                  triggerHapticFeedback([50, 30, 50]);
              }
            });
          }

        } else {
          setKpis({ postureHeight: null, baseWidth: null, hipHeight: null });
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
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isSessionActive, predict]);


  useEffect(() => {
    if (!poseLandmarker || !videoRef.current) return;

    const video = videoRef.current;
    let stream: MediaStream | null = null;

    const startWebcam = async () => {
      if (video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      
      try {
        const constraints: MediaStreamConstraints = { video: { width: 1280, height: 720, facingMode: cameraFacingMode } };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
      } catch (err) {
        console.error("Camera Access Error:", err);
        setError("Camera access was denied. Please allow permissions and refresh.");
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
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
    <div className="w-full flex-grow flex flex-col bg-[#0D1117] lg:absolute lg:inset-0">
      {/* Video & Canvas Container */}
      <div className="relative w-full flex-1 overflow-hidden lg:rounded-2xl">
        {(isLoading || error) && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-black text-center p-4">
                {isLoading && <p className="text-lg sm:text-xl text-gray-400">Loading AI Coach...</p>}
                {error && <p className="text-lg sm:text-xl text-red-500 max-w-md">{error}</p>}
            </div>
        )}
        
        <video ref={videoRef} className={`absolute w-full h-full object-cover ${cameraFacingMode === 'user' ? 'transform -scale-x-100' : ''}`} playsInline muted />
        <canvas ref={canvasRef} className={`absolute w-full h-full ${cameraFacingMode === 'user' ? 'transform -scale-x-100' : ''}`} />

        {/* --- Controls Overlay --- */}
        {!isLoading && !error && (
          <>
            {/* Desktop Layout */}
            <div className="hidden lg:flex flex-col gap-4 absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl bg-[#1c1c1c]/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 z-20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-base">You're in</p>
                  <h2 className="text-white text-5xl font-bold tracking-tighter">SIDE CONTROL</h2>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={handleToggleSession} className="bg-[#2d2d2d] text-white py-4 px-8 text-lg rounded-lg font-semibold hover:bg-[#3f3f3f] transition-colors">{isSessionActive ? 'Pause' : 'Start'}</button>
                  <button onClick={handleEndSession} className="bg-[#2d2d2d] text-white py-4 px-8 text-lg rounded-lg font-semibold hover:bg-[#3f3f3f] transition-colors disabled:opacity-50" disabled={!sessionStartTime}>End Session</button>
                </div>
              </div>
              <div className="bg-[#2d2d2d] rounded-lg p-3.5 flex items-center justify-center min-h-[56px]">
                <p className="text-yellow-400 font-medium text-lg text-center">{isAnalyzing ? 'Analyzing...' : feedback}</p>
              </div>
              {isSessionActive && <KpiPanel kpis={kpis} />}
            </div>

            {/* Mobile "Video Call" Layout */}
            <div className="lg:hidden absolute inset-0 z-20 p-4 flex flex-col justify-between">
              {/* Top Floating Elements */}
              <div className="flex justify-between items-start">
                {isSessionActive && (
                  <div className="bg-black/30 backdrop-blur-sm rounded-xl shadow-lg">
                    <KpiPanel kpis={kpis} />
                  </div>
                )}
                <div className="flex-grow"></div> {/* Spacer */}
                {videoDevices.length > 1 && (
                  <button onClick={handleCameraSwitch} className="bg-black/40 p-3 rounded-full hover:bg-black/60 transition-colors shadow-lg" aria-label="Switch camera">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 20L20 4M20 4V9h-5M4 20v-5h5" transform="rotate(90 12 12)"/>
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Subtitle Feedback */}
              <div className="absolute bottom-28 left-4 right-4 flex justify-center pointer-events-none">
                <p className="bg-black/60 backdrop-blur-sm text-yellow-400 font-medium text-center text-base rounded-full px-5 py-2.5 shadow-lg">
                  {isSessionActive ? (isAnalyzing ? 'Analyzing...' : feedback) : 'Session Paused'}
                </p>
              </div>

              {/* Bottom Control Buttons */}
              <div className="absolute bottom-0 left-0 right-0 w-full px-4 pb-6 pt-10 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="grid grid-cols-2 gap-4">
                      <button
                          onClick={handleToggleSession}
                          className="bg-yellow-500 text-black py-4 rounded-lg font-bold text-lg hover:bg-yellow-600 transition-colors shadow-lg transform active:scale-95"
                      >
                          {isSessionActive ? 'Pause' : 'Start'}
                      </button>
                      <button
                          onClick={handleEndSession}
                          disabled={!sessionStartTime}
                          className="bg-[#2d2d2d] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#3f3f3f] transition-colors disabled:opacity-50 disabled:hover:bg-[#2d2d2d] shadow-lg"
                      >
                          End Session
                      </button>
                  </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}