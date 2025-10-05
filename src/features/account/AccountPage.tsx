import React, { useState } from 'react';
import { Session, Page } from '../../types';
import DrillSettingsPage from './components/DrillSettingsPage';
import ModelConfigPage from './components/ModelConfigPage';
import SessionHistoryPage from './components/SessionHistoryPage';
import MainAccountPage from './components/MainAccountPage';
import InfoModal from '../../components/ui/InfoModal';
import { metricInfo } from './metricInfo';

interface AccountPageProps {
  sessionHistory: Session[];
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export type AccountView = 'main' | 'sessions' | 'model-config' | 'drill-settings';

export default function AccountPage({ sessionHistory, onNavigate, onLogout }: AccountPageProps) {
    const [view, setView] = useState<AccountView>('main');
    const [infoModalContent, setInfoModalContent] = useState<{ title: string; tip: string } | null>(null);
    const sortedHistory = [...sessionHistory].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    const handleInfoClick = (metricKey: string) => {
        if (metricInfo[metricKey]) {
            setInfoModalContent(metricInfo[metricKey]);
        }
    };

    const mainContent = () => {
        switch (view) {
            case 'model-config':
                return <ModelConfigPage onBack={() => setView('main')} />;
            case 'drill-settings':
                return <DrillSettingsPage onBack={() => setView('main')} />;
            case 'sessions':
                return (
                    <SessionHistoryPage
                        sessions={sortedHistory}
                        onBack={() => setView('main')}
                        onInfoClick={handleInfoClick}
                    />
                );
            case 'main':
            default:
                return (
                    <MainAccountPage
                        sessionHistory={sortedHistory}
                        onSetView={setView}
                        onInfoClick={handleInfoClick}
                        onLogout={onLogout}
                    />
                );
        }
    };
    
    return (
        <>
            <div className="w-full max-w-3xl mx-auto">
                {mainContent()}
            </div>
            <InfoModal 
                content={infoModalContent} 
                onClose={() => setInfoModalContent(null)} 
            />
        </>
    );
}