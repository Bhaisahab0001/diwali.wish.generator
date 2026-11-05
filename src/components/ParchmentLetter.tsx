import React, { useState } from 'react';
import type { UnlockedMessageData } from '../types.ts';
import { THEME_CONFIGS, SEAL_CONFIGS } from '../types.ts';
import { WaxSeal } from './WaxSeal.tsx';
import { Flame, Clock, Heart, Sparkles, ZoomIn, X, Download, Share2 } from 'lucide-react';

interface ParchmentLetterProps {
  data: UnlockedMessageData;
  onComposeReply?: () => void;
}

export const ParchmentLetter: React.FC<ParchmentLetterProps> = ({ data, onComposeReply }) => {
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const themeConfig = THEME_CONFIGS[data.theme] || THEME_CONFIGS['midnight-starlight'];
  const sealConfig = SEAL_CONFIGS[data.envelope_seal] || SEAL_CONFIGS.heart;

  const formattedDate = new Date(data.created_at * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative w-full max-w-2xl mx-auto my-6 px-4 animate-in fade-in zoom-in-95 duration-700">
      {/* Burn After Reading Warning Header */}
      {data.is_burned && (
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-red-950/80 via-rose-950/70 to-red-950/80 border border-red-700/60 shadow-[0_4px_20px_rgba(220,38,38,0.25)] flex items-center justify-center gap-2.5 text-rose-200 text-xs sm:text-sm">
          <Flame className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
          <span>
            <strong className="font-semibold text-rose-300">Self-Destructed:</strong> This secret message was set to burn after opening. Once you close this window, it will never be accessible again.
          </span>
        </div>
      )}

      {/* Main Parchment Letter Card */}
      <div
        className={`relative w-full rounded-2xl sm:rounded-3xl p-6 sm:p-10 border ${themeConfig.letterBorder} ${themeConfig.letterBg} shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-hidden`}
      >
        {/* Ornate Gold Filigree Borders */}
        <div className="absolute inset-2 sm:inset-3 border border-amber-400/20 rounded-xl sm:rounded-2xl pointer-events-none" />
        <div className="absolute inset-3 sm:inset-4 border border-dashed border-amber-400/15 rounded-lg sm:rounded-xl pointer-events-none" />

        {/* Vintage Top Corner Flourishes */}
        <span className="absolute top-4 left-4 text-amber-400/40 text-base font-serif select-none pointer-events-none">
          ❧
        </span>
        <span className="absolute top-4 right-4 text-amber-400/40 text-base font-serif select-none pointer-events-none">
          ☙
        </span>
        <span className="absolute bottom-4 left-4 text-amber-400/40 text-base font-serif select-none pointer-events-none">
          ❦
        </span>
        <span className="absolute bottom-4 right-4 text-amber-400/40 text-base font-serif select-none pointer-events-none">
          ❦
        </span>

        {/* Subtle Watermark Seal in the background */}
        <div className="absolute -right-8 -bottom-8 opacity-5 text-amber-200 text-9xl pointer-events-none select-none font-serif">
          {sealConfig.icon}
        </div>

        {/* Letter Top Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <WaxSeal seal={data.envelope_seal} theme={data.theme} size="sm" interactive={false} />
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-sans">
                Secret Dispatch
              </p>
              <h3 className="text-base sm:text-lg font-display font-semibold text-slate-100">
                {data.title || 'Private Note'}
              </h3>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div className="flex items-center gap-1 justify-end">
              <Clock className="w-3.5 h-3.5 text-amber-400/70" />
              <span>{formattedDate}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Read #{data.view_count}
            </p>
          </div>
        </div>

        {/* Letter Salutation */}
        <div className="relative z-10 mb-6">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-amber-200/90 tracking-wide">
            Dearest {data.recipient_name},
          </h2>
        </div>

        {/* Letter Body Content */}
        <div className="relative z-10 text-sm sm:text-base leading-relaxed font-sans text-slate-200 space-y-4 whitespace-pre-wrap selection:bg-amber-500/30">
          {data.content}
        </div>

        {/* Optional Image Attachment */}
        {data.image && data.image.data_base64 && (
          <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
            <p className="text-xs uppercase tracking-wider text-amber-300/80 mb-3 flex items-center gap-1.5 font-sans">
              <Sparkles className="w-3.5 h-3.5" />
              Enclosed Keepsake
            </p>
            <div className="relative group max-w-sm mx-auto overflow-hidden rounded-xl border border-amber-400/30 shadow-lg bg-black/40">
              <img
                src={data.image.data_base64}
                alt={data.image.file_name || 'Enclosed memory'}
                className="w-full max-h-80 object-cover rounded-xl transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                onClick={() => setIsImageZoomed(true)}
              />
              <button
                type="button"
                onClick={() => setIsImageZoomed(true)}
                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-sm"
                title="Zoom image"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Letter Sign-off */}
        <div className="relative z-10 mt-10 pt-6 border-t border-white/10 flex flex-col items-end text-right">
          <p className="text-xs italic text-slate-400 font-serif">Forever and always,</p>
          <p className="text-lg sm:text-xl font-display font-bold text-amber-200 mt-1">
            {data.sender_name}
          </p>
          <div className="mt-2 text-rose-400/80 flex items-center gap-1 text-xs">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Sealed with love</span>
          </div>
        </div>
      </div>

      {/* Action Footer for Recipient */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onComposeReply && (
          <button
            type="button"
            onClick={onComposeReply}
            className="px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 active:scale-95 shadow-[0_4px_16px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2"
          >
            <Heart className="w-4 h-4 fill-current text-rose-600" />
            <span>Send a Secret Message in Return</span>
          </button>
        )}
      </div>

      {/* Image Zoom Modal */}
      {isImageZoomed && data.image && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsImageZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20">
            <button
              type="button"
              onClick={() => setIsImageZoomed(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={data.image.data_base64}
              alt={data.image.file_name || 'Enclosed keepsake'}
              className="w-full h-full object-contain max-h-[85vh] rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
