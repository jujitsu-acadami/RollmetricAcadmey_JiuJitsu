import React from 'react';

interface KpiPanelProps {
  kpis: {
    postureHeight: number | null;
    baseWidth: number | null;
    hipHeight: number | null;
  };
}

const KpiCard = ({ label, value }: { label: string, value: number | null }) => {
    const displayValue = value !== null ? Math.round(value) : '--';
    return (
        <div className="bg-transparent lg:bg-[#2d2d2d] p-1 rounded-lg text-center flex-1 lg:p-4">
            <p className="text-gray-200 lg:text-gray-400 text-xs font-medium sm:text-sm">{label}</p>
            <p className="text-white text-lg font-semibold sm:text-2xl">
                {displayValue}
            </p>
        </div>
    );
};


export default function KpiPanel({ kpis }: KpiPanelProps) {
  return (
    <div className="p-1 lg:p-0 lg:mt-0">
        <h3 className="hidden lg:block text-gray-400 font-semibold mb-2 px-1 text-sm lg:text-base">Live KPIs</h3>
        <div className="grid grid-cols-3 gap-1 sm:gap-3">
            <KpiCard label="Posture H" value={kpis.postureHeight} />
            <KpiCard label="Base W" value={kpis.baseWidth} />
            <KpiCard label="Hip H" value={kpis.hipHeight} />
        </div>
    </div>
  );
}