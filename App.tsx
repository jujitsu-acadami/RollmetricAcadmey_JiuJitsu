import React, { useState } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import DrillPage from './components/DrillPage';
import AccountPage from './components/AccountPage';
import { Page, Session, AppSettings, SessionState } from './types';

const defaultSettings: AppSettings = {
  modelComplexity: 'lite',
  showSkeleton: true,
  skeletonColor: '#7FFF00', // Lime Green
  skeletonThickness: 5, // Normal
  drillLayout: 'immersive',
  focusArea: ['side-control', 'mount'], // Default focus area
};

const settingsStorageKey = 'bjjAiCoachSettings';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
  const [isDrillSessionActive, setIsDrillSessionActive] = useState(false);
  
  // Initialize settings from localStorage or fall back to defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem(settingsStorageKey);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        // Merge with defaults to handle cases where new settings are added
        return { ...defaultSettings, ...parsedSettings };
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
    }
    return defaultSettings;
  });

  const handleNavigate = (newPage: Page) => {
    setPage(newPage);
  };

  const handleSessionEnd = (sessionData: Session) => {
    setSessionHistory(prev => [...prev, sessionData]);
    setPage('account');
  };

  const handleDrillSessionStateChange = (state: SessionState) => {
    // The header should be hidden when the session is running or paused.
    setIsDrillSessionActive(state === 'running' || state === 'paused');
  };

  // This function now saves settings to localStorage before updating the state
  const handleSettingsChange = (newSettings: AppSettings) => {
    try {
      localStorage.setItem(settingsStorageKey, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error);
    }
    setSettings(newSettings);
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} sessionHistory={sessionHistory} />;
      case 'drill':
        return <DrillPage 
                  onSessionEnd={handleSessionEnd} 
                  settings={settings} 
                  onNavigate={handleNavigate}
                  onSettingsChange={handleSettingsChange}
                  onSessionStateChange={handleDrillSessionStateChange}
                />;
      case 'account':
        return <AccountPage 
                  sessionHistory={sessionHistory} 
                  settings={settings}
                  onSettingsChange={handleSettingsChange} // Pass the new handler
                />;
      default:
        return <HomePage onNavigate={handleNavigate} sessionHistory={sessionHistory} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC] flex flex-col">
      <Header 
        onNavigate={handleNavigate} 
        currentPage={page} 
        isHidden={isDrillSessionActive && page === 'drill'}
      />
      <main className={`flex-grow flex flex-col ${page === 'drill' ? '' : 'items-center p-4 sm:p-6 lg:p-8'}`}>
        {renderPage()}
      </main>
    </div>
  );
}