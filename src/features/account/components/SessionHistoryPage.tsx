import React from 'react';
import { Session } from '../../../types';
import PageTitle from '../../../components/layout/PageTitle';
import SessionCard from './SessionCard';

interface SessionHistoryPageProps {
    sessions: Session[];
    onBack: () => void;
    onInfoClick: (metricKey: string) => void;
}

export default function SessionHistoryPage({ sessions, onBack, onInfoClick }: SessionHistoryPageProps) {
    return (
        <>
            <PageTitle title="All Sessions" onBack={onBack} />
            <div className="rounded-2xl overflow-hidden border border-dd-border/60 divide-y divide-dd-border/50">
                {sessions.length > 0 ? (
                    sessions.map((s, i) => <SessionCard key={s.startTime.toISOString() + i} session={s} onInfoClick={onInfoClick} />)
                ) : (
                    <div className="p-5 text-center text-dd-muted">No sessions recorded yet.</div>
                )}
            </div>
        </>
    );
}