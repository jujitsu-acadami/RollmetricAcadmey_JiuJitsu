import React from 'react';

export default function PageTitle({ title, onBack }: { title: string; onBack?: () => void }) {
    return (
        <div className="mb-6 sm:mb-8">
            {onBack ? (
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-2 rounded-lg text-dd-muted hover:bg-white/5" aria-label="Back">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl sm:text-2xl font-semibold">{title}</h1>
                </div>
            ) : (
                <h1 className="text-xl sm:text-2xl font-semibold">{title}</h1>
            )}
        </div>
    );
}