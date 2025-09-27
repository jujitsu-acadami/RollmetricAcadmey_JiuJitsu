import React from 'react';

export const GlowingCircle = () => (
    <div className="relative w-32 h-32">
        <div className="absolute inset-0 bg-yellow-500 rounded-full blur-2xl opacity-20"></div>
        <div className="relative w-full h-full rounded-full border-2 border-gray-700 bg-gray-800/20 p-1">
            <img 
                src="assets/Logo.jpg"
                alt="Jiu-Jitsu Training Logo"
                className="w-full h-full rounded-full object-cover"
            />
        </div>
    </div>
);