import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  error: string | null;
  onGoBack?: () => void;
}

const loadingSteps = [
  'Initializing AI Coach...',
  'Warming up GPU...',
  'Loading Pose Models...',
  'Finalizing Setup...',
];

const stepDelays = [0, 800, 2000, 3500]; 

export default function LoadingOverlay({ isLoading, error, onGoBack }: LoadingOverlayProps) {
  const [displayText, setDisplayText] = useState(loadingSteps[0]);

  useEffect(() => {
    if (isLoading) {
      setDisplayText(loadingSteps[0]); 

      const timers = loadingSteps.map((text, index) =>
        setTimeout(() => {
          setDisplayText(text);
        }, stepDelays[index])
      );

      return () => {
        timers.forEach(clearTimeout);
      };
    }
  }, [isLoading]);

  if (!isLoading && !error) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black text-center p-4 transition-opacity duration-300">
      {error ? (
        <div className="flex flex-col items-center gap-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl sm:text-2xl text-red-400 max-w-md">{error}</p>
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="mt-4 bg-[#21262D] text-gray-300 hover:text-[#F0F6FC] py-3 px-6 rounded-lg font-semibold text-lg hover:bg-[#30363D] transition-colors border border-gray-600"
              >
                Return to Home
              </button>
            )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <svg className="animate-spin h-10 w-10 text-[#58A6FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="h-8 flex items-center">
            <p className="text-xl sm:text-2xl text-gray-300 w-72 text-center">
              {displayText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}