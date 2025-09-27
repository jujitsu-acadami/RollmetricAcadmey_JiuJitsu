import React from 'react';
import { Page, Session } from '../types';
import { GlowingCircle } from '../assets/GlowingCircle';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  sessionHistory: Session[];
}

export default function HomePage({ onNavigate, sessionHistory }: HomePageProps) {
  return (
    <div className="w-full flex-grow flex flex-col justify-between items-center text-center py-8">
      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-grow">
          <GlowingCircle />
          <h1 className="text-4xl sm:text-5xl font-bold text-white mt-8 tracking-tight">
              Start Your Session
          </h1>

          <div className="mt-8 space-y-4 w-full max-w-xs">
              <button 
                  onClick={() => onNavigate('drill')} 
                  className="w-full bg-yellow-500 text-black py-3 rounded-lg font-bold text-lg hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/20"
              >
                  Start Drill
              </button>
              <button 
                  onClick={() => onNavigate('account')}
                  className="w-full bg-[#21262D] text-gray-300 py-3 rounded-lg font-semibold text-lg hover:bg-[#30363D] transition-colors border border-gray-700"
              >
                  View Past Sessions
              </button>
              <button 
                  onClick={() => onNavigate('account')}
                  className="w-full bg-[#21262D] text-gray-300 py-3 rounded-lg font-semibold text-lg hover:bg-[#30363D] transition-colors border border-gray-700"
              >
                  Account
              </button>
          </div>
      </div>

      {/* Detailed Insights Footer */}
      <div className="w-full max-w-2xl mt-16">
        <div className="bg-[#161B22] border border-gray-800 rounded-lg p-4">
          <h2 className="text-white font-semibold text-base">Detailed Insights</h2>
          <p className="text-gray-400 mt-1 text-sm">
            {sessionHistory.length === 0 
              ? "No sessions yet. Start your first drill to unlock detailed insights tailored to your movement."
              : `You have completed ${sessionHistory.length} session(s). Check the Account page for details.`}
          </p>
        </div>
      </div>
    </div>
  );
}