import React, { useState, useContext, useMemo } from 'react';
import { Session, AppSettings, ModelComplexity, Drill, DrillCategory, SettingsContext, Page, SessionReport, Scorecard } from '../types';
import { ALL_DRILLS, DRILL_CATEGORIES, TRAINING_GOALS } from '../DrillData';

const skillOptions = ['Beginner','Intermediate','Advanced','Competition-Level'];
const voiceTypes = ['Technical Guidance','Positional Prompts','Motivational Coaching'];
const voiceFrequencies = ['Smart Mode (context-aware, AI-driven)','Every 30 Seconds','Only on Position Change','End of Round Only'];
const voiceStyles = ['Neutral Instructor','Encouraging Coach','Quiet Mode'];

interface AccountPageProps {
  sessionHistory: Session[];
  onNavigate: (page: Page) => void;
}

type AccountView = 'main' | 'sessions' | 'model-config' | 'drill-settings';

const PageTitle = ({ title, onBack }: { title: string; onBack?: () => void }) => (
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

// --- HELPER COMPONENTS (Moved up to fix hoisting issues) ---

const ReportMetric = ({ label, value, unit, onInfoClick }: { label: string; value: string | number; unit?: string; onInfoClick: () => void }) => (
  <div className="bg-dd-surfaceAlt/50 p-3 rounded-lg">
    <div className="flex items-center gap-2">
        <p className="text-sm text-dd-muted">{label}</p>
        <button onClick={onInfoClick} className="text-dd-muted hover:text-dd-accent transition-colors" aria-label={`More info about ${label}`}>
            <span className="material-symbols-outlined" style={{fontSize: '16px'}}>info</span>
        </button>
    </div>
    <p className="text-lg font-bold mt-1">
      {value}
      {unit && <span className="text-sm font-normal text-dd-muted ml-1">{unit}</span>}
    </p>
  </div>
);

const ReportSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h4 className="text-base font-semibold">{title}</h4>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{children}</div>
  </div>
);

const ScorecardDisplay = ({ scorecard }: { scorecard: Scorecard }) => (
  <div className="bg-dd-accent/10 border border-dd-accent/30 rounded-lg p-4 text-center">
    <p className="text-sm text-dd-accent font-semibold">Overall Scorecard</p>
    <p className="text-5xl font-extrabold text-white my-2">{scorecard.value.toFixed(0)}</p>
    <p className="text-xs text-dd-muted">
      Weighted blend of Balance ({scorecard.weights.balance * 100}%), 
      Posture ({scorecard.weights.posture * 100}%), 
      Flow ({scorecard.weights.flow * 100}%), 
      Intensity ({scorecard.weights.intensity * 100}%)
    </p>
  </div>
);

const RadioCard = ({ id, name, value, label, checked, onChange }: {id:string, name:string, value:string, label:string, checked:boolean, onChange:(v:string)=>void}) => (
    <div className="relative">
        <input type="radio" id={id} name={name} value={value} checked={checked} onChange={() => onChange(value)} className="peer absolute opacity-0 w-0 h-0" />
        <label htmlFor={id} className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border border-dd-border/60 hover:bg-white/5 peer-checked:border-dd-accent peer-checked:bg-dd-accent/10">
            <div className="flex items-center gap-3"><div className="p-1.5 rounded-lg bg-white/5"><span className="material-symbols-outlined text-dd-muted">military_tech</span></div><span>{label}</span></div>
            <div className={`h-5 w-5 rounded-full border-2 grid place-items-center ${checked ? 'border-dd-accent' : 'border-dd-border'}`}>{checked && <div className="h-2.5 w-2.5 rounded-full bg-dd-accent"></div>}</div>
        </label>
    </div>
);

