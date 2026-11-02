import React from 'react';

interface BubbleSpec {
  id: number;
  size: number;
  left: string;
  top: string;
  delay: string;
  duration: string;
  opacity: number;
}

const BUBBLES: BubbleSpec[] = [
  { id: 1, size: 96, left: '6%', top: '12%', delay: '0s', duration: '9s', opacity: 0.48 },
  { id: 2, size: 44, left: '14%', top: '26%', delay: '1.5s', duration: '7s', opacity: 0.55 },
  { id: 3, size: 130, left: '84%', top: '10%', delay: '0.8s', duration: '11s', opacity: 0.38 },
  { id: 4, size: 58, left: '78%', top: '34%', delay: '2.2s', duration: '8s', opacity: 0.5 },
  { id: 5, size: 72, left: '8%', top: '68%', delay: '1.1s', duration: '10s', opacity: 0.42 },
  { id: 6, size: 36, left: '22%', top: '82%', delay: '3.0s', duration: '6.5s', opacity: 0.6 },
  { id: 7, size: 110, left: '88%', top: '72%', delay: '0.4s', duration: '10.5s', opacity: 0.4 },
  { id: 8, size: 48, left: '68%', top: '85%', delay: '2.6s', duration: '7.5s', opacity: 0.52 },
  { id: 9, size: 64, left: '46%', top: '8%', delay: '1.9s', duration: '9.5s', opacity: 0.35 },
  { id: 10, size: 30, left: '54%', top: '88%', delay: '0.7s', duration: '6.8s', opacity: 0.55 },
];

export const OceanBubbleBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Ambient Ocean Mist Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 18%, rgba(127, 255, 212, 0.38) 0%, rgba(66, 153, 225, 0.14) 45%, rgba(232, 247, 250, 0.95) 100%)',
        }}
      />
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, #7FFFD4 0%, #4299e1 70%, transparent 100%)' }}
      />
      <div
        className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full blur-3xl opacity-35"
        style={{ background: 'radial-gradient(circle, #4299e1 0%, #7FFFD4 70%, transparent 100%)' }}
      />

      {/* Translucent Floating Ocean Bubbles */}
      {BUBBLES.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-full animate-float-slow"
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: b.left,
            top: b.top,
            animationDelay: b.delay,
            animationDuration: b.duration,
            opacity: b.opacity,
            background:
              'radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.92) 0%, rgba(127, 255, 212, 0.38) 42%, rgba(66, 153, 225, 0.25) 78%, rgba(0, 0, 128, 0.12) 100%)',
            boxShadow:
              'inset -4px -4px 12px rgba(66, 153, 225, 0.28), inset 4px 4px 12px rgba(255, 255, 255, 0.85), 0 8px 24px rgba(49, 130, 206, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.72)',
          }}
        >
          {/* Specular Bubble Highlight */}
          <div
            className="absolute rounded-full bg-white/85"
            style={{
              width: `${Math.max(6, b.size * 0.22)}px`,
              height: `${Math.max(4, b.size * 0.13)}px`,
              top: '18%',
              left: '22%',
              transform: 'rotate(-32deg)',
            }}
          />
        </div>
      ))}
    </div>
  );
};

