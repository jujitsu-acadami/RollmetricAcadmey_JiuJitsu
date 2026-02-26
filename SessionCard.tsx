import React from 'react';
import { AdvancedKpiType } from '../../types';

interface KpiPanelProps {
  kpis: AdvancedKpiType;
}

const KpiCard = ({ label, value, unit = '' }: { label: string, value: number | null, unit?: string }) => {
    const displayValue = value !== null ? Math.round(value) : '--';
    const hasValue = value !== null;

    return (
        <div className="bg-dd-surface/60 p-3 rounded-lg text-center flex-shrink-0">
            <p className="text-dd-muted text-xs font-medium whitespace-nowrap">{label}</p>
            <p className="text-dd-text text-lg font-bold">
                {displayValue}
                {unit && hasValue ? <span className="text-sm font-normal text-dd-muted ml-1">{unit}</span> : ''}
            </p>
        </div>
    );
};

export default function KpiPanel({ kpis }: KpiPanelProps) {
    return (
        <div className="p-1 lg:p-0 h-full flex flex-col">
            <h3 className="hidden lg:block text-dd-muted font-semibold mb-2 px-1 text-base flex-shrink-0">Advanced KPIs</h3>
            <div className="flex-grow overflow-y-auto grid grid-cols-2 gap-2 pr-1">
                <KpiCard label="Reaction Time" value={kpis.reactionTime} unit="ms" />
                <KpiCard label="Move Success" value={kpis.moveSuccess} unit="%" />
                <KpiCard label="Fast Scrambles" value={kpis.fastScrambles} unit="" />
                <KpiCard label="Intensity" value={kpis.intensityEndurance} unit="%" />
                <KpiCard label="Consistency" value={kpis.consistency} unit="%" />
                <KpiCard label="Move Variety" value={kpis.moveVariety} unit="moves" />
                <KpiCard label="Balance Stability" value={kpis.balanceStability} unit="%" />
                <KpiCard label="Posture Integrity" value={kpis.postureIntegrity} unit="%" />
                <KpiCard label="Explosive Power" value={kpis.explosiveness} unit="%" />
                <KpiCard label="Smooth Flow" value={kpis.flowRhythm} unit="%" />
                <KpiCard label="Reaction Stead." value={kpis.reactionSteadiness} unit="%" />
                <KpiCard label="Ready Stance" value={kpis.readyStanceTime} unit="%" />
                <KpiCard label="Hip Flexibility" value={kpis.hipFlexibility} unit="%" />
                <KpiCard label="Move Accuracy" value={kpis.moveAccuracy} unit="%" />
            </div>
        </div>
    );
}