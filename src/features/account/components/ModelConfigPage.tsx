import React, { useContext } from 'react';
// FIX: Broke out SettingsContext import to resolve circular dependency.
import { ModelComplexity } from '../../../types';
import { SettingsContext } from '../../../contexts/SettingsContext';
import PageTitle from '../../../components/layout/PageTitle';

export default function ModelConfigPage({ onBack }: { onBack: () => void }) {
    const settingsContext = useContext(SettingsContext);
    if (!settingsContext) return null;
    const { settings, onSettingsChange } = settingsContext;

    const complexityOptions: { id: ModelComplexity; label:string; desc: string; }[] = [
        { id: 'lite', label: 'Lite', desc: "Fastest, uses less memory" },
        { id: 'full', label: 'Balanced', desc: "Balanced performance" },
        { id: 'heavy', label: 'Heavy', desc: "Most accurate, uses more resources" },
    ];

    return (
        <>
            <PageTitle title="Model Configuration" onBack={onBack} />
            <section className="space-y-6">
                <div className="bg-dd-surface/40 rounded-xl p-4 mb-2 border border-dd-border/60"><p className="text-dd-muted text-sm">Select the model weight that fits your device's capabilities and performance needs.</p></div>
                <div className="grid gap-3">
                    {complexityOptions.map(({ id, label, desc }) => (
                        <div key={id} className="relative">
                            <input type="radio" id={`model-${id}`} name="model" value={id} checked={settings.modelComplexity === id} onChange={() => onSettingsChange({ ...settings, modelComplexity: id })} className="peer absolute opacity-0 w-0 h-0" />
                            <label htmlFor={`model-${id}`} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-dd-border/60 cursor-pointer transition-all hover:bg-white/5 peer-checked:border-dd-accent peer-checked:bg-dd-accent/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/5"><span className="material-symbols-outlined text-dd-accent">model_training</span></div>
                                    <div><p className="font-medium">{label}</p><p className="text-sm text-dd-muted">{desc}</p></div>
                                </div>
                                <div className={`h-5 w-5 rounded-full border-2 grid place-items-center ${settings.modelComplexity === id ? 'border-dd-accent' : 'border-dd-border'}`}><div className={`h-2.5 w-2.5 rounded-full bg-dd-accent ${settings.modelComplexity === id ? 'block' : 'hidden'}`}></div></div>
                            </label>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex justify-end"><button onClick={onBack} className="px-5 py-2.5 rounded-lg bg-dd-accent text-dd-bg font-medium hover:opacity-90 active:opacity-80">Save Changes</button></div>
            </section>
        </>
    );
};