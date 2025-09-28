import React from 'react';

interface KpiPanelProps {
  kpis: {
    postureHeight: number | null;
    baseWidth: number | null;
    hipHeight: number | null;
    spineAngle: number | null;
    kneeToElbow: number | null;
  };
  layout?: 'horizontal' | 'vertical';
}

const KpiCard = ({ label, value, unit = '', isCompact = false, dynamicFontSizeClass = 'text-xs' }: { label: string, value: number | null, unit?: string, isCompact?: boolean, dynamicFontSizeClass?: string }) => {
    const displayValue = value !== null ? Math.round(value) : '--';

    const containerClasses = isCompact 
      ? "p-2 text-center flex-1" // Removed background for boxless design
      : "bg-transparent lg:bg-[#2d2d2d] p-1 rounded-lg text-center flex-1 lg:p-4";

    const labelClasses = isCompact
      ? `text-gray-300 font-medium whitespace-nowrap ${dynamicFontSizeClass}`
      : "text-gray-300 text-sm font-medium";
    
    const valueClasses = isCompact
      ? "text-white text-lg font-bold"
      : "text-white text-xl font-bold sm:text-3xl";

    return (
        <div className={containerClasses}>
            <p className={labelClasses}>{label}</p>
            <p className={valueClasses}>
                {displayValue}{unit && displayValue !== '--' ? unit : ''}
            </p>
        </div>
    );
};


export default function KpiPanel({ kpis, layout = 'horizontal' }: KpiPanelProps) {
  const isVerticalCompact = layout === 'vertical';
  const numKpis = Object.keys(kpis).length;

  // Dynamically adjust font size for compact vertical layout
  const dynamicFontSizeClass = numKpis > 4 ? 'text-[11px]' : 'text-xs';

  const containerClasses = layout === 'horizontal' 
    ? "grid grid-cols-5 gap-1 sm:gap-3"
    : "grid grid-cols-2 gap-2";
    
  return (
    <div className="p-1 lg:p-0 lg:mt-0 h-full">
        <h3 className="hidden lg:block text-gray-400 font-semibold mb-2 px-1 text-base">Live KPIs</h3>
        <div className={`${containerClasses} h-full`}>
            <KpiCard label="Posture H" value={kpis.postureHeight} isCompact={isVerticalCompact} dynamicFontSizeClass={dynamicFontSizeClass} />
            <KpiCard label="Base W" value={kpis.baseWidth} isCompact={isVerticalCompact} dynamicFontSizeClass={dynamicFontSizeClass} />
            <KpiCard label="Hip H" value={kpis.hipHeight} isCompact={isVerticalCompact} dynamicFontSizeClass={dynamicFontSizeClass} />
            <KpiCard label="Spine Angle" value={kpis.spineAngle} unit="°" isCompact={isVerticalCompact} dynamicFontSizeClass={dynamicFontSizeClass} />
            <KpiCard label="Knee-Elbow" value={kpis.kneeToElbow} isCompact={isVerticalCompact} dynamicFontSizeClass={dynamicFontSizeClass} />
        </div>
    </div>
  );
}