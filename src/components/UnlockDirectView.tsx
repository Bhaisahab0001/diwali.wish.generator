import React, { useState } from 'react';
import { KeyRound, Sparkles, ArrowRight, ShieldCheck, Mail } from 'lucide-react';

interface UnlockDirectViewProps {
  onUnlockSlug: (slug: string) => void;
  onGoHome: () => void;
}

export const UnlockDirectView: React.FC<UnlockDirectViewProps> = ({ onUnlockSlug, onGoHome }) => {
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!inputVal.trim()) return;

    let slug = inputVal.trim();
    // Support pasting full URL like https://domain.com/m/m_abcd
    if (slug.includes('/m/')) {
      slug = slug.split('/m/')[1].split('?')[0].split('#')[0];
    }

    if (!slug) {
      setError('Please enter a valid secret message link or code.');
      return;
    }

    onUnlockSlug(slug);
  };

  return (
    <div className="w-full max-w-md mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-4">
        <Mail className="w-7 h-7" />
      </div>

      <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-100">
        Unlock a Secret Message
      </h2>
      <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
        Have you received a secret link or message code? Enter it below to unseal your dispatch.
      </p>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <KeyRound className="w-4 h-4 text-amber-400" />
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Paste link or code (e.g. m_7k8x9...)"
            required
            autoFocus
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl font-medium text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 active:scale-95 transition-all shadow-[0_4px_16px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
        >
          <span>Find & Open Message</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>End-to-end password protected & rate-limited</span>
      </div>
    </div>
  );
};
