import React, { useState, useRef } from 'react';
import type { EnvelopeSeal, VisualTheme } from '../types.ts';
import { SEAL_CONFIGS, THEME_CONFIGS } from '../types.ts';

export type SealBreakStage = 0 | 1 | 2 | 3; // 0=sealed, 1=cracked, 2=breaking, 3=shattered

interface WaxSealProps {
  seal?: EnvelopeSeal;
  theme?: VisualTheme;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  stage?: SealBreakStage;
  onBreakStageChange?: (newStage: SealBreakStage) => void;
  interactive?: boolean;
  pulse?: boolean;
  disabled?: boolean;
}

// Procedural audio synthesizer using Web Audio API
export function playSealBreakAudio(stage: 1 | 2 | 3) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (stage === 1) {
      // First light crack: crisp high-frequency snap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (stage === 2) {
      // Second crack: deeper fissure with crunchy sub-tone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(950, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.12);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(260, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.15);
    } else if (stage === 3) {
      // Third crack: total shatter snap + resonant harmonic chime
      const snap = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snap.type = 'sawtooth';
      snap.frequency.setValueAtTime(1600, ctx.currentTime);
      snap.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.18);
      snapGain.gain.setValueAtTime(0.4, ctx.currentTime);
      snapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      snap.connect(snapGain);
      snapGain.connect(ctx.destination);
      snap.start();
      snap.stop(ctx.currentTime + 0.22);

      // Crystalline harmonic chime sweep (C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(freq, ctx.currentTime + 0.05 + idx * 0.06);

        chimeGain.gain.setValueAtTime(0.18 / (idx + 1), ctx.currentTime + 0.05 + idx * 0.06);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8 + idx * 0.1);

        chime.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chime.start(ctx.currentTime + 0.05 + idx * 0.06);
        chime.stop(ctx.currentTime + 0.9 + idx * 0.1);
      });
    }
  } catch (e) {
    // Ignore audio restrictions
  }
}