const RadioGroup = ({ title, options, name, selected, onChange, gridClass = "sm:grid-cols-3" }: { title: string, options: string[], name: string, selected: string, onChange: (v: string) => void, gridClass?: string }) => (
    <div>
        <h3 className="text-sm font-medium text-dd-muted mb-3">{title}</h3>
        <div className={`grid gap-2 ${gridClass}`}>
            {options.map(opt => (
                <div key={opt} className="relative">
                    <input type="radio" id={`${name}-${opt}`} name={name} value={opt} checked={selected === opt} onChange={() => onChange(opt)} className="peer absolute opacity-0 w-0 h-0" />
                    <label htmlFor={`${name}-${opt}`} className="block p-3 text-center rounded-lg border border-dd-border/60 cursor-pointer hover:bg-white/5 peer-checked:border-dd-accent peer-checked:bg-dd-accent/10">{opt}</label>
                </div>
            ))}
        </div>
    </div>
);

const SwitchToggle = ({ label, checked, onChange, small = false }: { label?: string; checked: boolean; onChange: () => void; small?: boolean }) => (
    <div className="flex items-center gap-2">
        {label && <span className="text-xs text-dd-muted">{label}</span>}
        <button onClick={onChange} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-dd-accent' : 'bg-dd-border'}`}>
            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}></span>
        </button>
    </div>
);

// --- New Components for Visual Settings ---

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
                        type="radio"
                        id={`color-${value}`}
                        name="skeleton-color"
                        value={value}
                        checked={selected === value}
                        onChange={() => onChange(value)}
                        className="peer absolute opacity-0 w-0 h-0"
                    />
                    <label
                        htmlFor={`color-${value}`}
                        title={name}
                        className={`block h-8 w-8 rounded-full cursor-pointer ring-2 ring-offset-2 ring-offset-dd-surface transition-all ${selected === value ? 'ring-dd-accent' : 'ring-transparent hover:ring-white/20'}`}
                        style={{ backgroundColor: value }}
                    ></label>
                </div>
            ))}
        </div>
    </div>
);

const thicknessOptions: { label: string; value: 2 | 5 | 8 }[] = [
    { label: 'Thin', value: 2 },
    { label: 'Medium', value: 5 },
    { label: 'Thick', value: 8 },
];

const ThicknessSelector = ({ selected, onChange }: { selected: 2 | 5 | 8, onChange: (v: 2 | 5 | 8) => void }) => (
    <div>
        <h3 className="text-sm font-medium text-dd-muted mb-3">Skeleton Thickness</h3>
        <div className="grid grid-cols-3 gap-2">
            {thicknessOptions.map(({ label, value }) => (
                <div key={value} className="relative">
                    <input
                        type="radio"
                        id={`thickness-${value}`}
                        name="skeleton-thickness"
                        value={value}
                        checked={selected === value}
                        onChange={() => onChange(value)}
                        className="peer absolute opacity-0 w-0 h-0"
                    />
                    <label
                        htmlFor={`thickness-${value}`}
                        className="block p-3 text-center rounded-lg border border-dd-border/60 cursor-pointer hover:bg-white/5 peer-checked:border-dd-accent peer-checked:bg-dd-accent/10"
                    >
                        {label}
                    </label>
                </div>
            ))}
        </div>
    </div>
);


