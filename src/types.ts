/**
 * Frontend types and configuration constants
 */

export type VisualTheme =
  | 'midnight-starlight'
  | 'enchanted-rose'
  | 'royal-lavender'
  | 'golden-diya'
  | 'celestial-moon'
  | 'vintage-parchment';

export type EnvelopeSeal = 'heart' | 'diya' | 'star' | 'rose' | 'crown' | 'lotus';

export interface ThemeConfig {
  id: VisualTheme;
  name: string;
  tagline: string;
  envelopeOuter: string;
  envelopeInner: string;
  envelopeFlap: string;
  letterBg: string;
  letterText: string;
  letterBorder: string;
  letterAccent: string;
  waxColor: string;
  waxGlow: string;
  ambientGlow: string;
  starColor: string;
}

export const THEME_CONFIGS: Record<VisualTheme, ThemeConfig> = {
  'midnight-starlight': {
    id: 'midnight-starlight',
    name: 'Midnight Starlight',
    tagline: 'Deep navy, starlit lavender, and radiant gold shimmer',
    envelopeOuter: 'bg-gradient-to-br from-[#0d1326] via-[#141b36] to-[#0a0f1d]',
    envelopeInner: 'bg-gradient-to-br from-[#121833] to-[#0d1326]',
    envelopeFlap: 'bg-gradient-to-br from-[#182142] to-[#0f1730]',
    letterBg: 'bg-gradient-to-b from-[#131b38] via-[#161f42] to-[#0f1630]',
    letterText: 'text-slate-100',
    letterBorder: 'border-[#334277]',
    letterAccent: 'text-amber-300',
    waxColor: 'bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 text-amber-950',
    waxGlow: 'shadow-[0_0_24px_rgba(245,158,11,0.5)]',
    ambientGlow: 'from-indigo-950/40 via-purple-950/30 to-amber-950/20',
    starColor: '#fef08a',
  },
  'enchanted-rose': {
    id: 'enchanted-rose',
    name: 'Enchanted Rose',
    tagline: 'Deep velvet ruby, soft blush pink, and romantic warmth',
    envelopeOuter: 'bg-gradient-to-br from-[#2b0c1b] via-[#3a1025] to-[#1c0812]',
    envelopeInner: 'bg-gradient-to-br from-[#350f22] to-[#240a17]',
    envelopeFlap: 'bg-gradient-to-br from-[#45142d] to-[#2c0c1c]',
    letterBg: 'bg-gradient-to-b from-[#381126] via-[#2f0e20] to-[#220a17]',
    letterText: 'text-rose-100',
    letterBorder: 'border-rose-900/60',
    letterAccent: 'text-rose-300',
    waxColor: 'bg-gradient-to-tr from-rose-700 via-rose-500 to-rose-300 text-rose-950',
    waxGlow: 'shadow-[0_0_24px_rgba(244,63,94,0.5)]',
    ambientGlow: 'from-rose-950/40 via-pink-950/30 to-amber-950/20',
    starColor: '#fbcfe8',
  },
  'royal-lavender': {
    id: 'royal-lavender',
    name: 'Royal Lavender',
    tagline: 'Rich amethyst purple, dreamy pastel lilac, and silver mist',
    envelopeOuter: 'bg-gradient-to-br from-[#1a1033] via-[#241745] to-[#130b26]',
    envelopeInner: 'bg-gradient-to-br from-[#221542] to-[#170e2f]',
    envelopeFlap: 'bg-gradient-to-br from-[#2f1f59] to-[#1b1138]',
    letterBg: 'bg-gradient-to-b from-[#261749] via-[#1f123d] to-[#170c2e]',
    letterText: 'text-purple-100',
    letterBorder: 'border-purple-800/60',
    letterAccent: 'text-purple-300',
    waxColor: 'bg-gradient-to-tr from-purple-700 via-violet-500 to-purple-300 text-purple-950',
    waxGlow: 'shadow-[0_0_24px_rgba(168,85,247,0.5)]',
    ambientGlow: 'from-purple-950/40 via-indigo-950/30 to-violet-950/20',
    starColor: '#e9d5ff',
  },
  'golden-diya': {
    id: 'golden-diya',
    name: 'Golden Diya',
    tagline: 'DiwaliVerse festive obsidian, radiant gold & festive diya sparks',
    envelopeOuter: 'bg-gradient-to-br from-[#261609] via-[#38200d] to-[#170d05]',
    envelopeInner: 'bg-gradient-to-br from-[#301b0b] to-[#1f1107]',
    envelopeFlap: 'bg-gradient-to-br from-[#452710] to-[#29170a]',
    letterBg: 'bg-gradient-to-b from-[#331c0c] via-[#2a170a] to-[#1c0f06]',
    letterText: 'text-amber-100',
    letterBorder: 'border-amber-700/50',
    letterAccent: 'text-amber-400',
    waxColor: 'bg-gradient-to-tr from-yellow-600 via-amber-500 to-amber-200 text-amber-950',
    waxGlow: 'shadow-[0_0_28px_rgba(251,191,36,0.6)]',
    ambientGlow: 'from-amber-950/40 via-yellow-950/30 to-orange-950/20',
    starColor: '#fde047',
  },
  'celestial-moon': {
    id: 'celestial-moon',
    name: 'Celestial Moon',
    tagline: 'Deep abyssal cyan, silver twilight, and serene moonbeams',
    envelopeOuter: 'bg-gradient-to-br from-[#081a24] via-[#0c2433] to-[#051119]',
    envelopeInner: 'bg-gradient-to-br from-[#0c202d] to-[#07161f]',
    envelopeFlap: 'bg-gradient-to-br from-[#102d40] to-[#0a1c27]',
    letterBg: 'bg-gradient-to-b from-[#0e2738] via-[#091e2b] to-[#06141d]',
    letterText: 'text-cyan-100',
    letterBorder: 'border-cyan-800/60',
    letterAccent: 'text-cyan-300',
    waxColor: 'bg-gradient-to-tr from-cyan-700 via-teal-400 to-cyan-200 text-cyan-950',
    waxGlow: 'shadow-[0_0_24px_rgba(45,212,191,0.5)]',
    ambientGlow: 'from-cyan-950/40 via-sky-950/30 to-blue-950/20',
    starColor: '#a5f3fc',
  },
  'vintage-parchment': {
    id: 'vintage-parchment',
    name: 'Vintage Parchment',
    tagline: 'Warm antique noir, sepia gold edges, and royal crimson wax',
    envelopeOuter: 'bg-gradient-to-br from-[#241a13] via-[#2f231b] to-[#18110c]',
    envelopeInner: 'bg-gradient-to-br from-[#2c2018] to-[#1c140e]',
    envelopeFlap: 'bg-gradient-to-br from-[#382b21] to-[#221811]',
    letterBg: 'bg-gradient-to-b from-[#2e2219] via-[#261c14] to-[#1a120d]',
    letterText: 'text-amber-100/90',
    letterBorder: 'border-amber-900/60',
    letterAccent: 'text-amber-300',
    waxColor: 'bg-gradient-to-tr from-red-800 via-red-600 to-red-400 text-rose-100',
    waxGlow: 'shadow-[0_0_24px_rgba(220,38,38,0.5)]',
    ambientGlow: 'from-stone-950/50 via-amber-950/30 to-orange-950/20',
    starColor: '#fed7aa',
  },
};

