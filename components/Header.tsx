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
    `block sm:inline-block px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === page ? 'text-[#58A6FF]' : 'text-gray-400 hover:text-[#F0F6FC]'}`;
  
  const handleNavClick = (page: Page) => {
    onNavigate(page);
    setIsMenuOpen(false);
  }

  return (
    <header className="w-full bg-[#0D1117] border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('home')}>
              <JjIcon />
              <span className="text-[#F0F6FC] text-lg font-semibold tracking-wider">JIU-JITSU TRAINING</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <button onClick={() => handleNavClick('home')} className={linkClasses('home')}>Home</button>
                <button onClick={() => handleNavClick('drill')} className={linkClasses('drill')}>Drill</button>
                <button onClick={() => handleNavClick('account')} className={linkClasses('account')}>Account</button>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <button className="text-gray-300 hover:text-[#F0F6FC] px-4 py-2 rounded-md text-sm font-medium border border-gray-600 hover:border-gray-400 transition-colors">
              Logout
            </button>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              type="button" 
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-[#F0F6FC] hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
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
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button onClick={() => handleNavClick('home')} className={`${linkClasses('home')} block w-full text-left`}>Home</button>
            <button onClick={() => handleNavClick('drill')} className={`${linkClasses('drill')} block w-full text-left`}>Drill</button>
            <button onClick={() => handleNavClick('account')} className={`${linkClasses('account')} block w-full text-left`}>Account</button>
            <button className="text-gray-300 hover:text-[#F0F6FC] block px-3 py-2 rounded-md text-base font-medium border border-gray-600 w-full text-left mt-2">
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}