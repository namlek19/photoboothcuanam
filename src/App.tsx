import React, { useState } from 'react';
import { AppMode } from './types/photobooth';
import { useCameraStream } from './hooks/useCameraStream';
import { OceanBubbleBackground } from './components/OceanBubbleBackground';
import { MirrorView } from './components/MirrorView';
import { BoothView } from './components/BoothView';

export const App: React.FC = () => {
  // Default mode on entry is pure Mirror Mode (Flow 1)
  const [mode, setMode] = useState<AppMode>('mirror');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const camera = useCameraStream();

  const switchModeSmoothly = (targetMode: AppMode) => {
    if (targetMode === mode) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setMode(targetMode);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 60);
    }, 200);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-[#000080]">
      {/* Minimalist Ocean Bubble Floating Background */}
      <OceanBubbleBackground />

      {/* Smooth Mode Transition Wrapper */}
      <div
        className={`relative z-10 transition-all duration-300 ${
          isTransitioning
            ? 'opacity-0 scale-[0.985]'
            : 'opacity-100 scale-100'
        }`}
      >
        {mode === 'mirror' ? (
          <MirrorView
            camera={camera}
            onEnterBoothMode={() => switchModeSmoothly('booth')}
          />
        ) : (
          <BoothView
            camera={camera}
            onBackToMirror={() => switchModeSmoothly('mirror')}
          />
        )}
      </div>
    </div>
  );
};

export default App;

