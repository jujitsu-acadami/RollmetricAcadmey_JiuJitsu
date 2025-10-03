import React from 'react';
import { AppSettings, Drill, Page } from '../../../types';
import { DrillDefinition } from '../../../config/DrillData';

interface DrillControlsProps {
    layout: 'immersive' | 'dashboard';
    settings: AppSettings;
    onSettingsChange: (settings: AppSettings) => void;
    currentDrill: Drill | 'all';
    setCurrentDrill: (drill: Drill | 'all') => void;
    availableDrills: DrillDefinition[];
    selectedDeviceId: string;
    setSelectedDeviceId: (id: string) => void;
    videoDevices: MediaDeviceInfo[];
    onNavigate: (page: Page) => void;
}

export default function DrillControls({
    layout,
    settings,
    onSettingsChange,
    currentDrill,
    setCurrentDrill,
    availableDrills,
    selectedDeviceId,
    setSelectedDeviceId,
    videoDevices,
    onNavigate,
}: DrillControlsProps) {

    const commonSelectClasses = "w-full bg-dd-surfaceAlt text-dd-text py-3 pl-4 pr-10 rounded-lg font-semibold text-base hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-dd-accent transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed truncate";
    const commonButtonClasses = "bg-dd-surfaceAlt text-dd-text py-3 px-4 rounded-lg font-semibold text-base hover:bg-opacity-80 flex items-center justify-center gap-2";
    const sessionState = 'idle'; // Controls are only enabled in idle state

    const DesktopConfigureButton = ({ onClick }: { onClick: () => void }) => (
        <button onClick={onClick} className={`${commonButtonClasses} w-full`} title="Configure Settings">
            <span className="material-symbols-outlined text-dd-muted">settings</span>
            <span className="truncate">Configure</span>
        </button>
    );

    const LayoutToggleButton = () => {
        const handleLayoutChange = () => {
            const newLayout = settings.drillLayout === 'immersive' ? 'dashboard' : 'immersive';
            onSettingsChange({ ...settings, drillLayout: newLayout });
        };
        return (
            <button
                onClick={handleLayoutChange}
                className={`${commonButtonClasses} w-full`}
                title={`Switch to ${settings.drillLayout === 'immersive' ? 'Dashboard' : 'Immersive'} View`}
            >
                <span className="material-symbols-outlined text-dd-muted">
                    {settings.drillLayout === 'immersive' ? 'dashboard' : 'fullscreen'}
                </span>
                <span className="truncate">
                    {settings.drillLayout === 'immersive' ? 'Dashboard' : 'Immersive'}
                </span>
            </button>
        );
    };

    if (layout === 'immersive') {
        return (
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <select value={currentDrill} onChange={(e) => setCurrentDrill(e.target.value as Drill | 'all')} className={commonSelectClasses} disabled={sessionState !== 'idle' || availableDrills.length === 0}>
                        {availableDrills.length > 1 && <option value="all">ALL (Flow)</option>}
                        {availableDrills.map((drill) => (<option key={drill.id} value={drill.id}>{drill.name}</option>))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none"><span className="material-symbols-outlined text-dd-muted">unfold_more</span></div>
                </div>
                <div className="relative flex-1">
                    <select value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)} className={commonSelectClasses} disabled={sessionState !== 'idle' || videoDevices.length <= 1}>
                        {videoDevices.map((device, index) => (<option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none"><span className="material-symbols-outlined text-dd-muted">unfold_more</span></div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <DesktopConfigureButton onClick={() => onNavigate('account')} />
                    <LayoutToggleButton />
                </div>
            </div>
        );
    }

    return ( // Dashboard layout
        <div className="flex flex-col gap-4">
            <div>
                <label className="text-dd-muted font-semibold mb-2 px-1 text-base block">Drill</label>
                <div className="relative">
                    <select value={currentDrill} onChange={(e) => setCurrentDrill(e.target.value as Drill | 'all')} className={commonSelectClasses} disabled={sessionState !== 'idle' || availableDrills.length === 0}>
                        {availableDrills.length > 1 && <option value="all">ALL (Flow)</option>}
                        {availableDrills.map((drill) => (<option key={drill.id} value={drill.id}>{drill.name}</option>))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none"><span className="material-symbols-outlined text-dd-muted">unfold_more</span></div>
                </div>
            </div>
            <div>
                <label className="text-dd-muted font-semibold mb-2 px-1 text-base block">Camera</label>
                <div className="relative">
                    <select value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)} className={commonSelectClasses} disabled={sessionState !== 'idle' || videoDevices.length <= 1}>
                        {videoDevices.map((device, index) => (<option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none"><span className="material-symbols-outlined text-dd-muted">unfold_more</span></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <DesktopConfigureButton onClick={() => onNavigate('account')} />
                <LayoutToggleButton />
            </div>
        </div>
    );
}