import React from 'react';
import { Page } from '../../../types';

interface NoDrillsSelectedProps {
    onNavigate: (page: Page) => void;
    isDashboard?: boolean;
}

export default function NoDrillsSelected({ onNavigate, isDashboard = false }: NoDrillsSelectedProps) {
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