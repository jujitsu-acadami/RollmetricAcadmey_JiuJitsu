import React from 'react';

interface FeedbackPanelProps {
  feedback: string;
  isAnalyzing: boolean;
  isSessionActive: boolean;
}

export default function FeedbackPanel({ feedback, isAnalyzing, isSessionActive }: FeedbackPanelProps) {
  const getDisplayText = () => {
    if (!isSessionActive) return "Session Paused";
    if (isAnalyzing) return "Analyzing...";
    return feedback;
  };

  return (
    <div className="bg-dd-surfaceAlt rounded-lg p-3.5 flex items-center justify-center min-h-[56px] text-center">
      <p className="text-dd-accent font-medium text-lg lg:text-xl">
        {getDisplayText()}
      </p>
    </div>
  );
}