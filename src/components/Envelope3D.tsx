import React, { useState } from 'react';
import type { EnvelopeSeal, VisualTheme } from '../types.ts';
import { THEME_CONFIGS } from '../types.ts';
import { WaxSeal, type SealBreakStage } from './WaxSeal.tsx';
import { Lock, ArrowRight, Eye, EyeOff, KeyRound, Sparkles, Heart, RotateCcw } from 'lucide-react';

interface Envelope3DProps {
  recipientName: string;
  senderName: string;
  title: string;
  theme?: VisualTheme;
  seal?: EnvelopeSeal;
  passwordHint?: string | null;
  onUnlockSubmit?: (password: string) => Promise<void>;
  isLockedOut?: boolean;
  lockoutSecondsRemaining?: number;
  attemptsRemaining?: number;
  errorMessage?: string | null;
  isLoading?: boolean;
  isUnlocked?: boolean; // When password has been successfully verified by backend
  onSealShattered?: () => void; // Triggered on 3rd click
  isOwnerPreview?: boolean; // When owner is testing their own message
}

export const Envelope3D: React.FC<Envelope3DProps> = ({
  recipientName,
  senderName,
  title,
  theme = 'midnight-starlight',
  seal = 'heart',
  passwordHint,
  onUnlockSubmit,
  isLockedOut = false,
  lockoutSecondsRemaining = 0,
  attemptsRemaining = 5,
  errorMessage = null,
  isLoading = false,
  isUnlocked = false,
  onSealShattered,
  isOwnerPreview = false,
}) => {
  const themeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS['midnight-starlight'];
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [breakStage, setBreakStage] = useState<SealBreakStage>(0);

  // Can the user click the wax seal?
  // Only if password is confirmed (isUnlocked) OR if owner is testing in preview mode
  const canInteractWithSeal = isUnlocked || isOwnerPreview;

  const handleStageChange = (newStage: SealBreakStage) => {
    setBreakStage(newStage);
    if (newStage === 3) {
      setTimeout(() => {
        if (onSealShattered) {
          onSealShattered();
        }
      }, 700);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLockedOut || isLoading) return;
    if (onUnlockSubmit) {
      onUnlockSubmit(password);
    }
  };

  const handleResetSeal = () => {
    setBreakStage(0);
  };

  const isFlapOpen = breakStage === 3;

  return (
    <div className="relative w-full max-w-lg mx-auto select-none py-4">
      {/* 3D Envelope Container */}
      <div
        className="relative mx-auto w-full transition-transform duration-700 ease-out"
        style={{ perspective: '1200px' }}
      >
        <div
          className={`relative w-full rounded-3xl p-0.5 border ${themeConfig.letterBorder} shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-md transition-all duration-700`}
        >
          {/* Main Envelope Body */}
          <div
            className={`relative w-full min-h-[320px] sm:min-h-[350px] rounded-3xl ${themeConfig.envelopeOuter} overflow-hidden flex flex-col justify-between p-6 sm:p-8 z-10 border border-white/10`}
          >
            {/* Corner flourishes */}
            <span className="absolute top-3 left-3 text-amber-400/40 text-xs font-serif select-none pointer-events-none">✦</span>
            <span className="absolute top-3 right-3 text-amber-400/40 text-xs font-serif select-none pointer-events-none">✦</span>
            <span className="absolute bottom-3 left-3 text-amber-400/40 text-xs font-serif select-none pointer-events-none">✦</span>
            <span className="absolute bottom-3 right-3 text-amber-400/40 text-xs font-serif select-none pointer-events-none">✦</span>

            {/* Recipient Header */}
            <div className="text-center z-10 pt-1">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-sans">
                Confidential Delivery
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold mt-1 text-slate-100 tracking-wide drop-shadow-md">
                For {recipientName || 'You'}
              </h2>
              {title && (
                <p className="text-xs sm:text-sm text-slate-300/80 italic mt-0.5 font-serif">
                  "{title}"
                </p>
              )}
            </div>

            {/* Center Area: Flap fold creases & Wax Seal */}
            <div className="relative my-4 flex flex-col items-center justify-center">
              {/* Triangular geometric envelope folds */}
              <div
                className="absolute inset-x-0 h-28 pointer-events-none opacity-20"
                style={{
                  background:
                    'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.06) 50%), linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.06) 50%)',
                  backgroundSize: '50% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'left, right',
                }}
              />

              {/* Wax Seal with 3-click breaking states */}
              <div className="z-20 transform transition-transform duration-300">
                <WaxSeal
                  seal={seal}
                  theme={theme}
                  size="xl"
                  stage={breakStage}
                  onBreakStageChange={handleStageChange}
                  interactive={canInteractWithSeal}
                  pulse={canInteractWithSeal && breakStage === 0}
                  disabled={!canInteractWithSeal}
                />
              </div>

              {/* 3-Click Instruction Callout (Shown when authenticated / ready to break) */}
              {canInteractWithSeal && breakStage < 3 && (
                <div className="z-20 mt-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-xs sm:text-sm font-display text-amber-200 drop-shadow">
                    A little secret is waiting for you...
                  </p>
                  <p className="text-[11px] sm:text-xs text-amber-400 font-medium mt-0.5 animate-pulse">
                    Tap the seal 3 times to reveal your surprise.
                  </p>

                  {/* 3-stage progress dots */}
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <span
                      className={`w-2 h-2 rounded-full transition-colors ${
                        breakStage >= 1 ? 'bg-amber-400 scale-110 shadow-[0_0_8px_#fbbf24]' : 'bg-slate-700'
                      }`}
                    />
                    <span
                      className={`w-2 h-2 rounded-full transition-colors ${
                        breakStage >= 2 ? 'bg-amber-400 scale-110 shadow-[0_0_8px_#fbbf24]' : 'bg-slate-700'
                      }`}
                    />
                    <span
                      className={`w-2 h-2 rounded-full transition-colors ${
                        breakStage >= 3 ? 'bg-amber-400 scale-110 shadow-[0_0_8px_#fbbf24]' : 'bg-slate-700'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                      {breakStage}/3 clicks
                    </span>
                  </div>
                </div>
              )}

              {/* When stage === 3: Final celebration callout */}
              {breakStage === 3 && (
                <div className="z-20 mt-4 text-center animate-in fade-in zoom-in duration-500">
                  <p className="text-sm sm:text-base font-display font-bold text-amber-300 flex items-center justify-center gap-1.5">
                    <Heart className="w-4 h-4 fill-current text-rose-500" />
                    <span>Your secret has been unlocked! ❤️</span>
                  </p>
                </div>
              )}
            </div>

            {/* Sender Sign-off on Envelope Front */}
            <div className="text-center z-10 pb-1">
              <p className="text-xs text-slate-400">
                Sealed with affection by{' '}
                <span className={`font-semibold ${themeConfig.letterAccent}`}>
                  {senderName || 'A Secret Admirer'}
                </span>
              </p>

              {/* Owner Testing Controls */}
              {isOwnerPreview && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="text-[10px] text-purple-300 bg-purple-950/60 border border-purple-800/60 px-2.5 py-0.5 rounded-full font-sans">
                    Testing Mode
                  </span>
                  {breakStage > 0 && (
                    <button
                      type="button"
                      onClick={handleResetSeal}
                      className="px-2.5 py-0.5 rounded-full text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Seal</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3D Envelope Top Flap */}
          <div
            className={`absolute top-0 left-0 right-0 h-36 origin-top transition-all duration-700 ease-in-out pointer-events-none z-30 ${
              isFlapOpen ? '-rotate-x-180 opacity-0' : 'rotate-x-0 opacity-100'
            }`}
            style={{
              clipPath: 'polygon(0 0, 100% 0, 50% 85%)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.45) 100%)',
            }}
          />
        </div>

        {/* Phase A: Password Entry Card (Shown when NOT unlocked and NOT in owner preview) */}
        {!isUnlocked && !isOwnerPreview && (
          <div className="relative mt-5 z-40 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/95 border border-amber-500/30 shadow-[0_15px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl">
              <div className="flex items-center justify-center gap-2 mb-2.5 text-amber-400">
                <Lock className="w-4 h-4 animate-pulse" />
                <h3 className="text-sm font-semibold tracking-wide font-display text-slate-100">
                  Password Protected Secret
                </h3>
              </div>

              <p className="text-xs text-center text-slate-300 mb-4 max-w-sm mx-auto">
                Enter the secret passcode set by <strong className="text-amber-300">{senderName}</strong> to enable the wax seal breaker.
              </p>

              {passwordHint && (
                <div className="mb-4 p-3 rounded-xl bg-purple-950/50 border border-purple-800/50 text-xs text-purple-200 text-center">
                  <span className="font-semibold text-purple-300">Clue / Hint:</span> "{passwordHint}"
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200 text-center">
                  {errorMessage}
                </div>
              )}

              {isLockedOut ? (
                <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-800/60 text-center">
                  <p className="text-xs text-amber-200 font-medium">
                    Rate Limit Reached — Locked for{' '}
                    <span className="font-bold text-amber-300">
                      {Math.ceil(lockoutSecondsRemaining / 60)} minutes
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Multiple incorrect attempts were detected. Please wait before retrying.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter secret passcode..."
                      disabled={isLoading}
                      autoFocus
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>
                      Attempts remaining: <span className="text-amber-300 font-medium">{attemptsRemaining}</span>
                    </span>
                    <span className="text-slate-500">Case-sensitive</span>
                  </div>

                  <button
                    type="submit"
                    disabled={!password.trim() || isLoading}
                    className="w-full py-2.5 px-4 rounded-xl font-medium text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 active:scale-95 disabled:opacity-50 transition-all shadow-[0_4px_16px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Verifying Passcode...</span>
                      </>
                    ) : (
                      <>
                        <span>Unlock Envelope</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
