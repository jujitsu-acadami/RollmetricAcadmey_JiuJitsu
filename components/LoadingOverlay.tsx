import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  error: string | null;
}

// These steps are chosen to create a sense of rapid progress.
const loadingSteps = [
  'Initializing AI Coach...',
  'Warming up GPU...',
  'Loading Pose Models...',
  'Finalizing Setup...',
];

const stepDelays = [0, 800, 2000, 3500]; // Time since loading started to show this step

export default function LoadingOverlay({ isLoading, error }: LoadingOverlayProps) {
  const [displayText, setDisplayText] = useState(loadingSteps[0]);

  useEffect(() => {
    if (isLoading) {
      // Reset to the first step whenever loading begins
      setDisplayText(loadingSteps[0]); 

      // Set up timers to cycle through the loading messages
      const timers = loadingSteps.map((text, index) =>
        setTimeout(() => {
          setDisplayText(text);
        }, stepDelays[index])
      );

      // Cleanup timers on unmount or if isLoading becomes false
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
        <div className="flex flex-col items-center gap-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg sm:text-xl text-red-400 max-w-md">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <svg className="animate-spin h-10 w-10 text-[#58A6FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="h-8 flex items-center">
            <p className="text-lg sm:text-xl text-gray-300 w-64 text-center">
              {displayText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}