export const WaxSeal: React.FC<WaxSealProps> = ({
  seal = 'heart',
  theme = 'midnight-starlight',
  size = 'md',
  stage = 0,
  onBreakStageChange,
  interactive = true,
  pulse = false,
  disabled = false,
}) => {
  const sealConfig = SEAL_CONFIGS[seal] || SEAL_CONFIGS.heart;
  const themeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS['midnight-starlight'];
  const [isJittering, setIsJittering] = useState(false);
  const lastClickTimeRef = useRef<number>(0);

  const sizeClasses = {
    sm: 'w-10 h-10 text-base',
    md: 'w-14 h-14 text-xl',
    lg: 'w-18 h-18 text-2xl',
    xl: 'w-22 h-22 text-3xl',
  }[size];

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!interactive || disabled || stage >= 3) return;

    // Prevent accidental rapid double-click skipping (250ms threshold)
    const now = Date.now();
    if (now - lastClickTimeRef.current < 250) return;
    lastClickTimeRef.current = now;

    const nextStage = ((stage + 1) as SealBreakStage);
    playSealBreakAudio(nextStage as 1 | 2 | 3);

    // Trigger visual jitter
    setIsJittering(true);
    setTimeout(() => setIsJittering(false), 300);

    if (onBreakStageChange) {
      onBreakStageChange(nextStage);
    }
  };

  const isBroken = stage === 3;

  return (
    <div
      onClick={handleClick}
      onTouchEnd={handleClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive && !isBroken ? 0 : -1}
      aria-label={`Wax seal: ${sealConfig.label}. Click count: ${stage} of 3.`}
      className={`relative rounded-full select-none flex items-center justify-center transition-transform duration-300 touch-manipulation ${sizeClasses} ${
        themeConfig.waxColor
      } ${themeConfig.waxGlow} ${
        interactive && !disabled && stage < 3
          ? 'cursor-pointer hover:scale-105 active:scale-95'
          : ''
      } ${pulse && stage === 0 ? 'animate-pulse' : ''} ${
        isJittering ? (stage === 1 ? 'animate-shake-1' : 'animate-shake-2') : ''
      }`}
      style={{
        boxShadow: isBroken
          ? 'none'
          : 'inset 0 3px 6px rgba(255,255,255,0.45), inset 0 -3px 6px rgba(0,0,0,0.55), 0 8px 18px rgba(0,0,0,0.5)',
      }}
    >
      {/* 0 Clicks (Sealed): Organic wax drips around perimeter */}
      {stage < 3 && (
        <>
          <span className="absolute -top-1 -left-0.5 w-3.5 h-3.5 rounded-full bg-inherit opacity-90 pointer-events-none" />
          <span className="absolute -bottom-1 -right-0.5 w-4 h-4 rounded-full bg-inherit opacity-90 pointer-events-none" />
          <span className="absolute -bottom-0.5 left-1 w-3 h-3 rounded-full bg-inherit opacity-85 pointer-events-none" />
        </>
      )}

      {/* Inner embossed rim & emblem */}
      {stage < 3 ? (
        <div className="absolute inset-1.5 rounded-full border border-black/30 flex items-center justify-center bg-black/10 overflow-hidden">
          {/* Emblem symbol */}
          <span
            className={`drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)] font-serif select-none pointer-events-none transition-transform duration-300 ${iconSizes} ${
              stage === 1 ? 'rotate-3 scale-95' : stage === 2 ? 'rotate-6 scale-90 opacity-80' : ''
            }`}
            role="img"
            aria-label={sealConfig.label}
          >
            {sealConfig.icon}
          </span>

          {/* STAGE 1: Single fine crack across the seal */}
          {stage >= 1 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 100 100"
            >
              {/* Jagged crack line with shadow and bright edge */}
              <polyline
                points="18,30 38,45 48,42 62,60 82,68"
                fill="none"
                stroke="rgba(0, 0, 0, 0.75)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="19,31 39,46 49,43 63,61 83,69"
                fill="none"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {/* STAGE 2: Deep intersecting fissures + fractured chipping */}
          {stage >= 2 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
              viewBox="0 0 100 100"
            >
              <polyline
                points="50,15 48,42 35,78"
                fill="none"
                stroke="rgba(0, 0, 0, 0.85)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <polyline
                points="62,60 78,82"
                fill="none"
                stroke="rgba(0, 0, 0, 0.9)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <polyline
                points="51,16 49,43 36,79"
                fill="none"
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          )}

          {/* STAGE 2: Broken wax piece falling away */}
          {stage === 2 && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-inherit rounded-full shadow-md z-30 animate-fall-chip pointer-events-none" />
          )}

          {/* Glossy highlight curve */}
          <div className="absolute top-1 left-2 right-2 h-2.5 bg-gradient-to-b from-white/35 to-transparent rounded-t-full pointer-events-none" />
        </div>
      ) : (
        /* STAGE 3: Shattered fragments bursting outward */
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* 6 Flying wax fragments with radial spin and fade */}
          <div className="absolute w-4 h-4 rounded-sm bg-inherit shadow-md animate-shatter-fragment-1" />
          <div className="absolute w-5 h-3 rounded-md bg-inherit shadow-md animate-shatter-fragment-2" />
          <div className="absolute w-4 h-5 rounded-md bg-inherit shadow-md animate-shatter-fragment-3" />
          <div className="absolute w-3 h-4 rounded-sm bg-inherit shadow-md animate-shatter-fragment-4" />
          <div className="absolute w-5 h-4 rounded-sm bg-inherit shadow-md animate-shatter-fragment-5" />
          <div className="absolute w-4 h-3 rounded-md bg-inherit shadow-md animate-shatter-fragment-6" />

          {/* Golden burst sparkles */}
          <span className="absolute text-amber-300 text-lg animate-ping opacity-90">✦</span>
          <span className="absolute text-yellow-200 text-base animate-pulse">✨</span>
        </div>
      )}

      {/* Embedded CSS animations for jitter, chip falling, and shattering */}
      <style>{`
        @keyframes shake1 {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.04) rotate(-3deg); }
          75% { transform: scale(1.02) rotate(3deg); }
        }
        @keyframes shake2 {
          0%, 100% { transform: scale(1) rotate(0deg); }
          20% { transform: scale(1.08) rotate(-6deg); }
          40% { transform: scale(0.96) rotate(6deg); }
          60% { transform: scale(1.05) rotate(-4deg); }
          80% { transform: scale(0.98) rotate(4deg); }
        }
        @keyframes fallChip {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(16px, 32px) rotate(45deg); opacity: 0; }
        }
        @keyframes shatter1 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(-42px, -38px) rotate(-65deg) scale(0.4); opacity: 0; }
        }
        @keyframes shatter2 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(40px, -45px) rotate(80deg) scale(0.4); opacity: 0; }
        }
        @keyframes shatter3 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(-48px, 18px) rotate(-90deg) scale(0.4); opacity: 0; }
        }
        @keyframes shatter4 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(52px, 15px) rotate(75deg) scale(0.4); opacity: 0; }
        }
        @keyframes shatter5 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(-32px, 48px) rotate(-45deg) scale(0.3); opacity: 0; }
        }
        @keyframes shatter6 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(38px, 50px) rotate(90deg) scale(0.3); opacity: 0; }
        }
        .animate-shake-1 { animation: shake1 0.28s ease-in-out; }
        .animate-shake-2 { animation: shake2 0.35s ease-in-out; }
        .animate-fall-chip { animation: fallChip 0.5s ease-out forwards; }
        .animate-shatter-fragment-1 { animation: shatter1 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shatter-fragment-2 { animation: shatter2 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shatter-fragment-3 { animation: shatter3 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shatter-fragment-4 { animation: shatter4 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shatter-fragment-5 { animation: shatter5 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shatter-fragment-6 { animation: shatter6 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};
