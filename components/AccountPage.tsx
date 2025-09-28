import React, { useState, useEffect } from 'react';
import { Session, AppSettings, ModelComplexity, Drill, DrillCategory } from '../types';
import { ALL_DRILLS, DRILL_CATEGORIES } from '../DrillData';

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

const AccordionIcon = ({ isOpen }: { isOpen: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);


export default function AccountPage({ sessionHistory, settings, onSettingsChange }: AccountPageProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [openSessions, setOpenSessions] = useState<Set<string>>(new Set());
  const [isDrillSettingsOpen, setIsDrillSettingsOpen] = useState(true);
  const [openCategories, setOpenCategories] = useState<Set<DrillCategory>>(new Set(DRILL_CATEGORIES));


  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  const handleSaveChanges = () => {
    onSettingsChange(localSettings);
  };

  const handleDrillToggle = (drillId: Drill) => {
    const newFocusArea = localSettings.focusArea.includes(drillId)
      ? localSettings.focusArea.filter(id => id !== drillId)
      : [...localSettings.focusArea, drillId];
    setLocalSettings({ ...localSettings, focusArea: newFocusArea });
  };

  const handleToggleAllDrills = () => {
    const allDrillIds = ALL_DRILLS.map(d => d.id);
    const areAllSelected = localSettings.focusArea.length === allDrillIds.length;
    setLocalSettings({ ...localSettings, focusArea: areAllSelected ? [] : allDrillIds });
  };
  
  const handleCategorySelectToggle = (category: DrillCategory) => {
    const categoryDrillIds = ALL_DRILLS.filter(d => d.category === category).map(d => d.id);
    const selectedInCategory = localSettings.focusArea.filter(id => categoryDrillIds.includes(id));
    
    if (selectedInCategory.length === categoryDrillIds.length) {
      // All are selected, so deselect them
      setLocalSettings({ ...localSettings, focusArea: localSettings.focusArea.filter(id => !categoryDrillIds.includes(id))});
    } else {
      // Not all are selected, so select them all
      const newFocusArea = [...new Set([...localSettings.focusArea, ...categoryDrillIds])];
      setLocalSettings({ ...localSettings, focusArea: newFocusArea});
    }
  };

  const toggleSession = (isoString: string) => {
    setOpenSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(isoString)) {
        newSet.delete(isoString);
      } else {
        newSet.add(isoString);
      }
      return newSet;
    });
  };

  const toggleCategory = (category: DrillCategory) => {
      setOpenCategories(prev => {
          const newSet = new Set(prev);
          if (newSet.has(category)) {
              newSet.delete(category);
          } else {
              newSet.add(category);
          }
          return newSet;
      });
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
        
        {/* Drill Settings Section */}
        <div className="border-t border-gray-700 pt-6 mt-2">
            <button
              onClick={() => setIsDrillSettingsOpen(!isDrillSettingsOpen)}
              className="w-full flex justify-between items-center mb-4"
            >
              <h3 className="text-[#F0F6FC] text-xl sm:text-2xl font-bold tracking-tight">
                Drill Settings: Focus Area
              </h3>
              <AccordionIcon isOpen={isDrillSettingsOpen} />
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isDrillSettingsOpen ? 'max-h-full' : 'max-h-0'}`}>
                <div className="flex justify-end items-center mb-4">
                  <button
                      onClick={handleToggleAllDrills}
                      className="text-sm font-semibold text-[#58A6FF] hover:text-blue-400 transition-colors"
                  >
                      {localSettings.focusArea.length === ALL_DRILLS.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-4">
                    {DRILL_CATEGORIES.map(category => {
                      const isCategoryOpen = openCategories.has(category);
                      const categoryDrills = ALL_DRILLS.filter(d => d.category === category);
                      const selectedInCategory = localSettings.focusArea.filter(id => categoryDrills.some(d => d.id === id)).length;
                      const areAllInCategorySelected = selectedInCategory === categoryDrills.length;
                      
                      return (
                        <div key={category} className="bg-[#2d2d2d]/50 rounded-lg">
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex justify-between items-center p-4"
                          >
                             <div className="flex items-center gap-4">
                               <h4 className="font-semibold text-gray-200 text-base lg:text-lg">{category}</h4>
                               <span className="text-xs font-mono bg-gray-700/60 text-gray-400 px-2 py-1 rounded-md">{selectedInCategory} / {categoryDrills.length}</span>
                             </div>
                             <div className="flex items-center gap-4">
                                <button
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleCategorySelectToggle(category);
                                  }}
                                  className="text-xs font-semibold text-[#58A6FF]/80 hover:text-[#58A6FF] transition-colors"
                                >
                                  {areAllInCategorySelected ? 'Deselect All' : 'Select All'}
                                </button>
                               <AccordionIcon isOpen={isCategoryOpen} />
                             </div>
                          </button>
                          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCategoryOpen ? 'max-h-96' : 'max-h-0'}`}>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 p-4 border-t border-gray-700/50">
                                {categoryDrills.map(drill => (
                                  <label key={drill.id} className="flex items-center space-x-3 cursor-pointer group p-1 rounded-md hover:bg-gray-700/40">
                                    <div className="relative">
                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={localSettings.focusArea.includes(drill.id)}
                                        onChange={() => handleDrillToggle(drill.id)}
                                      />
                                      <div className="w-5 h-5 bg-gray-700 rounded transition-colors border-2 border-gray-600 group-hover:border-[#58A6FF]"></div>
                                      {localSettings.focusArea.includes(drill.id) && (
                                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center bg-[#58A6FF] rounded">
                                            <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                         </div>
                                      )}
                                    </div>
                                    <span className="text-gray-300 group-hover:text-white transition-colors text-base">{drill.name}</span>
                                  </label>
                                ))}
                              </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
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
                {hasChanges ? 'Save Changes' : 'Saved'}
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
            {sessionHistory.slice().reverse().map((session) => {
              const isoString = session.startTime.toISOString();
              const isOpen = openSessions.has(isoString);
              const drillName = session.drill === 'all' 
                ? 'Flow Drill' 
                : session.drill.replace(/-/g, ' ');

              return (
              <li 
                key={isoString} 
                className="bg-[#2d2d2d] rounded-lg p-4 lg:p-5 transition-all duration-300"
              >
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSession(isoString)}
                >
                  <div className="flex items-center gap-4">
                     <div className="flex-shrink-0">
                        <p className="text-[#F0F6FC] font-medium text-base lg:text-lg">
                          {session.startTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-gray-400 text-sm lg:text-base">
                          {session.startTime.toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="hidden sm:inline-block text-gray-500 font-semibold uppercase text-sm bg-gray-700/50 px-3 py-1 rounded-md">
                        {drillName}
                      </span>
                   </div>
                  <div className="flex items-center gap-4">
                    <p className="text-[#58A6FF] text-xl lg:text-2xl font-semibold">
                      {Math.round(session.duration)}s
                    </p>
                    <AccordionIcon isOpen={isOpen} />
                  </div>
                </div>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 mt-4 pt-4 border-t border-gray-700' : 'max-h-0'}`}>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                         <h4 className="text-base font-semibold text-gray-300 mb-2">Average KPIs</h4>
                         <dl className="space-y-1 text-sm">
                            <div className="flex justify-between"><dt className="text-gray-400">Posture H:</dt><dd className="font-mono text-gray-200">{session.kpiAverages.postureHeight?.toFixed(1) || 'N/A'}</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-400">Base W:</dt><dd className="font-mono text-gray-200">{session.kpiAverages.baseWidth?.toFixed(1) || 'N/A'}</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-400">Hip H:</dt><dd className="font-mono text-gray-200">{session.kpiAverages.hipHeight?.toFixed(1) || 'N/A'}</dd></div>
                         </dl>
                      </div>
                      <div>
                         <h4 className="text-base font-semibold text-gray-300 mb-2">AI Feedback Log</h4>
                         {session.feedbackLog.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                               {session.feedbackLog.map((fb, i) => <li key={i} className="text-gray-300">{fb}</li>)}
                            </ul>
                         ) : (
                            <p className="text-sm text-gray-500">No specific feedback was logged.</p>
                         )}
                      </div>
                   </div>
                </div>
              </li>
            )})}
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