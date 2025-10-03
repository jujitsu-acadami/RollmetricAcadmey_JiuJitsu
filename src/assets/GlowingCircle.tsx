import React from 'react';
import { LogoImage } from './LogoImage';

export const GlowingCircle = () => {
    return (
        <div className="relative w-32 h-32">
            <div className="absolute inset-0 bg-dd-accent rounded-full blur-2xl opacity-20"></div>
            <div className="relative w-full h-full rounded-full border-2 border-dd-border bg-dd-surface/50 p-4 overflow-hidden">
                <LogoImage />
            </div>
        </div>
    );
};