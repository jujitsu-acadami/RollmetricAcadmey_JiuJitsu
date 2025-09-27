import React from 'react';

export const GlowingCircle = () => {
    // The logo is now in the root directory, so the direct URL is '/Logo.jpg'.
    const logoUrl = '/Logo.jpg';

    return (
        <div className="relative w-32 h-32">
            <div className="absolute inset-0 bg-[#58A6FF] rounded-full blur-2xl opacity-20"></div>
            <div className="relative w-full h-full rounded-full border-2 border-gray-700 bg-gray-800/20 p-1">
                {/* Using a div with a background-image for maximum compatibility. */}
                <div
                    className="w-full h-full rounded-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${logoUrl})` }}
                    role="img"
                    aria-label="Jiu-Jitsu Academy Logo"
                ></div>
            </div>
        </div>
    );
};
