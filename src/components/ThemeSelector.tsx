import React from 'react';
import type { VisualTheme, EnvelopeSeal } from '../types.ts';
import { THEME_CONFIGS, SEAL_CONFIGS } from '../types.ts';

interface ThemeSelectorProps {
  currentTheme: VisualTheme;
  onSelectTheme: (theme: VisualTheme) => void;
  currentSeal: EnvelopeSeal;
  onSelectSeal: (seal: EnvelopeSeal) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
  currentSeal,
  onSelectSeal,
}) => {
  const themes = Object.values(THEME_CONFIGS);
  const seals = Object.values(SEAL_CONFIGS);

  return (
    <div className="space-y-6">
      {/* Visual Theme Selection */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          Visual Theme (6 Curated Aesthetics)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {themes.map((t) => {
            const isSelected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTheme(t.id)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.25)] ring-1 ring-amber-400'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-4 h-4 rounded-full border border-white/20 shrink-0 ${t.envelopeOuter}`}
                  />
                  <div className={`w-3 h-3 rounded-full border border-white/20 shrink-0 ${t.waxColor}`} />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-slate-100">{t.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{t.tagline}</p>
                </div>
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 text-amber-400 text-xs">●</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Wax Seal Stamp Selection */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          Wax Seal Emblem
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {seals.map((s) => {
            const isSelected = currentSeal === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSeal(s.id)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_12px_rgba(251,191,36,0.25)] ring-1 ring-amber-400'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <span className="text-xl select-none" role="img" aria-label={s.label}>
                  {s.icon}
                </span>
                <span className="text-[10px] font-medium text-slate-300">{s.label.split(' ')[1] || s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
