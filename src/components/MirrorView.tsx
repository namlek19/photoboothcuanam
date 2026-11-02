import React, { useState } from 'react';
import { CloudFog, Camera, RotateCcw, Sparkles } from 'lucide-react';
import { CameraStreamState } from '../hooks/useCameraStream';
import { FogCanvas } from './FogCanvas';

interface MirrorViewProps {
  camera: CameraStreamState;
  onEnterBoothMode: () => void;
}

export const MirrorView: React.FC<MirrorViewProps> = ({
  camera,
  onEnterBoothMode,
}) => {
  const [fogEnabled, setFogEnabled] = useState(false);
  const [fogResetSignal, setFogResetSignal] = useState(0);

  return (
    <div className="relative z-10 flex flex-col items-center justify-between w-full min-h-[calc(100vh-1rem)] px-4 py-4 md:py-6 select-none">
      {/* Minimalist Top Brand Pill (Outside Mirror) */}
      <header className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/65 backdrop-blur-md border border-[#7FFFD4]/80 shadow-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-[#7FFFD4] ring-2 ring-[#4299e1]/40 animate-pulse" />
        <h1 className="text-xs md:text-sm font-bold tracking-wide text-[#000080]">
          Photobooth của Nam
        </h1>
        {fogEnabled && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#7FFFD4]/50 text-[#000080]">
            Quệt lên kính để lau sương ✨
          </span>
        )}
      </header>

      {/* Main Pure Mirror Frame - ZERO buttons inside the mirror surface */}
      <main className="w-full max-w-5xl flex-1 flex items-center justify-center my-3 md:my-4">
        <div
          className="relative w-full h-[68vh] sm:h-[73vh] md:h-[76vh] max-h-[780px] rounded-[2.25rem] md:rounded-[3rem] overflow-hidden shadow-[0_20px_60px_rgba(49,130,206,0.18)] border-[6px] md:border-[8px] border-white/85 ring-2 ring-[#7FFFD4]/70 bg-[#d8f3fa] transition-all duration-500"
        >
          {/* Live Webcam Feed (Mirrored scaleX(-1)) */}
          <video
            ref={camera.videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform -scale-x-100 ${
              camera.hasCamera && !camera.usingSimulatedCamera ? 'block' : 'hidden'
            }`}
          />

          {/* Interactive Simulated Mirror Canvas Fallback (when no physical webcam) */}
          <canvas
            ref={camera.fallbackCanvasRef}
            width={1280}
            height={720}
            className={`w-full h-full object-cover transform -scale-x-100 ${
              !camera.hasCamera || camera.usingSimulatedCamera ? 'block' : 'hidden'
            }`}
          />

          {/* Subtle Glass Reflection Sheen */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 35%, rgba(127,255,212,0.06) 100%)',
            }}
          />

          {/* Interactive Fog & Steam Canvas Overlay (destination-out wiping) */}
          <FogCanvas isActive={fogEnabled} resetSignal={fogResetSignal} />
        </div>
      </main>

      {/* Compact Control Bar Strictly Outside the Mirror */}
      <footer className="flex flex-wrap items-center justify-center gap-3 px-4 py-2.5 rounded-full bg-white/75 backdrop-blur-xl border border-white/90 shadow-[0_10px_30px_rgba(0,0,128,0.08)]">
        {/* Button 1: Fog Effect Toggle */}
        <button
          type="button"
          onClick={() => setFogEnabled((prev) => !prev)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
            fogEnabled
              ? 'bg-[#7FFFD4] text-[#000080] shadow-[0_0_20px_rgba(127,255,212,0.75)] ring-2 ring-[#000080]/20'
              : 'bg-[#ebf8ff] hover:bg-[#7FFFD4]/45 text-[#000080]'
          }`}
        >
          <CloudFog className="w-4 h-4 text-[#000080]" />
          <span>Sương mù kính</span>
        </button>

        {/* Small Re-fog button when Fog is active */}
        {fogEnabled && (
          <button
            type="button"
            onClick={() => setFogResetSignal((n) => n + 1)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold bg-white/90 hover:bg-[#7FFFD4]/40 text-[#000080] border border-[#4299e1]/30 transition-all"
            title="Phủ sương mù lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#3182ce]" />
            <span>Phủ sương lại</span>
          </button>
        )}

        {/* Button 2: Switch to Photobooth Mode */}
        <button
          type="button"
          onClick={onEnterBoothMode}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold bg-[#000080] hover:bg-[#3182ce] text-white shadow-[0_6px_20px_rgba(0,0,128,0.25)] hover:shadow-[0_8px_25px_rgba(49,130,206,0.4)] transition-all duration-200 group"
        >
          <Camera className="w-4 h-4 text-[#7FFFD4] group-hover:scale-110 transition-transform" />
          <span>Chụp Photobooth</span>
          <Sparkles className="w-3.5 h-3.5 text-[#7FFFD4]" />
        </button>
      </footer>
    </div>
  );
};

