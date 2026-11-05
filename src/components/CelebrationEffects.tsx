import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  char: string;
  duration: number;
  delay: number;
}

export const CelebrationEffects: React.FC<{ active: boolean }> = ({ active }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const items: Particle[] = [];
    const symbols = ['💖', '✨', '🪔', '⭐', '🌸', '💫', '🕊️'];
    const colors = ['#f472b6', '#fbbf24', '#c084fc', '#fde047', '#f43f5e'];

    for (let i = 0; i < 40; i++) {
      items.push({
        id: i,
        x: Math.random() * 90 + 5, // 5% to 95%
        y: Math.random() * 80 + 10,
        size: Math.random() * 14 + 14,
        color: colors[Math.floor(Math.random() * colors.length)],
        char: symbols[Math.floor(Math.random() * symbols.length)],
        duration: Math.random() * 2.5 + 1.8,
        delay: Math.random() * 0.8,
      });
    }

    setParticles(items);

    const timer = setTimeout(() => {
      setParticles([]);
    }, 4500);

    return () => clearTimeout(timer);
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-in fade-in zoom-in"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            animation: `floatUp ${p.duration}s ease-out forwards`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.char}
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.6) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-160px) scale(1.4) rotate(${Math.random() > 0.5 ? 45 : -45}deg);
          }
        }
      `}</style>
    </div>
  );
};
