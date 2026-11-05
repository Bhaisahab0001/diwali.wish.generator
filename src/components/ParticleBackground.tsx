import React, { useEffect, useRef } from 'react';
import type { VisualTheme } from '../types.ts';
import { THEME_CONFIGS } from '../types.ts';

interface ParticleBackgroundProps {
  theme?: VisualTheme;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  maxOpacity: number;
  pulseSpeed: number;
  type: 'star' | 'heart' | 'diya-spark';
  angle: number;
  spinSpeed: number;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  theme = 'midnight-starlight',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS['midnight-starlight'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Generate balanced starry ambient particles
    const particleCount = Math.min(65, Math.floor((width * height) / 18000));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const typeRand = Math.random();
      const type: 'star' | 'heart' | 'diya-spark' =
        typeRand < 0.7 ? 'star' : typeRand < 0.85 ? 'diya-spark' : 'heart';

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: type === 'heart' ? Math.random() * 8 + 6 : Math.random() * 2.2 + 0.8,
        speedY: -(Math.random() * 0.45 + 0.15),
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.7 + 0.2,
        maxOpacity: Math.random() * 0.6 + 0.4,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        type,
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.02,
      });
    }

    const drawHeart = (cx: number, cy: number, size: number, color: string, alpha: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      const topCurveHeight = size * 0.3;
      ctx.moveTo(0, topCurveHeight);
      ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
      ctx.bezierCurveTo(-size / 2, (size + topCurveHeight) / 2, 0, (size + topCurveHeight) / 1.4, 0, size);
      ctx.bezierCurveTo(0, (size + topCurveHeight) / 1.4, size / 2, (size + topCurveHeight) / 2, size / 2, topCurveHeight);
      ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speedY;
        p.x += p.speedX;
        p.angle += p.spinSpeed;

        // Subtle twinkling opacity
        p.opacity += Math.sin(Date.now() * p.pulseSpeed * 0.05) * 0.01;
        if (p.opacity > p.maxOpacity) p.opacity = p.maxOpacity;
        if (p.opacity < 0.1) p.opacity = 0.1;

        // Wrap around borders
        if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 10;
        if (p.x > width + 20) p.x = -10;

        if (p.type === 'heart') {
          drawHeart(p.x, p.y, p.size, '#f472b6', p.opacity * 0.6);
        } else if (p.type === 'diya-spark') {
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#fbbf24';
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // Starlight shimmer
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.shadowBlur = 8;
          ctx.shadowColor = themeConfig.starColor;
          ctx.fillStyle = themeConfig.starColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, themeConfig]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Dynamic ambient color gradients */}
      <div
        className={`absolute inset-0 bg-gradient-to-tr ${themeConfig.ambientGlow} transition-colors duration-1000 opacity-60`}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-black/60 pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
