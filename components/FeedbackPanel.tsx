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
    <div className="bg-[#2d2d2d] rounded-lg p-3.5 flex items-center justify-center min-h-[56px] text-center">
      <p className="text-[#58A6FF] font-medium text-xl">
        {getDisplayText()}
      </p>
    </div>
  );
}