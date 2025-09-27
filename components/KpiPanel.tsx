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
            <p className="text-gray-300 text-sm font-medium">{label}</p>
            <p className="text-white text-xl font-bold sm:text-3xl">
                {displayValue}
            </p>
        </div>
    );
};


export default function KpiPanel({ kpis }: KpiPanelProps) {
  return (
    <div className="p-1 lg:p-0 lg:mt-0">
        <h3 className="hidden lg:block text-gray-400 font-semibold mb-2 px-1 text-base">Live KPIs</h3>
        <div className="grid grid-cols-3 gap-1 sm:gap-3">
            <KpiCard label="Posture H" value={kpis.postureHeight} />
            <KpiCard label="Base W" value={kpis.baseWidth} />
            <KpiCard label="Hip H" value={kpis.hipHeight} />
        </div>
    </div>
  );
}