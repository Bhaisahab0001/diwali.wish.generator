-- DiwaliVerse Secret Messages
-- Cloudflare D1 SQLite Migration: 0001_initial.sql

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- 1. Owners table (Authentication & Admin Control)
CREATE TABLE IF NOT EXISTS owners (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_owners_email ON owners(email);

-- 2. Sessions table (Secure cookie/bearer session tokens)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_owner_id ON sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 3. Secret Messages table (Core password-protected messages)
CREATE TABLE IF NOT EXISTS secret_messages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_hint TEXT,
  theme TEXT NOT NULL DEFAULT 'midnight-starlight',
  envelope_seal TEXT NOT NULL DEFAULT 'heart',
  expires_at INTEGER,
  burn_after_reading INTEGER NOT NULL DEFAULT 0,
  max_views INTEGER DEFAULT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_burned INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_unlocked_at INTEGER,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_slug ON secret_messages(slug);
CREATE INDEX IF NOT EXISTS idx_messages_owner_id ON secret_messages(owner_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON secret_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON secret_messages(expires_at);

-- 4. Unlock Attempts table (Rate limiting and security auditing)
CREATE TABLE IF NOT EXISTS unlock_attempts (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  success INTEGER NOT NULL,
  attempted_at INTEGER NOT NULL,
  FOREIGN KEY (message_id) REFERENCES secret_messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_unlock_attempts_msg_ip ON unlock_attempts(message_id, ip_hash, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_unlock_attempts_time ON unlock_attempts(attempted_at DESC);

-- 5. Message Assets table (Secure image attachments stored with messages)
CREATE TABLE IF NOT EXISTS message_assets (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'image',
  mime_type TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER NOT NULL,
  data_base64 TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (message_id) REFERENCES secret_messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_message_assets_message_id ON message_assets(message_id);
