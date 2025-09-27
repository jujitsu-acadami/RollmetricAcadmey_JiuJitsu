import React from 'react';

interface ControlPanelProps {
  isActive: boolean;
  onToggleSession: () => void;
  onEndSession: () => void;
}

export default function ControlPanel({ isActive, onToggleSession, onEndSession }: ControlPanelProps) {
  return (
    <div className="bg-[#1c1c1c] w-full p-6 rounded-2xl flex flex-col gap-5">
      <div>
        <p className="text-gray-400 text-sm">You're in</p>
        <h2 className="text-white text-4xl font-bold tracking-tighter">
          SIDE CONTROL
        </h2>
      </div>
      
      <div className="bg-[#2d2d2d] rounded-lg p-3.5">
        <p className="text-yellow-400 font-medium">Posture too upright</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <button
          onClick={onToggleSession}
          className="bg-[#2d2d2d] text-white py-3 rounded-lg font-semibold hover:bg-[#3f3f3f] transition-colors"
        >
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={onEndSession}
          className="bg-[#2d2d2d] text-white py-3 rounded-lg font-semibold hover:bg-[#3f3f3f] transition-colors disabled:opacity-50"
          disabled={!isActive}
        >
          End Session
        </button>
      </div>
    </div>
  );
}
