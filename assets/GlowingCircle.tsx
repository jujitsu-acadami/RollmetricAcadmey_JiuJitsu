import React from 'react';
import { LogoImage } from './logo.png';

export const GlowingCircle = () => {
    return (
        <div className="relative w-32 h-32">
            <div className="absolute inset-0 bg-dd-accent rounded-full blur-2xl opacity-20"></div>
            <div className="relative w-full h-full rounded-full border-2 border-dd-border bg-dd-surface/50 p-4 overflow-hidden">
                <LogoImage />
                <img src={LogoImage} alt="BJJ Logo" className="w-full h-full object-contain" />
            </div>
        </div>
    );
};