import React, { useState, useEffect, useContext } from 'react';
import { Session, AppSettings, ModelComplexity, Drill, DrillCategory, SettingsContext, AdvancedKpiType } from '../types';
import { ALL_DRILLS, DRILL_CATEGORIES } from '../DrillData';

interface AccountPageProps {
  sessionHistory: Session[];
}

const complexityOptions: { id: ModelComplexity; label:string }[] = [
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

const KpiDisplay = ({ label, value, unit = '' }: { label: string; value: number | null; unit?: string }) => {
    const displayValue = value !== null ? value.toFixed(0) : '--';
    const hasValue = value !== null;
    return (
        <div className="flex flex-col items-center justify-center bg-[#21262D] p-3 rounded-lg text-center">
            <p className="text-sm text-gray-400 whitespace-nowrap">{label}</p>
            <p className="text-xl font-bold text-white">
                {displayValue}
                {hasValue && unit && <span className="text-xs font-normal text-gray-400 ml-1">{unit}</span>}
            </p>
        </div>
    );
};

interface SessionCardProps {
    session: Session;
}

const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const { startTime, duration, drill, kpiAverages, feedbackLog } = session;
    const drillName = drill === 'all' ? 'All (Flow)' : ALL_DRILLS.find(d => d.id === drill)?.name || 'Unknown Drill';

    return (
        <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-white">{drillName}</h3>
                    <p className="text-gray-400 text-sm">
                        {startTime.toLocaleString()} &bull; {Math.round(duration / 60)} min
                    </p>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-7 gap-3">
                <KpiDisplay label="Reaction Time" value={kpiAverages.reactionTime} unit="ms" />
                <KpiDisplay label="Move Success" value={kpiAverages.moveSuccess} unit="%" />
                <KpiDisplay label="Scrambles" value={kpiAverages.fastScrambles} unit="" />
                <KpiDisplay label="Intensity" value={kpiAverages.intensityEndurance} unit="%" />
                <KpiDisplay label="Consistency" value={kpiAverages.consistency} unit="%" />
                <KpiDisplay label="Variety" value={kpiAverages.moveVariety} unit="moves" />
                <KpiDisplay label="Balance" value={kpiAverages.balanceStability} unit="%" />
                <KpiDisplay label="Posture" value={kpiAverages.postureIntegrity} unit="%" />
                <KpiDisplay label="Power" value={kpiAverages.explosiveness} unit="%" />
                <KpiDisplay label="Flow" value={kpiAverages.flowRhythm} unit="%" />
                <KpiDisplay label="React Stead." value={kpiAverages.reactionSteadiness} unit="%" />
                <KpiDisplay label="Stance Time" value={kpiAverages.readyStanceTime} unit="%" />
                <KpiDisplay label="Hip Flex" value={kpiAverages.hipFlexibility} unit="%" />
                <KpiDisplay label="Accuracy" value={kpiAverages.moveAccuracy} unit="%" />
            </div>
            
            {feedbackLog && feedbackLog.length > 0 && (
                <div className="mt-4">
                    <button onClick={() => setIsFeedbackOpen(!isFeedbackOpen)} className="w-full flex justify-between items-center text-left text-gray-300 hover:text-white py-2">
                        <span className="font-semibold">View AI Feedback Log ({feedbackLog.length})</span>
                        <AccordionIcon isOpen={isFeedbackOpen} />
                    </button>
                    {isFeedbackOpen && (
                        <div className="mt-2 bg-gray-800/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                            <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                                {feedbackLog.map((log, index) => <li key={index}>{log}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SettingsDrillSelector = ({ selectedDrills, onSelectionChange }: { selectedDrills: Drill[]; onSelectionChange: (drills: Drill[]) => void; }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const handleToggle = (drillId: Drill) => {
        const newSelection = new Set(selectedDrills);
        if (newSelection.has(drillId)) {
            newSelection.delete(drillId);
        } else {
            newSelection.add(drillId);
        }
        onSelectionChange(Array.from(newSelection));
    };
    
    const handleSelectAll = (category?: DrillCategory) => {
        const drillsToSelect = category ? ALL_DRILLS.filter(d => d.category === category) : ALL_DRILLS;
        const drillIds = drillsToSelect.map(d => d.id);
        const newSelection = new Set([...selectedDrills, ...drillIds]);
        onSelectionChange(Array.from(newSelection));
    };

    const handleDeselectAll = (category?: DrillCategory) => {
        if (category) {
            const drillsInCategory = ALL_DRILLS.filter(d => d.category === category).map(d => d.id);
            const newSelection = selectedDrills.filter(d => !drillsInCategory.includes(d));
            onSelectionChange(newSelection);
        } else {
            onSelectionChange([]);
        }
    };

    return (
        <div>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center bg-[#21262D] px-4 py-3 rounded-lg">
                <span className="text-white font-semibold">Select Focus Area ({selectedDrills.length} selected)</span>
                <AccordionIcon isOpen={isOpen} />
            </button>
            {isOpen && (
                <div className="bg-[#161B22] border border-gray-800 rounded-lg p-4 mt-2">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => handleSelectAll()} className="text-sm text-blue-400 hover:text-blue-300 font-semibold">Select All</button>
                        <button onClick={() => handleDeselectAll()} className="text-sm text-gray-400 hover:text-gray-300 font-semibold">Deselect All</button>
                    </div>
                    {DRILL_CATEGORIES.map(category => (
                        <div key={category} className="mb-4">
                            <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-1">
                                <h4 className="font-bold text-lg text-white">{category}</h4>
                                <div className="space-x-3">
                                  <button onClick={() => handleSelectAll(category)} className="text-xs text-blue-400 hover:text-blue-300">All</button>
                                  <button onClick={() => handleDeselectAll(category)} className="text-xs text-gray-400 hover:text-gray-300">None</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {ALL_DRILLS.filter(d => d.category === category).map(drill => (
                                    <label key={drill.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-700/50">
                                        <input
                                            type="checkbox"
                                            checked={selectedDrills.includes(drill.id)}
                                            onChange={() => handleToggle(drill.id)}
                                            className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-300">{drill.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const SettingsSection = ({ settings, onSettingsChange }: { settings: AppSettings, onSettingsChange: (s: AppSettings) => void; }) => {
    
    const handleDrillSelectionChange = (newDrills: Drill[]) => {
        onSettingsChange({ ...settings, focusArea: newDrills });
    };

    return (
        <div className="space-y-6">
            <SettingsDrillSelector selectedDrills={settings.focusArea} onSelectionChange={handleDrillSelectionChange} />
            
            <div>
              <label className="text-gray-300 font-semibold block mb-2">AI Model Complexity</label>
              <div className="flex bg-[#21262D] rounded-lg p-1">
                {complexityOptions.map(({ id, label }) => (
                  <button key={id} onClick={() => onSettingsChange({ ...settings, modelComplexity: id })} className={`flex-1 py-2 rounded-md font-semibold transition-colors text-sm ${settings.modelComplexity === id ? 'bg-[#58A6FF] text-black' : 'text-gray-300 hover:bg-gray-700/50'}`}>{label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-2">Skeleton Color</label>
              <div className="flex bg-[#21262D] rounded-lg p-1 space-x-1">
                {colorOptions.map(({ id, label }) => (
                  <button key={id} onClick={() => onSettingsChange({ ...settings, skeletonColor: id })} className={`flex-1 py-2 rounded-md font-semibold text-sm flex items-center justify-center gap-2 border-2 ${settings.skeletonColor === id ? 'border-white' : 'border-transparent'}`} title={label}>
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: id }}></span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-2">Skeleton Thickness</label>
              <div className="flex bg-[#21262D] rounded-lg p-1">
                {thicknessOptions.map(({ id, label }) => (
                  <button key={id} onClick={() => onSettingsChange({ ...settings, skeletonThickness: id as 2 | 5 | 8 })} className={`flex-1 py-2 rounded-md font-semibold transition-colors text-sm ${settings.skeletonThickness === id ? 'bg-[#58A6FF] text-black' : 'text-gray-300 hover:bg-gray-700/50'}`}>{label}</button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center bg-[#21262D] p-3 rounded-lg">
                <span className="text-gray-300 font-semibold">Show Skeleton</span>
                <button
                  onClick={() => onSettingsChange({ ...settings, showSkeleton: !settings.showSkeleton })}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${settings.showSkeleton ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.showSkeleton ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </div>
    );
};


export default function AccountPage({ sessionHistory }: AccountPageProps) {
  const settingsContext = useContext(SettingsContext);
  const [activeTab, setActiveTab] = useState('history');

  const userProfile = {
    name: 'Alex Mercer',
    email: 'alex.mercer@bjjflow.io',
    age: 28,
  };

  if (!settingsContext) {
    return <div>Loading settings...</div>;
  }
  const { settings, onSettingsChange } = settingsContext;
  
  const sortedHistory = [...sessionHistory].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl sm:text-5xl font-bold text-white mb-8">Account</h1>

      <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-8 flex items-center gap-6">
        <div className="w-20 h-20 bg-[#58A6FF] rounded-full flex-shrink-0 flex items-center justify-center">
            <span className="text-black text-4xl font-bold">{userProfile.name.charAt(0)}</span>
        </div>
        <div>
            <h2 className="text-3xl font-bold text-white">{userProfile.name}</h2>
            <p className="text-gray-400 mt-1">{userProfile.email} &bull; {userProfile.age} years old</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex border-b border-gray-800">
          <button onClick={() => setActiveTab('history')} className={`px-6 py-3 font-semibold text-lg transition-colors ${activeTab === 'history' ? 'text-[#58A6FF] border-b-2 border-[#58A6FF]' : 'text-gray-400 hover:text-white'}`}>
            Session History
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 font-semibold text-lg transition-colors ${activeTab === 'settings' ? 'text-[#58A6FF] border-b-2 border-[#58A6FF]' : 'text-gray-400 hover:text-white'}`}>
            Settings
          </button>
        </div>
      </div>

      {activeTab === 'history' && (
        <div className="space-y-6">
          {sortedHistory.length > 0 ? (
            sortedHistory.map((session, index) => <SessionCard key={session.startTime.toISOString() + index} session={session} />)
          ) : (
            <div className="text-center py-12 bg-[#161B22] border border-gray-800 rounded-lg">
              <p className="text-gray-400 text-lg">No session history yet.</p>
              <p className="text-gray-500 mt-1">Complete a drill to see your stats here.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Personalization</h2>
            <SettingsSection settings={settings} onSettingsChange={onSettingsChange} />
        </div>
      )}
    </div>
  );
}