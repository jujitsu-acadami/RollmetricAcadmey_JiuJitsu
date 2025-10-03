import React from 'react';
import { Session } from '../../../types';

interface ProfileSectionProps {
    sessionHistory: Session[];
}

export default function ProfileSection({ sessionHistory }: ProfileSectionProps) {
    return (
        <section className="rounded-2xl border border-dd-border/60 p-5 sm:p-6 bg-dd-surface/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-dd-surface grid place-items-center text-xl sm:text-2xl font-bold">A</div>
                    <div><h2 className="text-xl sm:text-2xl font-bold">Alex Smith</h2><p className="text-dd-accent mt-1 font-medium">White Belt, 2 Stripes</p></div>
                </div>
            </div>
            <div className="mt-6 grid grid-cols-2 text-center divide-x divide-dd-border/50">
                <div className="px-2"><p className="text-2xl sm:text-3xl font-extrabold">{sessionHistory.length}</p><p className="text-xs sm:text-sm text-dd-muted">Sessions</p></div>
                <div className="px-2"><p className="text-2xl sm:text-3xl font-extrabold">{Math.round(sessionHistory.reduce((sum, s) => sum + s.duration, 0) / 3600)}</p><p className="text-xs sm:text-sm text-dd-muted">Hours</p></div>
            </div>
        </section>
    );
}