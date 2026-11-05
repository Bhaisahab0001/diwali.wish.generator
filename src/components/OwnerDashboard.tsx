import React, { useState } from 'react';
import type { OwnerMessageItem } from '../types.ts';
import { THEME_CONFIGS, SEAL_CONFIGS } from '../types.ts';
import { WaxSeal } from './WaxSeal.tsx';
import {
  Sparkles,
  Link,
  Copy,
  Check,
  Eye,
  Edit3,
  CopyPlus,
  Trash2,
  Clock,
  Flame,
  Search,
  Filter,
  Plus,
  Lock,
  ExternalLink,
} from 'lucide-react';

interface OwnerDashboardProps {
  messages: OwnerMessageItem[];
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onPreview: (id: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  messages,
  onCreateNew,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'opened' | 'burned' | 'expired'>('all');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Compute stats
  const totalCount = messages.length;
  const totalViews = messages.reduce((acc, m) => acc + m.view_count, 0);
  const activeCount = messages.filter((m) => m.status === 'active' || m.status === 'opened').length;
  const burnedOrExpiredCount = messages.filter((m) => m.status === 'burned' || m.status === 'expired').length;

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.title.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return msg.status === 'active';
    if (statusFilter === 'opened') return msg.status === 'opened';
    if (statusFilter === 'burned') return msg.status === 'burned';
    if (statusFilter === 'expired') return msg.status === 'expired';
    return true;
  });

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/m/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => {
      setCopiedSlug(null);
    }, 2500);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this secret message? This action cannot be undone.')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleDuplicateClick = async (id: string) => {
    setDuplicatingId(id);
    try {
      await onDuplicate(id);
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-sans">
            Total Secrets
          </p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-slate-100 mt-1 tabular-nums">
            {totalCount}
          </p>
          <p className="text-[11px] text-amber-400/80 mt-1">D1 SQLite records</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-sans">
            Total Unlocked Reads
          </p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-amber-300 mt-1 tabular-nums">
            {totalViews}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Password verified</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-sans">
            Active Dispatches
          </p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-emerald-400 mt-1 tabular-nums">
            {activeCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting or viewable</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-sans">
            Burned / Expired
          </p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-rose-400 mt-1 tabular-nums">
            {burnedOrExpiredCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Self-destructed</p>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Create Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by recipient, sender, or title..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-xl overflow-x-auto">
          {(['all', 'active', 'opened', 'burned', 'expired'] as const).map((tab) => {
            const isSelected = statusFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Create Message Button */}
        <button
          type="button"
          onClick={onCreateNew}
          className="px-4 py-2 rounded-xl font-medium text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 active:scale-95 shadow-[0_4px_16px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Secret Message</span>
        </button>
      </div>

      {/* Messages List / Grid */}
      {filteredMessages.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-slate-200">
              {messages.length === 0 ? 'No Secret Messages Yet' : 'No Matching Messages Found'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {messages.length === 0
                ? 'Create your first password-protected secret message with an animated wax-sealed envelope.'
                : 'Try adjusting your search query or filter criteria.'}
            </p>
          </div>
          {messages.length === 0 && (
            <button
              type="button"
              onClick={onCreateNew}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Secret</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMessages.map((msg) => {
            const themeConfig = THEME_CONFIGS[msg.theme] || THEME_CONFIGS['midnight-starlight'];
            const sealConfig = SEAL_CONFIGS[msg.envelope_seal] || SEAL_CONFIGS.heart;
            const isCopied = copiedSlug === msg.slug;

            let statusBadge = (
              <span className="text-[11px] text-emerald-400 font-medium">Active (Unopened)</span>
            );
            if (msg.status === 'burned') {
              statusBadge = (
                <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                  <Flame className="w-3 h-3" /> Burned / Destructed
                </span>
              );
            } else if (msg.status === 'expired') {
              statusBadge = <span className="text-[11px] text-slate-500 font-medium">Expired</span>;
            } else if (msg.status === 'opened') {
              statusBadge = (
                <span className="text-[11px] text-amber-300 font-medium">
                  Opened ({msg.view_count} {msg.view_count === 1 ? 'read' : 'reads'})
                </span>
              );
            }

            return (
              <div
                key={msg.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                {/* Top Row: Seal emblem, Status, Date */}
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2.5">
                      <WaxSeal seal={msg.envelope_seal} theme={msg.theme} size="sm" interactive={false} />
                      <div>
                        <p className="text-[11px] text-slate-400">
                          {themeConfig.name}
                        </p>
                        {statusBadge}
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-500">
                      {new Date(msg.created_at * 1000).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Recipient & Title */}
                  <h4 className="text-base font-display font-bold text-slate-100">
                    To: {msg.recipient_name}
                  </h4>
                  <p className="text-xs text-slate-400 italic line-clamp-1 mt-0.5">
                    "{msg.title}"
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    From: <span className="text-slate-300">{msg.sender_name}</span>
                  </p>

                  {/* Metadata Chips: Burn, Expiry, Clue */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[11px] text-slate-400">
                    {msg.burn_after_reading && (
                      <span className="text-rose-400 flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Burn after 1st read
                      </span>
                    )}
                    {msg.has_image && <span className="text-amber-400/90">🖼️ Image attached</span>}
                    {msg.password_hint && (
                      <span className="text-purple-300">
                        Clue: "{msg.password_hint}"
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {/* Copy Link Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyLink(msg.slug)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      isCopied
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                    title="Copy secret link for recipient"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  {/* Preview button */}
                  <button
                    type="button"
                    onClick={() => onPreview(msg.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                    title="Preview message"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => onEdit(msg.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                    title="Edit secret message"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Duplicate button */}
                  <button
                    type="button"
                    disabled={duplicatingId === msg.id}
                    onClick={() => handleDuplicateClick(msg.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
                    title="Duplicate message with new slug"
                  >
                    <CopyPlus className="w-4 h-4" />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    disabled={deletingId === msg.id}
                    onClick={() => handleDeleteClick(msg.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
                    title="Delete secret message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
