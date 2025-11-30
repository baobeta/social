import { useState } from 'react';

interface BackgroundEffectsProps {
  mousePos: { x: number; y: number };
}

export default function BackgroundEffects({ mousePos }: BackgroundEffectsProps) {
  const [particlePositions] = useState(
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
    }))
  );

  return (
    <div>
      <div
        className="fixed w-96 h-96 rounded-full pointer-events-none transition-all duration-300 blur-3xl opacity-30"
        style={{
          left: `${mousePos.x - 192}px`,
          top: `${mousePos.y - 192}px`,
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)',
        }}
      ></div>

      <div className="fixed inset-0 pointer-events-none">
        {particlePositions.map((pos, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full opacity-40 animate-float"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              animationDuration: `${3 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

