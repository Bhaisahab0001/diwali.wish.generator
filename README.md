# 🪔 DiwaliVerse — Secret Messages

A romantic, mysterious, and elegant password-protected secret messages web application built with **React**, **Tailwind CSS**, and a **100% Cloudflare Workers + Cloudflare D1 (SQLite) backend**.

Featuring animated 3D envelopes, realistic breaking wax seals, starlight sparkles, floating hearts, and six visual themes, backed by zero-dependency Web Crypto PBKDF2 password security.

---

## ✨ Features

- **Private Owner Dashboard**: View all secrets with live statistics, open counts, and statuses (Active, Opened, Expired, Burned).
- **Owner Authentication**: Master password protection for creators with secure session tokens and CSRF defense.
- **Unique Random Sharing URLs**: Unpredictable cryptographically secure slugs (`/m/m_...`).
- **Individual Message Passwords**: Every secret has its own password, hashed with PBKDF2-HMAC-SHA256 (100,000 rounds) and random salt.
- **Zero Leakage Security**: Message content and attachments are strictly withheld on the server until the correct password is provided.
- **Server-Side Rate Limiting**: Maximum 5 attempts per IP with exponential lockout delay to eliminate brute-force attempts.
- **Six Visual Themes**:
  1. *Midnight Starlight* — Deep midnight navy & starlit gold
  2. *Enchanted Rose* — Deep velvet ruby & pastel rose pink
  3. *Royal Lavender* — Amethyst twilight & dreamy pastel lilac
  4. *Golden Diya* — Diwali festive obsidian, radiant gold & diya sparkles
  5. *Celestial Moon* — Abyssal cyan & moonlit silver
  6. *Vintage Parchment* — Antique noir & royal crimson wax
- **Embossed Wax Seals**: Customizable emblem stamps (💖 Heart, 🪔 Diya, ⭐ Star, 🌹 Rose, 👑 Crown, 🪷 Lotus) with organic wax drips and opening animation.
- **Burn-After-Reading & Expiry**: Self-destruct immediately after first read, or set expiration windows (1h, 24h, 3d, 7d, 30d).
- **Image Attachments**: Enclose photos or keepsakes with strict MIME validation (PNG, JPEG, WEBP, GIF, max 2.5MB).
- **Audio & Haptic Feedback**: Native Web Audio API wax crack snap and harmonic chime on breaking seal.
- **Duplicate, Edit, Delete**: Complete message lifecycle management for creators.

---

## 🏗️ Technical Architecture (Cloudflare Free Tier)

| Component | Technology | Free Tier Capability |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons | Unlimited static hosting on Cloudflare Pages |
| **Backend API** | Cloudflare Workers Runtime (`src/worker/index.ts`) | 100,000 requests/day |
| **Database** | Cloudflare D1 SQLite (`migrations/0001_initial.sql`) | 5,000,000 read rows/day, 100,000 write rows/day |
| **Cryptography** | Standard Web Crypto API (`crypto.subtle`) | Native browser & edge runtime, 0 dependencies |
| **Dev Storage** | Node 22 native `node:sqlite` (`.data/dev-d1.sqlite`) | Identical D1 queries & schema during local Vite dev |

---

## 🗄️ Database Schema & D1 Migrations

The database migration file is located in `migrations/0001_initial.sql`:

1. `owners`: Creator accounts with username, salt, and PBKDF2 hash.
2. `sessions`: Active bearer / cookie sessions with expiry and IP/agent auditing.
3. `secret_messages`: Core message records, slugs, password hashes, themes, view limits, and burn flags.
4. `unlock_attempts`: Failed & successful password attempts logged for IP rate limiting.
5. `message_assets`: Attached keepsake images linked to message IDs.

---

## 🚀 Beginner Deployment Guide for Cloudflare

### Step 1: Install Wrangler CLI and Login
```bash
npx wrangler login
```
*This opens your browser to authorize with your free Cloudflare account.*

### Step 2: Create Your Cloudflare D1 Database
```bash
npx wrangler d1 create diwaliverse_secrets_db
```
*Wrangler will output your unique `database_id`. Open `wrangler.jsonc` and replace the placeholder `database_id` with your generated ID.*

### Step 3: Run the Schema Migration
```bash
# Apply to production Cloudflare D1
npx wrangler d1 migrations apply DB --remote
```

### Step 4: Build & Deploy
```bash
# Build frontend assets
npm run build

# Deploy to Cloudflare Workers with D1 binding
npx wrangler deploy
```

---

## 🔄 GitHub Continuous Deployment (Cloudflare Pages)

1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial DiwaliVerse Secret Messages"
   git remote add origin https://github.com/<your-username>/diwaliverse-secret-messages.git
   git push -u origin main
   ```
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/):
   - Navigate to **Workers & Pages** > **Create Application** > **Pages** > **Connect to Git**.
   - Select your repository.
   - Set **Build command**: `npm run build`
   - Set **Build output directory**: `dist`
3. Under **Settings** > **Functions** > **D1 database bindings**:
   - Add variable binding name: `DB`
   - Select database: `diwaliverse_secrets_db`
4. Click **Save and Deploy**. Every Git commit will now automatically test and deploy your live app!

---

## 🔐 Security Audit Checklist

- [x] **No Plaintext Passwords**: All message passcodes and owner passwords hashed with PBKDF2 (100k rounds, 16-byte cryptographically secure random salt).
- [x] **Zero Information Disclosure**: Message body, title details, and images are never delivered in the public metadata response.
- [x] **Timing-Safe Verification**: Constant-time string comparison (`constantTimeCompare`) prevents timing attacks.
- [x] **Rate Limiting**: Server tracks failed attempts per client IP hash. Locks out after 5 failures for 15 minutes.
- [x] **Strict Authorization**: All owner endpoints strictly query `WHERE owner_id = session.owner_id`.
- [x] **Unpredictable Slugs**: 12-byte cryptographically secure pseudorandom URL slugs.
- [x] **CSRF Protection**: All mutating endpoints require `X-Requested-With: XMLHttpRequest`.
