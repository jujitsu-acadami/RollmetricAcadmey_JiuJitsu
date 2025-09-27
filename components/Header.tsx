import React, { useState } from 'react';
import { Page } from '../types';
import { JjIcon } from '../assets/JjIcon';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
}

export default function Header({ onNavigate, currentPage }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const linkClasses = (page: Page) => 
    `px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
      currentPage === page 
      ? 'bg-[#58A6FF]/10 text-[#58A6FF]' 
      : 'text-gray-400 hover:text-[#F0F6FC] hover:bg-gray-800/60'
    }`;
  
  const handleNavClick = (page: Page) => {
    onNavigate(page);
    setIsMenuOpen(false);
  }

  const logoutButtonClasses = "bg-gray-800/50 hover:bg-gray-700/70 text-gray-300 hover:text-[#F0F6FC] px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200";

  return (
    <header className="w-full bg-[#0D1117]/80 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          
          {/* LEFT: LOGO */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer rounded-lg p-2 -ml-2 hover:bg-gray-800/60 transition-colors duration-200" onClick={() => handleNavClick('home')}>
              <JjIcon />
              <span className="hidden sm:block text-[#F0F6FC] text-lg font-semibold tracking-wider">JIU-JITSU TRAINING</span>
            </div>
          </div>

          {/* CENTER: DESKTOP NAVIGATION */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-baseline space-x-2">
              <button onClick={() => handleNavClick('home')} className={linkClasses('home')}>Home</button>
              <button onClick={() => handleNavClick('drill')} className={linkClasses('drill')}>Drill</button>
              <button onClick={() => handleNavClick('account')} className={linkClasses('account')}>Account</button>
            </div>
          </div>

          {/* RIGHT: ACTIONS & MOBILE MENU */}
          <div className="flex items-center">
            {/* DESKTOP LOGOUT */}
            <div className="hidden md:block">
              <button className={logoutButtonClasses}>
                Logout
              </button>
            </div>
            {/* MOBILE MENU BUTTON */}
            <div className="-mr-2 flex md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                type="button" 
                className="bg-gray-800/60 inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-[#F0F6FC] hover:bg-gray-700/70 focus:outline-none focus:ring-2 focus:ring-white"
                aria-controls="mobile-menu" 
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button onClick={() => handleNavClick('home')} className={`block w-full text-left ${linkClasses('home')}`}>Home</button>
            <button onClick={() => handleNavClick('drill')} className={`block w-full text-left ${linkClasses('drill')}`}>Drill</button>
            <button onClick={() => handleNavClick('account')} className={`block w-full text-left ${linkClasses('account')}`}>Account</button>
            <div className="border-t border-gray-700/50 pt-4 mt-4">
              <button className={`block w-full text-center ${logoutButtonClasses}`}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
