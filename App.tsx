import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import DrillPage from './components/DrillPage';
import AccountPage from './components/AccountPage';
import { Page, Session, AppSettings, SessionState } from './types';
import { SettingsContext } from './types';

const defaultSettings: AppSettings = {
  modelComplexity: 'lite',
  showSkeleton: true,
  skeletonColor: '#7FFF00', // Lime Green
  skeletonThickness: 5, // Normal
  drillLayout: 'immersive',
  focusArea: ['side-control', 'mount'], // Default focus area
};

const settingsStorageKey = 'bjjAiCoachSettings';
const sessionHistoryStorageKey = 'bjjAiCoachSessionHistory';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [isDrillSessionActive, setIsDrillSessionActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
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

  // Initialize session history from localStorage or fall back to an empty array
  const [sessionHistory, setSessionHistory] = useState<Session[]>(() => {
    try {
      const savedHistory = localStorage.getItem(sessionHistoryStorageKey);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as Session[];
        // Re-hydrate Date objects after parsing from JSON
        return parsedHistory.map(session => ({
          ...session,
          startTime: new Date(session.startTime),
        }));
      }
    } catch (error) {
      console.error("Failed to load session history from localStorage:", error);
    }
    return [];
  });

  // Effect to save session history to localStorage whenever it changes
  useEffect(() => {
    try {
      // We check sessionHistory length to avoid writing an empty array on first load if nothing was there
      if (sessionHistory.length >= 0) { 
        localStorage.setItem(sessionHistoryStorageKey, JSON.stringify(sessionHistory));
      }
    } catch (error) {
      console.error("Failed to save session history to localStorage:", error);
    }
  }, [sessionHistory]);

  const handleNavigate = (newPage: Page) => {
    setPage(newPage);
  };

  const handleSessionEnd = (sessionData: Session) => {
    setSessionHistory(prev => [...prev, sessionData]);
    // Stay on the Drill page and show a confirmation toast
    setToastMessage("Session saved to your Account history!");
    setTimeout(() => setToastMessage(null), 3500);
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
  
  const settingsContextValue = { settings, onSettingsChange: handleSettingsChange };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} sessionHistory={sessionHistory} />;
      case 'drill':
        return <DrillPage 
                  onSessionEnd={handleSessionEnd} 
                  onNavigate={handleNavigate}
                  onSessionStateChange={handleDrillSessionStateChange}
                />;
      case 'account':
        return <AccountPage sessionHistory={sessionHistory} />;
      default:
        return <HomePage onNavigate={handleNavigate} sessionHistory={sessionHistory} />;
    }
  };
  
  return (
    <SettingsContext.Provider value={settingsContextValue}>
      <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC] flex flex-col relative">
        <Header 
          onNavigate={handleNavigate} 
          currentPage={page} 
          isHidden={isDrillSessionActive && page === 'drill'}
        />
        <main className={`flex flex-col ${
          page === 'drill' 
          ? 'absolute inset-0 lg:static lg:flex-grow' 
          : 'flex-grow items-center p-4 sm:p-6 lg:p-8'
        }`}>
          {renderPage()}
        </main>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out">
            {toastMessage}
          </div>
        )}
      </div>
    </SettingsContext.Provider>
  );
}