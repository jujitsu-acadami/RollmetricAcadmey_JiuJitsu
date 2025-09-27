import React, { useState } from 'react';
import { Session, AppSettings, ModelComplexity } from '../types';

interface AccountPageProps {
  sessionHistory: Session[];
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

const complexityOptions: { id: ModelComplexity; label: string }[] = [
    { id: 'lite', label: 'Lite' },
    { id: 'full', label: 'Balanced' },
    { id: 'heavy', label: 'Heavy' },
];

const colorOptions = [
    { id: '#7FFF00', label: 'Lime Green' },
    { id: '#FFFF00', label: 'Yellow' },
    { id: '#FF00FF', label: 'Magenta' },
    { id: '#00FFFF', label: 'Cyan' },
];

const thicknessOptions = [
    { id: 2, label: 'Thin' },
    { id: 5, label: 'Normal' },
    { id: 8, label: 'Thick' },
];


export default function AccountPage({ sessionHistory, settings, onSettingsChange }: AccountPageProps) {

  return (
    <div className="w-full flex flex-col gap-6 lg:gap-8 max-w-4xl mx-auto">
      {/* App Settings Section */}
      <div className="bg-[#1c1c1c] w-full p-5 sm:p-6 lg:p-8 rounded-2xl flex flex-col gap-4 lg:gap-6">
        <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tighter">
          App Settings
        </h2>
        
        {/* Model Complexity */}
        <div>
            <label className="text-gray-300 font-medium text-base lg:text-lg mb-3 block">Model Complexity</label>
            <div className="flex bg-[#2d2d2d] rounded-lg p-1">
                {complexityOptions.map(({id, label}) => (
                    <button 
                        key={id} 
                        onClick={() => onSettingsChange({ ...settings, modelComplexity: id })}
                        className={`w-full py-2 lg:py-3 text-sm lg:text-base font-semibold rounded-md transition-colors ${settings.modelComplexity === id ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:bg-[#3f3f3f]'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>

        {/* Personalization Section */}
        <div className="border-t border-gray-700 pt-6 mt-2">
           <h3 className="text-white text-xl sm:text-2xl font-bold tracking-tight mb-4">
             Personalization
           </h3>
           <div className="space-y-6">
              {/* Skeletonless Tracking Toggle */}
              <div className="flex items-center justify-between">
                <label htmlFor="skeleton-toggle" className="text-gray-300 font-medium text-base lg:text-lg">Skeleton Overlay</label>
                <button
                  id="skeleton-toggle"
                  role="switch"
                  aria-checked={settings.showSkeleton}
                  onClick={() => onSettingsChange({ ...settings, showSkeleton: !settings.showSkeleton })}
                  className={`${settings.showSkeleton ? 'bg-yellow-500' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-[#1c1c1c]`}
                >
                  <span className={`${settings.showSkeleton ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}/>
                </button>
              </div>

              {/* Wrapper for conditional settings */}
              <div className={`space-y-6 transition-opacity duration-300 ${!settings.showSkeleton ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                {/* Skeleton Color */}
                <div>
                  <label className="text-gray-300 font-medium text-base lg:text-lg mb-3 block">Skeleton Color</label>
                  <div className="flex items-center gap-3">
                    {colorOptions.map(({ id, label }) => (
                      <button
                        key={id}
                        aria-label={`Set skeleton color to ${label}`}
                        onClick={() => onSettingsChange({ ...settings, skeletonColor: id })}
                        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1c1c1c] ${settings.skeletonColor === id ? 'ring-2 ring-white' : ''}`}
                        style={{ backgroundColor: id }}
                      />
                    ))}
                  </div>
                </div>

                {/* Skeleton Thickness */}
                <div>
                   <label className="text-gray-300 font-medium text-base lg:text-lg mb-3 block">Skeleton Thickness</label>
                   <div className="flex bg-[#2d2d2d] rounded-lg p-1">
                      {thicknessOptions.map(({id, label}) => (
                          <button 
                              key={id} 
                              onClick={() => onSettingsChange({ ...settings, skeletonThickness: id as any })}
                              className={`w-full py-2 lg:py-3 text-sm lg:text-base font-semibold rounded-md transition-colors ${settings.skeletonThickness === id ? 'bg-gray-500 text-white' : 'text-gray-300 hover:bg-[#3f3f3f]'}`}
                          >
                              {label}
                          </button>
                      ))}
                  </div>
                </div>
              </div>
           </div>
        </div>

      </div>

      {/* Session History Section */}
      <div className="bg-[#1c1c1c] w-full p-5 sm:p-6 lg:p-8 rounded-2xl flex flex-col gap-4 sm:gap-5">
        <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tighter">
          Session History
        </h2>
        {sessionHistory.length === 0 ? (
          <div className="text-center py-8 sm:py-10 lg:py-16">
            <p className="text-gray-400 text-base lg:text-lg">No sessions completed yet.</p>
            <p className="text-gray-500 text-sm lg:text-base mt-2">Start a drill to see your history here.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sessionHistory.slice().reverse().map((session) => (
              <li 
                key={session.startTime.toISOString()} 
                className="bg-[#2d2d2d] rounded-lg p-4 lg:p-5 flex justify-between items-center"
              >
                <div>
                  <p className="text-white font-medium text-sm sm:text-base lg:text-lg">
                    {session.startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm lg:text-base">
                    {session.startTime.toLocaleTimeString()}
                  </p>
                </div>
                <p className="text-yellow-500 text-lg sm:text-xl lg:text-2xl font-semibold">
                  {Math.round(session.duration)}s
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}