import React, { useEffect, useRef, useCallback } from 'react';

interface FogCanvasProps {
  isActive: boolean;
  resetSignal: number;
}

/**
 * Interactive Mirror Fog / Condensation Canvas
 * Uses HTML5 Canvas 2D globalCompositeOperation = 'destination-out'
 * so users can wipe away the steam/fog with mouse or finger.
 */
export const FogCanvas: React.FC<FogCanvasProps> = ({ isActive, resetSignal }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const fillFogLayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);

    // Base thick misty condensation layer
    const mistGrad = ctx.createLinearGradient(0, 0, width, height);
    mistGrad.addColorStop(0, 'rgba(236, 250, 255, 0.93)');
    mistGrad.addColorStop(0.5, 'rgba(218, 243, 252, 0.90)');
    mistGrad.addColorStop(1, 'rgba(228, 248, 255, 0.94)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, 0, width, height);

    // Soft cloudy patches for realistic steam texture
    for (let i = 0; i < 45; i++) {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      const r = (40 + Math.random() * 110) * dpr;
      const patch = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      patch.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      patch.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = patch;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tiny water condensation micro-droplets on the glass
    const dropletCount = Math.min(240, Math.floor((width * height) / 4500));
    for (let i = 0; i < dropletCount; i++) {
      const dx = Math.random() * width;
      const dy = Math.random() * height;
      const dr = (1.2 + Math.random() * 3.2) * dpr;

      ctx.beginPath();
      ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(dx - dr * 0.25, dy - dr * 0.25, dr * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(127, 255, 212, 0.45)';
      ctx.fill();
    }

    ctx.restore();
  }, []);

  useEffect(() => {
    if (isActive) {
      fillFogLayer();
    }
  }, [isActive, resetSignal, fillFogLayer]);

  useEffect(() => {
    if (!isActive) return;
    const handleResize = () => {
      fillFogLayer();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isActive, fillFogLayer]);

  const wipeAtPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const brushRadius = Math.max(28, Math.min(rect.width, rect.height) * 0.075) * scaleX;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    const stampSoftCircle = (px: number, py: number) => {
      const grad = ctx.createRadialGradient(
        px,
        py,
        brushRadius * 0.2,
        px,
        py,
        brushRadius
      );
      grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.88)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, brushRadius, 0, Math.PI * 2);
      ctx.fill();
    };

    if (lastPosRef.current) {
      const prev = lastPosRef.current;
      const dist = Math.hypot(x - prev.x, y - prev.y);
      const step = Math.max(4, brushRadius * 0.22);
      const steps = Math.ceil(dist / step);
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        stampSoftCircle(prev.x + (x - prev.x) * t, prev.y + (y - prev.y) * t);
      }
    } else {
      stampSoftCircle(x, y);
    }

    ctx.restore();
    lastPosRef.current = { x, y };
  };

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        isDrawingRef.current = true;
        lastPosRef.current = null;
        wipeAtPoint(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (!isDrawingRef.current) return;
        wipeAtPoint(e.clientX, e.clientY);
      }}
      onPointerUp={() => {
        isDrawingRef.current = false;
        lastPosRef.current = null;
      }}
      onPointerCancel={() => {
        isDrawingRef.current = false;
        lastPosRef.current = null;
      }}
      className="absolute inset-0 w-full h-full z-20 cursor-grab active:cursor-grabbing touch-none select-none"
      style={{
        backdropFilter: 'blur(2px)',
      }}
      title="Quệt chuột hoặc ngón tay để lau sương mù trên gương"
    />
  );
};

