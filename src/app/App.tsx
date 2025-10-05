import React, { useState, useEffect, useContext } from 'react';
import Header from '../components/layout/Header';
import HomePage from '../features/home/HomePage';
import DrillPage from '../features/drill/DrillPage';
import AccountPage from '../features/account/AccountPage';
import LoginPage from '../features/auth/LoginPage';
import { Page, Session, AppSettings, SessionState } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import { AuthContext, AuthProvider } from '../contexts/AuthContext';

const defaultSettings: AppSettings = {
  modelComplexity: 'full',
  showSkeleton: true,
  skeletonColor: '#7FFF00',
  skeletonThickness: 5,
  drillLayout: 'immersive',
  focusArea: ['side-control', 'mount'],
  skillLevel: 'Intermediate',
  voiceCues: {
    enabled: true,
    type: 'Technical Guidance',
    frequency: 'Smart Mode (context-aware, AI-driven)',
    style: 'Neutral Instructor'
  },
  trainingGoals: {},
  selfDefense: false,
};

const settingsStorageKey = 'rollmetrics_settings';
const sessionHistoryStorageKey = 'rollmetrics_sessions';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const authContext = useContext(AuthContext);
  const [page, setPage] = useState<Page>('home');
  const [isDrillSessionActive, setIsDrillSessionActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem(settingsStorageKey);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        return { ...defaultSettings, ...parsedSettings };
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
    }
    return defaultSettings;
  });

  const [sessionHistory, setSessionHistory] = useState<Session[]>(() => {
    try {
      const savedHistory = localStorage.getItem(sessionHistoryStorageKey);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as Session[];
        // Filter out any invalid/null entries before processing
        return parsedHistory.filter(s => s && s.startTime).map(session => ({
          ...session,
          startTime: new Date(session.startTime),
        }));
      }
    } catch (error) {
      console.error("Failed to load session history from localStorage:", error);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(sessionHistoryStorageKey, JSON.stringify(sessionHistory));
    } catch (error) {
      console.error("Failed to save session history to localStorage:", error);
    }
  }, [sessionHistory]);

  const handleNavigate = (newPage: Page) => {
    setPage(newPage);
  };

  const handleSessionEnd = (sessionData: Session) => {
    setSessionHistory(prev => [...prev, sessionData]);
    setToastMessage("Session saved to your Account history!");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDrillSessionStateChange = (state: SessionState) => {
    setIsDrillSessionActive(state === 'running' || state === 'paused');
  };

  const handleSettingsChange = (newSettings: AppSettings) => {
    try {
      localStorage.setItem(settingsStorageKey, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error);
    }
    setSettings(newSettings);
  };

  const handleLoginSuccess = () => {
    setPage('home');
  };

  const handleLogout = () => {
    if (authContext) {
      authContext.logout();
      setPage('home');
      setSessionHistory([]);
    }
  };

  // Show login page if not authenticated
  if (!authContext?.isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }
  
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
        return <AccountPage sessionHistory={sessionHistory} onNavigate={handleNavigate} onLogout={handleLogout} />;
      default:
        return <HomePage onNavigate={handleNavigate} sessionHistory={sessionHistory} />;
    }
  };
  
  return (
    <SettingsContext.Provider value={settingsContextValue}>
      <div className="min-h-screen bg-dd-bg text-dd-text flex flex-col relative">
        <Header 
          onNavigate={handleNavigate} 
          currentPage={page} 
          isHidden={isDrillSessionActive && page === 'drill'}
        />
        <main className={`flex flex-col ${
          page === 'drill' 
          ? 'absolute inset-0 lg:static lg:flex-grow' 
          : 'flex-grow items-center p-3 sm:p-6 lg:p-8'
        }`}>
          {renderPage()}
        </main>

        {toastMessage && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out">
            {toastMessage}
          </div>
        )}
      </div>
    </SettingsContext.Provider>
  );
}