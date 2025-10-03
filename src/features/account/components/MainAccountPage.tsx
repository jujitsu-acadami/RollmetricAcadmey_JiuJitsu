import React from 'react';
import { Session } from '../../../types';
import { AccountView } from '../AccountPage';
import PageTitle from '../../../components/layout/PageTitle';
import SessionCard from './SessionCard';
import ProfileSection from './ProfileSection';

interface MainAccountPageProps {
    sessionHistory: Session[];
    onSetView: (view: AccountView) => void;
    onInfoClick: (metricKey: string) => void;
}

export default function MainAccountPage({ sessionHistory, onSetView, onInfoClick }: MainAccountPageProps) {
    return (
        <>
            <PageTitle title="Account" />
            <section className="space-y-8 sm:space-y-10">
                {/* Session History */}
                <section className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg sm:text-xl font-semibold">Session History</h3>
                        {sessionHistory.length > 3 && (
                            <button 
                                onClick={() => onSetView('sessions')}
                                className="text-sm font-medium text-dd-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-dd-accent/40 rounded"
                            >
                                View All
                            </button>
                        )}
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-dd-border/60 divide-y divide-dd-border/50">
                        {sessionHistory.length > 0 ? (
                            sessionHistory.slice(0, 3).map((s, i) => <SessionCard key={s.startTime.toISOString() + i} session={s} onInfoClick={onInfoClick} />)
                        ) : ( <div className="p-5 text-center text-dd-muted">No sessions recorded yet.</div> )}
                    </div>
                </section>

                {/* Settings */}
                <section className="space-y-3 sm:space-y-4">
                    <h3 className="text-lg sm:text-xl font-semibold">Settings</h3>
                    <div className="rounded-2xl overflow-hidden border border-dd-border/60 divide-y divide-dd-border/50">
                        <button onClick={() => onSetView('model-config')} className="w-full flex items-center justify-between px-3 sm:px-4 py-3 hover:bg-white/5 text-left"><div className="flex items-center gap-3"><span className="material-symbols-outlined text-dd-muted">model_training</span><span className="font-medium">Model</span></div><span className="material-symbols-outlined text-dd-muted">chevron_right</span></button>
                        <button onClick={() => onSetView('drill-settings')} className="w-full flex items-center justify-between px-3 sm:px-4 py-3 hover:bg-white/5 text-left"><div className="flex items-center gap-3"><span className="material-symbols-outlined text-dd-muted">fitness_center</span><span className="font-medium">Drill Settings</span></div><span className="material-symbols-outlined text-dd-muted">chevron_right</span></button>
                    </div>
                </section>

                <ProfileSection sessionHistory={sessionHistory} />

                 {/* Danger Zone */}
                <section>
                    <h3 className="text-lg sm:text-xl font-semibold text-dd-danger mb-3">Danger Zone</h3>
                    <div className="rounded-2xl overflow-hidden border border-red-600/30 divide-y divide-red-600/20 bg-dd-surface/40">
                        <button className="w-full flex items-center justify-between px-3 sm:px-4 py-3 hover:bg-white/5 text-left text-red-400"><div className="flex items-center gap-3"><span className="material-symbols-outlined">logout</span><span className="font-medium">Log out</span></div><span className="material-symbols-outlined">chevron_right</span></button>
                        <button className="w-full flex items-center justify-between px-3 sm:px-4 py-3 hover:bg-white/5 text-left text-red-400"><div className="flex items-center gap-3"><span className="material-symbols-outlined">delete</span><span className="font-medium">Delete Account</span></div><span className="material-symbols-outlined">chevron_right</span></button>
                    </div>
                </section>
            </section>
        </>
    );
}