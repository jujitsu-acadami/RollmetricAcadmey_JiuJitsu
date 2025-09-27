import React, { useState, useEffect } from 'react';
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
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  const handleSaveChanges = () => {
    onSettingsChange(localSettings);
  };

  const totalTrainingSeconds = sessionHistory.reduce((total, session) => total + session.duration, 0);
  const totalTrainingMinutes = Math.round(totalTrainingSeconds / 60);

  return (
    <div className="w-full flex flex-col gap-6 lg:gap-8 max-w-4xl mx-auto">
      {/* App Settings Section */}
      <div className="bg-[#1c1c1c] w-full p-5 sm:p-6 lg:p-8 rounded-2xl flex flex-col gap-4 lg:gap-6">
        <h2 className="text-[#F0F6FC] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tighter">
          App Settings
        </h2>
        
        {/* Model Complexity */}
        <div>
            <label className="text-gray-300 font-medium text-base lg:text-lg mb-3 block">Model Complexity</label>
            <div className="flex bg-[#2d2d2d] rounded-lg p-1">
                {complexityOptions.map(({id, label}) => (
                    <button 
                        key={id} 
                        onClick={() => setLocalSettings({ ...localSettings, modelComplexity: id })}
                        className={`w-full py-3 text-base font-semibold rounded-md transition-colors ${localSettings.modelComplexity === id ? 'bg-[#58A6FF] text-black' : 'text-gray-300 hover:bg-[#3f3f3f]'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
        
        {/* Personalization Section */}
        <div className="border-t border-gray-700 pt-6 mt-2">
           <h3 className="text-[#F0F6FC] text-xl sm:text-2xl font-bold tracking-tight mb-4">
             Personalization
           </h3>
           <div className="space-y-6">
              {/* Skeletonless Tracking Toggle */}
              <div className="flex items-center justify-between">
                <label htmlFor="skeleton-toggle" className="text-gray-300 font-medium text-base lg:text-lg">Skeleton Overlay</label>
                <button
                  id="skeleton-toggle"
                  role="switch"
                  aria-checked={localSettings.showSkeleton}
                  onClick={() => setLocalSettings({ ...localSettings, showSkeleton: !localSettings.showSkeleton })}
                  className={`${localSettings.showSkeleton ? 'bg-[#58A6FF]' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#58A6FF] focus:ring-offset-2 focus:ring-offset-[#1c1c1c]`}
                >
                  <span className={`${localSettings.showSkeleton ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}/>
                </button>
              </div>

              {/* Wrapper for conditional settings */}
              <div className={`space-y-6 transition-opacity duration-300 ${!localSettings.showSkeleton ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                {/* Skeleton Color */}
                <div>
                  <label className="text-gray-300 font-medium text-base lg:text-lg mb-3 block">Skeleton Color</label>
                  <div className="flex items-center gap-3">
                    {colorOptions.map(({ id, label }) => (
                      <button
                        key={id}
                        aria-label={`Set skeleton color to ${label}`}
                        onClick={() => setLocalSettings({ ...localSettings, skeletonColor: id })}
                        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1c1c1c] ${localSettings.skeletonColor === id ? 'ring-2 ring-white' : ''}`}
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
                              onClick={() => setLocalSettings({ ...localSettings, skeletonThickness: id as any })}
                              className={`w-full py-3 text-base font-semibold rounded-md transition-colors ${localSettings.skeletonThickness === id ? 'bg-[#58A6FF] text-black' : 'text-gray-300 hover:bg-[#3f3f3f]'}`}
                          >
                              {label}
                          </button>
                      ))}
                  </div>
                </div>
              </div>
           </div>
        </div>

        <div className="border-t border-gray-700 pt-6 mt-2">
            <button
                onClick={handleSaveChanges}
                disabled={!hasChanges}
                className="w-full bg-[#58A6FF] text-black py-4 rounded-lg font-bold text-xl hover:bg-blue-500 transition-colors shadow-lg shadow-[#58A6FF]/20 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-gray-600"
            >
                Save Changes
            </button>
        </div>

      </div>

      {/* Session History Section */}
      <div className="bg-[#1c1c1c] w-full p-5 sm:p-6 lg:p-8 rounded-2xl flex flex-col gap-4 sm:gap-5">
        <h2 className="text-[#F0F6FC] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tighter">
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
                  <p className="text-[#F0F6FC] font-medium text-base lg:text-lg">
                    {session.startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-gray-400 text-sm lg:text-base">
                    {session.startTime.toLocaleTimeString()}
                  </p>
                </div>
                <p className="text-[#58A6FF] text-xl lg:text-2xl font-semibold">
                  {Math.round(session.duration)}s
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* User Profile Section */}
      <div className="bg-[#1c1c1c] w-full p-5 sm:p-6 lg:p-8 rounded-2xl flex flex-col gap-4 sm:gap-5">
        <h2 className="text-[#F0F6FC] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tighter">
          User Profile
        </h2>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#2d2d2d] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-grow">
            <h3 className="text-[#F0F6FC] text-xl sm:text-2xl font-bold">Alex Martinez</h3>
            <p className="text-gray-400 text-base sm:text-lg">Rank: Purple Belt</p>
            <div className="mt-2 border-t border-gray-700/50 pt-2 flex flex-col sm:flex-row sm:gap-6 text-sm">
                <p className="text-gray-400"><strong className="font-semibold text-gray-300">Total Sessions:</strong> {sessionHistory.length}</p>
                <p className="text-gray-400"><strong className="font-semibold text-gray-300">Total Training:</strong> {totalTrainingMinutes} min</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
