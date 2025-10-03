import React, { useState, useContext, useMemo } from 'react';
// FIX: Broke out SettingsContext import to resolve circular dependency.
import { Drill, DrillCategory, AppSettings } from '../../../types';
import { SettingsContext } from '../../../contexts/SettingsContext';
import { ALL_DRILLS, DRILL_CATEGORIES, TRAINING_GOALS } from '../../../config/DrillData';
import PageTitle from '../../../components/layout/PageTitle';
import { RadioGroup, RadioCard } from '../../../components/forms/RadioGroup';
import SwitchToggle from '../../../components/forms/SwitchToggle';

const skillOptions = ['Beginner','Intermediate','Advanced','Competition-Level'];
const voiceTypes = ['Technical Guidance','Positional Prompts','Motivational Coaching'];
const voiceFrequencies = ['Smart Mode (context-aware, AI-driven)','Every 30 Seconds','Only on Position Change','End of Round Only'];
const voiceStyles = ['Neutral Instructor','Encouraging Coach','Quiet Mode'];

const skeletonColorOptions = [
    { name: 'Chartreuse', value: '#7FFF00' },
    { name: 'Yellow', value: '#FFDE59' },
    { name: 'Red', value: '#FF1D58' },
    { name: 'Cyan', value: '#00FFFF' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Azure', value: '#007FFF' },
];

const ColorSelector = ({ selected, onChange }: { selected: string, onChange: (v: string) => void }) => (
    <div>
        <h3 className="text-sm font-medium text-dd-muted mb-3">Skeleton Color</h3>
        <div className="flex items-center gap-3">
            {skeletonColorOptions.map(({ name, value }) => (
                <div key={value} className="relative">
                    <input
                        type="radio" id={`color-${value}`} name="skeleton-color" value={value}
                        checked={selected === value} onChange={() => onChange(value)}
                        className="peer absolute opacity-0 w-0 h-0"
                    />
                    <label
                        htmlFor={`color-${value}`} title={name}
                        className={`block h-8 w-8 rounded-full cursor-pointer ring-2 ring-offset-2 ring-offset-dd-surface transition-all ${selected === value ? 'ring-dd-accent' : 'ring-transparent hover:ring-white/20'}`}
                        style={{ backgroundColor: value }}
                    ></label>
                </div>
            ))}
        </div>
    </div>
);

const thicknessOptions: { label: string; value: 2 | 5 | 8 }[] = [
    { label: 'Thin', value: 2 }, { label: 'Medium', value: 5 }, { label: 'Thick', value: 8 },
];

const ThicknessSelector = ({ selected, onChange }: { selected: 2 | 5 | 8, onChange: (v: 2 | 5 | 8) => void }) => (
    <div>
        <h3 className="text-sm font-medium text-dd-muted mb-3">Skeleton Thickness</h3>
        <div className="grid grid-cols-3 gap-2">
            {thicknessOptions.map(({ label, value }) => (
                <div key={value} className="relative">
                    <input
                        type="radio" id={`thickness-${value}`} name="skeleton-thickness" value={value}
                        checked={selected === value} onChange={() => onChange(value)}
                        className="peer absolute opacity-0 w-0 h-0"
                    />
                    <label
                        htmlFor={`thickness-${value}`}
                        className="block p-3 text-center rounded-lg border border-dd-border/60 cursor-pointer hover:bg-white/5 peer-checked:border-dd-accent peer-checked:bg-dd-accent/10"
                    >{label}</label>
                </div>
            ))}
        </div>
    </div>
);

export default function DrillSettingsPage({ onBack }: { onBack: () => void }) {
    const settingsContext = useContext(SettingsContext);
    if (!settingsContext) return null;
    const { settings, onSettingsChange } = settingsContext;

    const [focusTab, setFocusTab] = useState<DrillCategory>('Attack Positions');

    const handleFocusDrillChange = (drillId: Drill) => {
        const newFocusArea = new Set(settings.focusArea);
        if (newFocusArea.has(drillId)) newFocusArea.delete(drillId);
        else newFocusArea.add(drillId);
        onSettingsChange({ ...settings, focusArea: Array.from(newFocusArea) });
    };

    const isAllFocusSelected = useMemo(() => {
        const drillsInTab = ALL_DRILLS.filter(d => d.category === focusTab);
        return drillsInTab.every(d => settings.focusArea.includes(d.id));
    }, [focusTab, settings.focusArea]);

    const toggleAllFocus = () => {
        const drillsInTab = ALL_DRILLS.filter(d => d.category === focusTab).map(d => d.id);
        const focusAreaSet = new Set(settings.focusArea);
        if (isAllFocusSelected) {
            drillsInTab.forEach(id => focusAreaSet.delete(id));
        } else {
            drillsInTab.forEach(id => focusAreaSet.add(id));
        }
        onSettingsChange({ ...settings, focusArea: Array.from(focusAreaSet) });
    };
    
    const isAllGoalsSelected = useMemo(() => {
        return TRAINING_GOALS.every(g => !!settings.trainingGoals[g]);
    }, [settings.trainingGoals]);

    const toggleAllGoals = () => {
        const to = !isAllGoalsSelected;
        const newGoals = { ...settings.trainingGoals };
        TRAINING_GOALS.forEach(g => newGoals[g] = to);
        onSettingsChange({ ...settings, trainingGoals: newGoals });
    };

    return (
        <>
            <PageTitle title="Drill Settings" onBack={onBack} />
            <section className="space-y-8">
                {/* Skill Level */}
                <div className="bg-dd-surface/40 rounded-2xl overflow-hidden border border-dd-border/60">
                    <div className="px-5 py-3 border-b border-dd-border/60"><h2 className="font-semibold">Skill Level</h2></div>
                    <div className="p-4 grid gap-3">
                        {skillOptions.map(opt => <RadioCard key={opt} id={`skill-${opt}`} name="skill" value={opt} label={opt} checked={settings.skillLevel === opt} onChange={(v) => onSettingsChange({...settings, skillLevel: v})} />)}
                    </div>
                </div>

                {/* Focus Areas */}
                <div className="bg-dd-surface/40 rounded-2xl overflow-hidden border border-dd-border/60">
                    <div className="px-5 py-3 border-b border-dd-border/60 flex items-center justify-between">
                        <h2 className="font-semibold">Focus Areas</h2>
                        <SwitchToggle label="Select All" checked={isAllFocusSelected} onChange={toggleAllFocus} />
                    </div>
                    <div className="p-4">
                        <div className="flex border-b border-dd-border/60 mb-4">
                            {DRILL_CATEGORIES.map(cat => (
                                <button key={cat} onClick={() => setFocusTab(cat)} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${focusTab === cat ? 'border-dd-accent text-dd-accent' : 'border-transparent text-dd-muted hover:text-dd-text'}`}>{cat}</button>
                            ))}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                            {ALL_DRILLS.filter(d => d.category === focusTab).map(drill => (
                                <label key={drill.id} className="flex items-center gap-3 p-3 rounded-lg border border-dd-border/60 hover:bg-white/5 cursor-pointer">
                                    <input type="checkbox" checked={settings.focusArea.includes(drill.id)} onChange={() => handleFocusDrillChange(drill.id)} className="text-dd-accent bg-dd-surface rounded border-dd-border/80 focus:ring-dd-accent focus:ring-offset-dd-surface" />
                                    <span>{drill.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Voice Cues */}
                <div className="bg-dd-surface/40 rounded-2xl overflow-hidden border border-dd-border/60">
                    <div className="px-5 py-3 border-b border-dd-border/60 flex items-center justify-between">
                        <h2 className="font-semibold">Voice Cues</h2>
                        <SwitchToggle label="Enable" checked={settings.voiceCues.enabled} onChange={() => onSettingsChange({...settings, voiceCues: {...settings.voiceCues, enabled: !settings.voiceCues.enabled}})} />
                    </div>
                    <div className={`p-4 transition-opacity ${!settings.voiceCues.enabled && 'opacity-60 pointer-events-none'}`}>
                        <div className="grid gap-5">
                            <RadioGroup title="Cue Type" options={voiceTypes} name="voice-type" selected={settings.voiceCues.type} onChange={v => onSettingsChange({...settings, voiceCues: {...settings.voiceCues, type:v}})} />
                            <RadioGroup title="Frequency" options={voiceFrequencies} name="voice-freq" selected={settings.voiceCues.frequency} onChange={v => onSettingsChange({...settings, voiceCues: {...settings.voiceCues, frequency:v}})} />
                            <RadioGroup title="Voice Style" options={voiceStyles} name="voice-style" selected={settings.voiceCues.style} onChange={v => onSettingsChange({...settings, voiceCues: {...settings.voiceCues, style:v}})} />
                        </div>
                    </div>
                </div>
                
                {/* Visual Settings */}
                <div className="bg-dd-surface/40 rounded-2xl overflow-hidden border border-dd-border/60">
                    <div className="px-5 py-3 border-b border-dd-border/60">
                        <h2 className="font-semibold">Visual Settings</h2>
                    </div>
                    <div className="p-4 space-y-5">
                        <label className="flex items-center justify-between">
                            <span className="font-medium">Show Skeleton</span>
                            <SwitchToggle
                                checked={settings.showSkeleton}
                                onChange={() => onSettingsChange({ ...settings, showSkeleton: !settings.showSkeleton })}
                            />
                        </label>
                        <div className={`transition-opacity ${!settings.showSkeleton && 'opacity-60 pointer-events-none'}`}>
                            <div className="space-y-5">
                                <ThicknessSelector
                                    selected={settings.skeletonThickness}
                                    onChange={(v) => onSettingsChange({ ...settings, skeletonThickness: v })}
                                />
                                <ColorSelector
                                    selected={settings.skeletonColor}
                                    onChange={(v) => onSettingsChange({ ...settings, skeletonColor: v })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Training Goals */}
                <div className="bg-dd-surface/40 rounded-2xl overflow-hidden border border-dd-border/60">
                    <div className="px-5 py-3 border-b border-dd-border/60 flex items-center justify-between">
                        <h2 className="font-semibold">Training Goals</h2>
                        <SwitchToggle label="Select All" checked={isAllGoalsSelected} onChange={toggleAllGoals} />
                    </div>
                    <div className="p-4">
                        <div className="grid sm:grid-cols-2 gap-3">
                            {TRAINING_GOALS.map(goal => (
                                <label key={goal} className="flex items-center gap-3 p-3 rounded-lg border border-dd-border/60 hover:bg-white/5 cursor-pointer">
                                    <input type="checkbox" checked={!!settings.trainingGoals[goal]} onChange={() => onSettingsChange({ ...settings, trainingGoals: {...settings.trainingGoals, [goal]: !settings.trainingGoals[goal] }})} className="text-dd-accent bg-dd-surface rounded border-dd-border/80 focus:ring-dd-accent focus:ring-offset-dd-surface" />
                                    <span>{goal}</span>
                                </label>
                            ))}
                        </div>
                        <div className="mt-3">
                            <label className="flex items-center justify-between p-3 rounded-lg border border-dd-border/60 hover:bg-white/5 cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-dd-muted">shield_person</span>
                                    <span>Self-Defense Fundamentals</span>
                                </div>
                                <SwitchToggle checked={settings.selfDefense} onChange={() => onSettingsChange({ ...settings, selfDefense: !settings.selfDefense })} small />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end"><button onClick={onBack} className="px-5 py-2.5 rounded-lg bg-dd-accent text-dd-bg font-medium hover:opacity-90 active:opacity-80">Save Changes</button></div>
            </section>
        </>
    );
};