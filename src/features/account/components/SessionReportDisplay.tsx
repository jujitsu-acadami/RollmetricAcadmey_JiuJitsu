import React from 'react';
import { SessionReport, Scorecard, Drill } from '../../../types';

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

export default function SessionReportDisplay({ report, focusArea, onInfoClick }: { report: SessionReport; focusArea: Drill[]; onInfoClick: (key: string) => void; }) {
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