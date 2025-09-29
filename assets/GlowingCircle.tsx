import React from 'react';
import { LogoImage } from './LogoImage';

export const GlowingCircle = () => {
    return (
        <div className="relative w-32 h-32">
            <div className="absolute inset-0 bg-[#58A6FF] rounded-full blur-2xl opacity-20"></div>
            <div className="relative w-full h-full rounded-full border-2 border-gray-700 bg-gray-800/20 p-4 overflow-hidden">
                {/* 
                  This component now renders an imported SVG logo component.
                  This is a robust way to handle assets in React.
                */}
                <LogoImage />
            </div>
        </div>
    );
};
