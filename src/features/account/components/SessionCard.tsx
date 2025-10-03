import React, { useState } from 'react';
import { Session } from '../../../types';
import { ALL_DRILLS } from '../../../config/DrillData';
import SessionReportDisplay from './SessionReportDisplay';

export default function SessionCard({ session, onInfoClick }: { session: Session; onInfoClick: (key: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const drillName = session.drill === 'all' ? 'All (Flow)' : ALL_DRILLS.find(d => d.id === session.drill)?.name || 'Unknown Drill';
    
    if (!session.report) {
      return (
         <div className="p-4 text-dd-muted text-sm">
           Report data is missing for this session.
         </div>
      );
    }
    
    return (
        <div className="group">
            <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-between px-3 sm:px-4 py-3 hover:bg-white/5 text-left ${isOpen ? 'bg-dd-surface/60' : ''}`}>
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 rounded-lg bg-white/5"><span className="material-symbols-outlined text-dd-accent">history</span></div>
                    <div><p className="font-medium">{drillName}</p><p className="text-sm text-dd-muted">{session.startTime.toLocaleDateString()} &bull; {Math.round(session.duration / 60)} min</p></div>
                </div>
                <span className={`material-symbols-outlined text-dd-muted transition-transform ${isOpen ? 'rotate-90' : ''}`}>chevron_right</span>
            </button>
            {isOpen && (
                <div className="px-3 sm:px-4 pb-4">
                    <div className="border-t border-dd-border/50 pt-4">
                       <SessionReportDisplay report={session.report} focusArea={session.focusArea} onInfoClick={onInfoClick} />
                    </div>
                </div>
            )}
        </div>
    );
};