export const SEAL_CONFIGS: Record<EnvelopeSeal, { id: EnvelopeSeal; label: string; icon: string }> = {
  heart: { id: 'heart', label: 'Eternal Heart', icon: '💖' },
  diya: { id: 'diya', label: 'Festive Diya', icon: '🪔' },
  star: { id: 'star', label: 'Guiding Star', icon: '⭐' },
  rose: { id: 'rose', label: 'Enchanted Rose', icon: '🌹' },
  crown: { id: 'crown', label: 'Royal Crown', icon: '👑' },
  lotus: { id: 'lotus', label: 'Sacred Lotus', icon: '🪷' },
};

export interface Owner {
  id: string;
  username: string;
  email?: string;
  display_name: string;
  created_at: number;
}

export interface OwnerMessageItem {
  id: string;
  slug: string;
  recipient_name: string;
  sender_name: string;
  title: string;
  password_hint: string | null;
  theme: VisualTheme;
  envelope_seal: EnvelopeSeal;
  expires_at: number | null;
  burn_after_reading: boolean;
  max_views: number | null;
  view_count: number;
  is_burned: boolean;
  is_expired: boolean;
  status: 'active' | 'opened' | 'burned' | 'expired';
  has_image: boolean;
  created_at: number;
  updated_at: number;
  last_unlocked_at: number | null;
}

export interface PublicMessageMetadata {
  slug: string;
  recipient_name: string;
  sender_name: string;
  title: string;
  theme: VisualTheme;
  envelope_seal: EnvelopeSeal;
  password_hint: string | null;
  has_image: boolean;
  is_expired: boolean;
  is_burned: boolean;
  burn_after_reading: boolean;
  max_views: number | null;
  view_count: number;
  remaining_views: number | null;
  expires_at: number | null;
  created_at: number;
  attempts_remaining: number;
  is_locked_out: boolean;
  lockout_seconds_remaining?: number;
}

export interface UnlockedMessageData {
  slug: string;
  recipient_name: string;
  sender_name: string;
  title: string;
  content: string;
  theme: VisualTheme;
  envelope_seal: EnvelopeSeal;
  created_at: number;
  view_count: number;
  is_burned: boolean;
  burn_after_reading: boolean;
  image?: {
    mime_type: string;
    file_name: string | null;
    data_base64: string;
  } | null;
}