const DrillSettingsPage = ({ onBack }: { onBack: () => void }) => {
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

const ModelConfigPage = ({ onBack }: { onBack: () => void }) => {
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

// --- DICTIONARY FOR METRIC INFO ---
const metricInfo: Record<string, { title: string; tip: string }> = {
    activeTime: { title: "Active Time %", tip: "The percentage of the session you were actively moving." },
    readyStance: { title: "Ready Stance %", tip: "The percentage of your rest time spent in a good, ready stance." },
    avgIntensity: { title: "Average Intensity", tip: "Your overall effort and intensity, averaged for the session (0-100)." },
    peakIntensity: { title: "Peak Intensity", tip: "The most explosive, highest-intensity moment of your session." },
    fatigueTrend: { title: "Fatigue Trend", tip: "Measures how your technique quality (e.g., posture) changed over time. A negative value indicates fatigue." },
    postureQuality: { title: "Posture Quality", tip: "How well your spine and head were aligned. Higher is better." },
    baseStability: { title: "Base Stability", tip: "How stable your center of mass was over your base of support. Higher is better." },
    flowSmoothness: { title: "Flow Smoothness", tip: "How smooth your movements were. Less jerkiness equals a higher score." },
    consistency: { title: "Consistency", tip: "How consistently you repeated the same movement patterns." },
    scrambleCount: { title: "Scramble Count", tip: "The total number of high-acceleration, chaotic movements detected." },
    stabilization: { title: "Stabilization Rate", tip: "The percentage of scrambles after which you quickly returned to a stable posture and base." },
    moveVariety: { title: "Move Variety", tip: "The number of unique movement patterns you performed during the session." },
    stableControl: { title: "Stable Control Time", tip: "The percentage of time spent holding a stable top-control posture (e.g., Mount, Side Control)." },
    guardMobility: { title: "Guard Mobility Index", tip: "A measure of your hip mobility and range of motion during guard-related movements." },
    guardActivity: { title: "Guard Activity Rate", tip: "The percentage of time spent holding a stable, active guard posture." },
};

// --- NEW/UPDATED SESSION REPORT COMPONENTS ---

const InfoModal = ({ content, onClose }: { content: { title: string; tip: string } | null; onClose: () => void; }) => {
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

const SessionReportDisplay = ({ report, focusArea, onInfoClick }: { report: SessionReport; focusArea: Drill[]; onInfoClick: (key: string) => void; }) => {
    const focusAreaSet = new Set(focusArea);
    const hasTopControlFocus = ['mount', 'side-control', 'knee-on-belly', 'north-south'].some(d => focusAreaSet.has(d as Drill));
    const hasGuardFocus = ['attacking-guard', 'defensive-guard', 'half-guard', 'open-guard'].some(d => focusAreaSet.has(d as Drill));

    return (
        <div className="space-y-6">
            <ScorecardDisplay scorecard={report.scorecard} />

            <ReportSection title="Duration">
                <ReportMetric label="Active Time" value={`${report.duration.activeTimePercentage.toFixed(0)}`} unit="%" onInfoClick={() => onInfoClick('activeTime')}/>
                <ReportMetric label="Ready Stance" value={`${report.duration.readyStancePercentage.toFixed(0)}`} unit="%" onInfoClick={() => onInfoClick('readyStance')} />
            </ReportSection>

            <ReportSection title="Effort & Endurance">
                <ReportMetric label="Avg Intensity" value={report.effort.averageIntensity.toFixed(0)} unit="/100" onInfoClick={() => onInfoClick('avgIntensity')} />
                <ReportMetric label="Peak Intensity" value={report.effort.peakIntensity.toFixed(0)} unit="/100" onInfoClick={() => onInfoClick('peakIntensity')} />
                <ReportMetric label="Fatigue Trend" value={`${report.effort.fatigueTrend.toFixed(1)}`} unit="pp/s" onInfoClick={() => onInfoClick('fatigueTrend')} />
            </ReportSection>

            <ReportSection title="Technique Quality">
                <ReportMetric label="Posture Quality" value={report.technique.postureQuality.toFixed(0)} unit="/100" onInfoClick={() => onInfoClick('postureQuality')} />
                <ReportMetric label="Base Stability" value={report.technique.baseStability.toFixed(0)} unit="/100" onInfoClick={() => onInfoClick('baseStability')} />
                <ReportMetric label="Flow Smoothness" value={report.technique.flowSmoothness.toFixed(0)} unit="/100" onInfoClick={() => onInfoClick('flowSmoothness')} />
                <ReportMetric label="Consistency" value={report.technique.consistency.toFixed(0)} unit="/100" onInfoClick={() => onInfoClick('consistency')} />
            </ReportSection>
            
            <ReportSection title="Scramble Stability">
                <ReportMetric label="Scramble Count" value={report.scramble.count} unit="" onInfoClick={() => onInfoClick('scrambleCount')} />
                <ReportMetric label="Stabilization" value={`${report.scramble.stabilizationRate.toFixed(0)}`} unit="%" onInfoClick={() => onInfoClick('stabilization')} />
            </ReportSection>
            
            <ReportSection title="Movement Patterns">
                <ReportMetric label="Move Variety" value={report.patterns.variety} unit="patterns" onInfoClick={() => onInfoClick('moveVariety')} />
            </ReportSection>
            
            {hasTopControlFocus && report.scenario.stableControlTime !== undefined && (
                <ReportSection title="Top-Control Focus">
                    <ReportMetric label="Stable Control" value={report.scenario.stableControlTime.toFixed(0)} unit="% time" onInfoClick={() => onInfoClick('stableControl')} />
                </ReportSection>
            )}

            {hasGuardFocus && report.scenario.guardMobilityIndex !== undefined && (
                 <ReportSection title="Guard Focus">
                    <ReportMetric label="Guard Mobility" value={report.scenario.guardMobilityIndex.toFixed(0)} unit="index" onInfoClick={() => onInfoClick('guardMobility')} />
                    <ReportMetric label="Guard Activity" value={report.scenario.guardActivityRate.toFixed(0)} unit="% time" onInfoClick={() => onInfoClick('guardActivity')} />
                </ReportSection>
            )}
        </div>
    );
};


const SessionCard: React.FC<{session: Session; onInfoClick: (key: string) => void}> = ({ session, onInfoClick }) => {
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

export default function AccountPage({ sessionHistory, onNavigate }: AccountPageProps) {
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
                    <>
                        <PageTitle title="All Sessions" onBack={() => setView('main')} />
                        <div className="rounded-2xl overflow-hidden border border-dd-border/60 divide-y divide-dd-border/50">
                            {sortedHistory.length > 0 ? (
                                sortedHistory.map((s, i) => <SessionCard key={s.startTime.toISOString() + i} session={s} onInfoClick={handleInfoClick} />)
                            ) : (
                                <div className="p-5 text-center text-dd-muted">No sessions recorded yet.</div>
                            )}
                        </div>
                    </>
                );
            case 'main':
            default:
                return (
                    <>
                        <PageTitle title="Account" />
                        <section className="space-y-8 sm:space-y-10">
                            {/* Session History */}
                            <section className="space-y-3 sm:space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg sm:text-xl font-semibold">Session History</h3>
                                    {sortedHistory.length > 3 && (
                                        <button 
                                            onClick={() => setView('sessions')}
                                            className="text-sm font-medium text-dd-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-dd-accent/40 rounded"
                                        >
                                            View All
                                        </button>
                                    )}
                                </div>
                                <div className="rounded-2xl overflow-hidden border border-dd-border/60 divide-y divide-dd-border/50">
                                    {sortedHistory.length > 0 ? (
                                        sortedHistory.slice(0, 3).map((s, i) => <SessionCard key={s.startTime.toISOString() + i} session={s} onInfoClick={handleInfoClick} />)
                                    ) : ( <div className="p-5 text-center text-dd-muted">No sessions recorded yet.</div> )}
                                </div>
                            </section>

                            {/* Settings */}
                            <section className="space-y-3 sm:space-y-4">
                                <h3 className="text-lg sm:text-xl font-semibold">Settings</h3>
                                <div className="rounded-2xl overflow-hidden border border-dd-border/60 divide-y divide-dd-border/50">
                                    <button onClick={() => setView('model-config')} className="w-full flex items-center justify-between px-3 sm:px-4 py-3 hover:bg-white/5 text-left"><div className="flex items-center gap-3"><span className="material-symbols-outlined text-dd-muted">model_training</span><span className="font-medium">Model</span></div><span className="material-symbols-outlined text-dd-muted">chevron_right</span></button>
                                    <button onClick={() => setView('drill-settings')} className="w-full flex items-center justify-between px-3 sm:px-4 py-3 hover:bg-white/5 text-left"><div className="flex items-center gap-3"><span className="material-symbols-outlined text-dd-muted">fitness_center</span><span className="font-medium">Drill Settings</span></div><span className="material-symbols-outlined text-dd-muted">chevron_right</span></button>
                                </div>
                            </section>

                            {/* Profile + Stats */}
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