import React from 'react';
import { AdvancedKpiType } from '../types';

interface KpiPanelProps {
  kpis: AdvancedKpiType;
  // The layout prop is no longer needed as we've unified the design.
  // layout?: 'horizontal' | 'vertical';
}

const KpiCard = ({ label, value, unit = '' }: { label: string, value: number | null, unit?: string }) => {
    const displayValue = value !== null ? Math.round(value) : '--';
    const hasValue = value !== null;

    return (
        <div className="bg-gray-800/40 p-3 rounded-lg text-center flex-shrink-0">
            <p className="text-gray-300 text-xs font-medium whitespace-nowrap">{label}</p>
            <p className="text-white text-lg font-bold">
                {displayValue}
                {unit && hasValue ? <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span> : ''}
            </p>
        </div>
    );
};

// The component has been simplified to use one single, comprehensive layout.
export default function KpiPanel({ kpis }: KpiPanelProps) {
    return (
        <div className="p-1 lg:p-0 h-full flex flex-col">
            <h3 className="hidden lg:block text-gray-400 font-semibold mb-2 px-1 text-base flex-shrink-0">Advanced KPIs</h3>
            {/* 
              This is now the single source of truth for displaying KPIs. 
              It's a scrollable, 2-column grid that shows all 14 metrics.
            */}
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