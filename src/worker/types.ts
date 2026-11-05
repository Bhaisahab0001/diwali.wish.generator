/**
 * Database schema and API types for DiwaliVerse Secret Messages
 */

export type VisualTheme =
  | 'midnight-starlight'
  | 'enchanted-rose'
  | 'royal-lavender'
  | 'golden-diya'
  | 'celestial-moon'
  | 'vintage-parchment';

export type EnvelopeSeal = 'heart' | 'diya' | 'star' | 'rose' | 'crown' | 'lotus';

export interface OwnerRow {
  id: string;
  username: string;
  email?: string;
  display_name: string | null;
  password_hash: string;
  salt: string;
  created_at: number;
  updated_at: number;
}

export interface SessionRow {
  id: string;
  owner_id: string;
  token_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: number;
  created_at: number;
}

export interface SecretMessageRow {
  id: string;
  slug: string;
  owner_id: string;
  recipient_name: string;
  sender_name: string;
  title: string;
  content: string;
  password_hash: string;
  password_salt: string;
  password_hint: string | null;
  theme: VisualTheme;
  envelope_seal: EnvelopeSeal;
  expires_at: number | null;
  burn_after_reading: number; // 0 or 1
  max_views: number | null;
  view_count: number;
  is_burned: number; // 0 or 1
  created_at: number;
  updated_at: number;
  last_unlocked_at: number | null;
}

export interface UnlockAttemptRow {
  id: string;
  message_id: string;
  ip_hash: string;
  success: number;
  attempted_at: number;
}

export interface MessageAssetRow {
  id: string;
  message_id: string;
  asset_type: string;
  mime_type: string;
  file_name: string | null;
  file_size: number;
  data_base64: string;
  created_at: number;
}

// Cloudflare Workers Environment bindings
export interface Env {
  DB: D1Database;
  ENVIRONMENT?: string;
  MAX_ATTEMPTS_PER_WINDOW?: string;
  RATE_LIMIT_WINDOW_SECONDS?: string;
  ASSETS?: Fetcher;
}

// Public view info (Safe to send BEFORE password unlock)
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

// Unlocked content (Returned ONLY AFTER valid password verification)
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
