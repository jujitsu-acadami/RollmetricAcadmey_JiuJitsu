import React, { useState, useEffect } from 'react';
import { Page } from '../types';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
  isHidden?: boolean;
}

export default function Header({ onNavigate, currentPage, isHidden }: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (drawerOpen) {
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [drawerOpen]);

  const navClass = (page: Page) => {
    return currentPage === page
      ? 'text-dd-accent font-semibold'
      : 'text-dd-muted hover:text-dd-accent';
  };

  const drawerItemClass = (page: Page) => {
    let baseClass = 'w-full px-4 py-3 rounded-xl hover:bg-white/5 flex items-center gap-3 text-left';
    return currentPage === page ? `${baseClass} bg-white/5` : baseClass;
  };

  const handleNav = (page: Page) => {
    onNavigate(page);
    setDrawerOpen(false);
  };

  const headerClasses = `
    sticky top-0 z-40 bg-dd-bg/90 backdrop-blur border-b border-dd-border/60
    transition-transform duration-300 ease-in-out
    ${isHidden ? '-translate-y-full md:translate-y-0' : 'translate-y-0'}
  `;

  return (
    <>
      <header className={headerClasses}>
        <div className="max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-5">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="md:hidden p-2 rounded-lg text-dd-muted hover:bg-white/5 active:bg-white/10" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
                <span className="material-symbols-outlined">menu</span>
              </button>
              <span className="text-lg sm:text-xl font-semibold">Roll Metrics</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <button type="button" onClick={() => handleNav('home')} className={`${navClass('home')} transition-colors`}>Home</button>
              <button type="button" onClick={() => handleNav('drill')} className={`${navClass('drill')} transition-colors`}>Drill</button>
              <button type="button" onClick={() => handleNav('account')} className={`${navClass('account')} transition-colors`}>Account</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[999]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)}></div>
          <aside className="absolute left-0 top-0 h-full w-80 max-w-[88%] bg-dd-bg border-r border-dd-border/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold">Navigate</span>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg text-dd-muted hover:bg-white/5" aria-label="Close navigation">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="mt-2 grid gap-1">
              <button onClick={() => handleNav('home')} className={drawerItemClass('home')}>
                <span className="material-symbols-outlined text-dd-muted">home</span>
                <span>Home</span>
              </button>
              <button onClick={() => handleNav('drill')} className={drawerItemClass('drill')}>
                <span className="material-symbols-outlined text-dd-muted">fitness_center</span>
                <span>Drill</span>
              </button>
              <button onClick={() => handleNav('account')} className={drawerItemClass('account')}>
                <span className="material-symbols-outlined text-dd-muted">person</span>
                <span>Account</span>
              </button>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}