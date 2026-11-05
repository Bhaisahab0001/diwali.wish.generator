import React, { useState } from 'react';
import type { VisualTheme, EnvelopeSeal } from '../types.ts';
import { Envelope3D } from './Envelope3D.tsx';
import { ParchmentLetter } from './ParchmentLetter.tsx';
import {
  Sparkles,
  Link,
  Copy,
  Check,
  Edit3,
  ArrowLeft,
  ShieldCheck,
  Heart,
  Share2,
  Eye,
} from 'lucide-react';

interface OwnerPreviewProps {
  message: {
    id: string;
    slug: string;
    recipient_name: string;
    sender_name: string;
    title: string;
    content: string;
    password_hint?: string | null;
    theme: VisualTheme;
    envelope_seal: EnvelopeSeal;
    burn_after_reading?: boolean;
    max_views?: number | null;
    image?: { data_base64: string; mime_type: string; file_name: string | null } | null;
    created_at?: number;
    view_count?: number;
  };
  successMessage?: string | null;
  onEdit: (id: string) => void;
  onReturnDashboard: () => void;
}

export const OwnerPreview: React.FC<OwnerPreviewProps> = ({
  message,
  successMessage,
  onEdit,
  onReturnDashboard,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'envelope' | 'letter'>('envelope');

  const shareUrl = `${window.location.origin}/m/${message.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
      {/* Success Notification Bar upon creation */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-purple-500/20 border border-amber-400/40 shadow-lg text-center flex items-center justify-center gap-2 text-amber-200 text-sm sm:text-base font-display">
          <Sparkles className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Top Banner: Owner Confidential Preview Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-display font-bold text-slate-100">
                Owner Confidential Preview
              </h2>
              <span className="text-[10px] text-purple-300 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-800">
                Owner Only
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Testing mode: preview your letter & test the 3-click wax seal animation without burning views.
            </p>
          </div>
        </div>

        {/* View Switcher: Envelope Testing vs Unlocked Letter */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('envelope')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'envelope'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Test 3-Click Envelope
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('letter')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'letter'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>2. Full Letter Parchment</span>
          </button>
        </div>
      </div>

      {/* Sharing Strip Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/30 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200">Recipient Secret Link</p>
            <p className="text-xs text-amber-300 font-mono truncate max-w-sm mt-0.5">
              {shareUrl}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleCopyLink}
            className={`flex-1 sm:flex-none py-2 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              isCopied
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold shadow-[0_4px_14px_rgba(245,158,11,0.3)]'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Sharing Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onEdit(message.id)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Edit this message"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="p-4 sm:p-8 rounded-3xl bg-slate-950/70 border border-slate-800 min-h-[460px] flex items-center justify-center">
        {activeTab === 'envelope' ? (
          <div className="w-full">
            <Envelope3D
              recipientName={message.recipient_name}
              senderName={message.sender_name}
              title={message.title}
              theme={message.theme}
              seal={message.envelope_seal}
              passwordHint={message.password_hint}
              isUnlocked={true} // In owner preview, seal is interactive right away
              isOwnerPreview={true}
            />
          </div>
        ) : (
          <div className="w-full">
            <ParchmentLetter
              data={{
                slug: message.slug,
                recipient_name: message.recipient_name,
                sender_name: message.sender_name,
                title: message.title,
                content: message.content,
                theme: message.theme,
                envelope_seal: message.envelope_seal,
                created_at: message.created_at || Math.floor(Date.now() / 1000),
                view_count: message.view_count || 0,
                is_burned: false,
                burn_after_reading: Boolean(message.burn_after_reading),
                image: message.image,
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom Back Button */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onReturnDashboard}
          className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Owner Dashboard</span>
        </button>

        <p className="text-[11px] text-slate-500 hidden sm:block">
          Encrypted &amp; securely stored on Cloudflare D1 SQLite
        </p>
      </div>
    </div>
  );
};
