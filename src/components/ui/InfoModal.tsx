import React from 'react';

export default function InfoModal({ content, onClose }: { content: { title: string; tip: string } | null; onClose: () => void; }) {
    if (!content) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <div className="bg-dd-surface rounded-2xl p-6 w-full max-w-sm border border-dd-border" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-dd-accent">{content.title}</h3>
                <p className="text-dd-text mt-2">{content.tip}</p>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 rounded-lg bg-dd-surfaceAlt text-dd-text font-medium hover:bg-opacity-80">Close</button>
                </div>
            </div>
        </div>
    );
};