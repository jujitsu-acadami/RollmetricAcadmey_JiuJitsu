import React, { useState } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import DrillPage from './components/DrillPage';
import AccountPage from './components/AccountPage';
import { Page, Session, AppSettings } from './types';

const defaultSettings: AppSettings = {
  modelComplexity: 'lite',
  showSkeleton: true,
  skeletonColor: '#7FFF00', // Lime Green
  skeletonThickness: 5, // Normal
};

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const handleNavigate = (newPage: Page) => {
    setPage(newPage);
  };

  const handleSessionEnd = (sessionData: Session) => {
    setSessionHistory(prev => [...prev, sessionData]);
    setPage('account');
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} sessionHistory={sessionHistory} />;
      case 'drill':
        return <DrillPage onSessionEnd={handleSessionEnd} settings={settings} />;
      case 'account':
        return <AccountPage 
                  sessionHistory={sessionHistory} 
                  settings={settings}
                  onSettingsChange={setSettings}
                />;
      default:
        return <HomePage onNavigate={handleNavigate} sessionHistory={sessionHistory} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0D1117] text-gray-100 font-sans flex flex-col">
      <Header onNavigate={handleNavigate} currentPage={page} />
      <main className={`flex-grow flex flex-col ${page === 'drill' ? '' : 'items-center p-4 sm:p-6 lg:p-8'}`}>
        {renderPage()}
      </main>
    </div>
  );
}