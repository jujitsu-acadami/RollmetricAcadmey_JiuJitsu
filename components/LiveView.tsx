import React from 'react';

interface LiveViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cameraFacingMode: 'user' | 'environment';
}

export default function LiveView({ videoRef, canvasRef, cameraFacingMode }: LiveViewProps) {
  const transformClass = cameraFacingMode === 'user' ? 'transform -scale-x-100' : '';

  return (
    <>
      <video
        ref={videoRef}
        className={`absolute w-full h-full object-cover ${transformClass}`}
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className={`absolute w-full h-full ${transformClass}`}
      />
    </>
  );
}