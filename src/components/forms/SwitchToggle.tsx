import React from 'react';

export default function SwitchToggle({ label, checked, onChange, small = false }: { label?: string; checked: boolean; onChange: () => void; small?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            {label && <span className="text-xs text-dd-muted">{label}</span>}
            <button onClick={onChange} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-dd-accent' : 'bg-dd-border'}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}></span>
            </button>
        </div>
    );
};