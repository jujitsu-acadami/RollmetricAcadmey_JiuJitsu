import React from 'react';

// This is a placeholder SVG logo. For a custom image,
// you would replace the content of this component.
export const LogoImage = () => (
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
    aria-label="BJJ AI Coach Logo"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" className="text-dd-accent" style={{ stopColor: 'currentColor' }} />
        <stop offset="100%" className="text-blue-400" style={{ stopColor: 'currentColor' }} />
      </linearGradient>
    </defs>
    <circle
      cx="50"
      cy="50"
      r="45"
      stroke="url(#logoGradient)"
      strokeWidth="5"
      fill="none"
    />
    <circle
      cx="50"
      cy="50"
      r="30"
      stroke="url(#logoGradient)"
      strokeWidth="3"
      fill="none"
      strokeDasharray="5 5"
    />
  </svg>
);