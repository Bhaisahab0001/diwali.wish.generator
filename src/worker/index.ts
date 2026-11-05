/**
 * DiwaliVerse — Secret Messages
 * Cloudflare Workers API Entry Point
 * 100% Native Cloudflare Workers Runtime & D1 SQLite binding (DB)
 */

import {
  bufferToHex,
  generateSalt,
  generateSessionToken,
  generateSlug,
  hashPassword,
  sha256,
  verifyPassword,
} from './crypto.ts';
import type {
  Env,
  MessageAssetRow,
  OwnerRow,
  PublicMessageMetadata,
  SecretMessageRow,
  SessionRow,
  UnlockedMessageData,
  VisualTheme,
  EnvelopeSeal,
} from './types.ts';

const RATE_LIMIT_WINDOW_SECONDS = 900; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE_BYTES = 2.5 * 1024 * 1024; // 2.5 MB

/**
 * Standard JSON response helper with security headers
 */
function json(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'no-store, max-age=0',
      ...headers,
    },
  });
}

function errorJson(message: string, status = 400, extra: Record<string, any> = {}): Response {
  return json({ success: false, error: message, ...extra }, status);
}

/**
 * Parses client IP address from Cloudflare / standard proxy headers
 */
function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  const xForwarded = request.headers.get('x-forwarded-for');
  if (xForwarded) return xForwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '127.0.0.1';
}

/**
 * Extracts session token from Cookie header or Authorization Bearer header
 */
function extractSessionToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith('dv_session=')) {
        return c.substring('dv_session='.length);
      }
    }
  }

  return null;
}

/**
 * Authenticates request and returns the active owner
 */
async function authenticateOwner(request: Request, env: Env): Promise<OwnerRow | null> {
  const token = extractSessionToken(request);
  if (!token) return null;

  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);

  const session = await env.DB.prepare(
    `SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ? LIMIT 1`
  )
    .bind(tokenHash, now)
    .first<SessionRow>();

  if (!session) return null;

  const owner = await env.DB.prepare(`SELECT * FROM owners WHERE id = ? LIMIT 1`)
    .bind(session.owner_id)
    .first<OwnerRow>();

  return owner || null;
}

/**
 * Main Cloudflare Worker request handler
 */
export default {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle preflight CORS if needed
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only process /api/* routes here; everything else served by ASSETS binding
    if (!path.startsWith('/api')) {
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
      return new Response('Not found', { status: 404 });
    }

    try {
      // -------------------------------------------------------------
      // 1. HEALTH & SETUP STATUS
      // -------------------------------------------------------------
      if (path === '/api/health' && method === 'GET') {
        return json({
          status: 'ok',
          service: 'DiwaliVerse Secret Messages API',
          timestamp: Date.now(),
        });
      }

      if (path === '/api/auth/status' && method === 'GET') {
        const currentOwner = await authenticateOwner(request, env);

        return json({
          success: true,
          setup_required: false, // Standard registration is open to any user
          authenticated: !!currentOwner,
          owner: currentOwner
            ? {
                id: currentOwner.id,
                email: currentOwner.email || currentOwner.username,
                username: currentOwner.username,
                display_name: currentOwner.display_name,
                created_at: currentOwner.created_at,
              }
            : null,
        });
      }

      // -------------------------------------------------------------
      // 2. OWNER REGISTRATION (Full Name, Email, Password, Confirm Password)
      // -------------------------------------------------------------
      if (path === '/api/auth/register' && method === 'POST') {
        const body = await request.json().catch(() => null);
        if (!body) return errorJson('Invalid JSON payload');

        const fullName = String(body.full_name || body.display_name || '').trim();
        const email = String(body.email || body.username || '').trim().toLowerCase();
        const password = String(body.password || '');
        const confirmPassword = String(body.confirm_password || body.password || '');

        if (!fullName || fullName.length < 2) {
          return errorJson('Please enter your full name (at least 2 characters)');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          return errorJson('Please enter a valid email address');
        }

        if (!password || password.length < 8) {
          return errorJson('Password must be at least 8 characters long');
        }

        if (password !== confirmPassword) {
          return errorJson('Passwords do not match. Please re-enter your password.');
        }

        // Check if email is already registered
        const existing = await env.DB.prepare(
          `SELECT id FROM owners WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1`
        )
          .bind(email, email)
          .first();

        if (existing) {
          return errorJson('An account with this email address is already registered. Please sign in.', 409);
        }

        const ownerId = `usr_${crypto.randomUUID()}`;
        const { hash: passwordHash, salt } = await hashPassword(password);
        const now = Math.floor(Date.now() / 1000);

        await env.DB.prepare(
          `INSERT INTO owners (id, username, email, display_name, password_hash, salt, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(ownerId, email, email, fullName, passwordHash, salt, now, now)
          .run();

        return json(
          {
            success: true,
            message: 'Your account has been created successfully! Please sign in with your credentials.',
            email,
          },
          201
        );
      }

      // -------------------------------------------------------------
      // 3. OWNER LOGIN (Email / Username + Password)
      // -------------------------------------------------------------
      if (path === '/api/auth/login' && method === 'POST') {
        const body = await request.json().catch(() => null);
        if (!body) return errorJson('Invalid JSON payload');

        const identifier = String(body.email || body.username || '').trim().toLowerCase();
        const password = String(body.password || '');

        if (!identifier || !password) {
          return errorJson('Email and password are required');
        }

        const owner = await env.DB.prepare(
          `SELECT * FROM owners WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1`
        )
          .bind(identifier, identifier)
          .first<OwnerRow>();

        if (!owner) {
          return errorJson('Invalid email or password. Please check your credentials.', 401);
        }

        const isValid = await verifyPassword(password, owner.password_hash, owner.salt);
        if (!isValid) {
          return errorJson('Invalid email or password. Please check your credentials.', 401);
        }

        // Create new session
        const rawToken = generateSessionToken();
        const tokenHash = await sha256(rawToken);
        const sessionId = `ses_${crypto.randomUUID()}`;
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = now + SESSION_TTL_SECONDS;
        const userAgent = request.headers.get('user-agent') || '';
        const ip = getClientIp(request);

        await env.DB.prepare(
          `INSERT INTO sessions (id, owner_id, token_hash, user_agent, ip_address, expires_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(sessionId, owner.id, tokenHash, userAgent.substring(0, 255), ip, expiresAt, now)
          .run();

        const cookieValue = `dv_session=${rawToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;

        return json(
          {
            success: true,
            message: 'Signed in successfully',
            token: rawToken,
            owner: {
              id: owner.id,
              email: owner.email || owner.username,
              username: owner.username,
              display_name: owner.display_name,
            },
          },
          200,
          { 'Set-Cookie': cookieValue }
        );
      }

      // -------------------------------------------------------------
      // 4. OWNER LOGOUT
      // -------------------------------------------------------------
      if (path === '/api/auth/logout' && method === 'POST') {
        const token = extractSessionToken(request);
        if (token) {
          const tokenHash = await sha256(token);
          await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run();
        }

        const expiredCookie = `dv_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        return json({ success: true, message: 'Logged out successfully' }, 200, {
          'Set-Cookie': expiredCookie,
        });
      }

      // -------------------------------------------------------------
      // 5. CURRENT OWNER PROFILE (GET /api/auth/me)
      // -------------------------------------------------------------
      if (path === '/api/auth/me' && method === 'GET') {
        const owner = await authenticateOwner(request, env);
        if (!owner) {
          return errorJson('Unauthorized', 401);
        }

        return json({
          success: true,
          owner: {
            id: owner.id,
            username: owner.username,
            display_name: owner.display_name,
            created_at: owner.created_at,
          },
        });
      }

      // -------------------------------------------------------------
      // 6. OWNER MESSAGES LIST (GET /api/messages)
      // -------------------------------------------------------------
      if (path === '/api/messages' && method === 'GET') {
        const owner = await authenticateOwner(request, env);
        if (!owner) return errorJson('Unauthorized', 401);

        // Fetch all messages belonging to this owner with asset counts
        const query = `
          SELECT 
            m.id, m.slug, m.recipient_name, m.sender_name, m.title,
            m.password_hint, m.theme, m.envelope_seal, m.expires_at,
            m.burn_after_reading, m.max_views, m.view_count, m.is_burned,
            m.created_at, m.updated_at, m.last_unlocked_at,
            (SELECT COUNT(*) FROM message_assets a WHERE a.message_id = m.id) as has_image
          FROM secret_messages m
          WHERE m.owner_id = ?
          ORDER BY m.created_at DESC
        `;

        const { results } = await env.DB.prepare(query).bind(owner.id).all();
        const now = Math.floor(Date.now() / 1000);

        const messages = (results || []).map((row: any) => {
          const isExpired = row.expires_at ? now > row.expires_at : false;
          const isBurned = Boolean(row.is_burned);
          let status = 'active';
          if (isBurned) status = 'burned';
          else if (isExpired) status = 'expired';
          else if (row.view_count > 0) status = 'opened';

          return {
            id: row.id,
            slug: row.slug,
            recipient_name: row.recipient_name,
            sender_name: row.sender_name,
            title: row.title,
            password_hint: row.password_hint,
            theme: row.theme,
            envelope_seal: row.envelope_seal,
            expires_at: row.expires_at,
            burn_after_reading: Boolean(row.burn_after_reading),
            max_views: row.max_views,
            view_count: row.view_count,
            is_burned: isBurned,
            is_expired: isExpired,
            status,
            has_image: Number(row.has_image) > 0,
            created_at: row.created_at,
            updated_at: row.updated_at,
            last_unlocked_at: row.last_unlocked_at,
          };
        });

        return json({ success: true, messages });
      }

      // -------------------------------------------------------------
      // 7. CREATE SECRET MESSAGE (POST /api/messages)
      // -------------------------------------------------------------
      if (path === '/api/messages' && method === 'POST') {
        const owner = await authenticateOwner(request, env);
        if (!owner) return errorJson('Unauthorized', 401);

        const body = await request.json().catch(() => null);
        if (!body) return errorJson('Invalid JSON payload');

        const {
          recipient_name,
          sender_name,
          title,
          content,
          password,
          password_hint,
          theme,
          envelope_seal,
          expires_in_hours,
          burn_after_reading,
          max_views,
          image, // { data_base64, mime_type, file_name }
        } = body;

        // Validations
        if (!recipient_name || typeof recipient_name !== 'string' || !recipient_name.trim()) {
          return errorJson('Recipient name is required');
        }
        if (!content || typeof content !== 'string' || !content.trim()) {
          return errorJson('Secret message content cannot be empty');
        }
        if (content.length > 50000) {
          return errorJson('Message content exceeds maximum allowed limit (50,000 characters)');
        }
        if (!password || typeof password !== 'string' || password.length < 4) {
          return errorJson('A secret password (at least 4 characters) is required to lock this message');
        }

        // Validate image attachment if provided
        if (image) {
          if (!image.mime_type || !ALLOWED_MIME_TYPES.includes(image.mime_type.toLowerCase())) {
            return errorJson('Invalid image format. Allowed: PNG, JPEG, WEBP, GIF');
          }
          if (!image.data_base64 || typeof image.data_base64 !== 'string') {
            return errorJson('Invalid image data format');
          }
          // Rough base64 size check
          const approxSizeBytes = Math.round((image.data_base64.length * 3) / 4);
          if (approxSizeBytes > MAX_IMAGE_SIZE_BYTES) {
            return errorJson('Image file size exceeds the 2.5MB limit');
          }
        }

        const now = Math.floor(Date.now() / 1000);
        const messageId = `msg_${crypto.randomUUID()}`;
        const slug = generateSlug();
        const { hash: passwordHash, salt: passwordSalt } = await hashPassword(password);

        let expiresAt: number | null = null;
        if (expires_in_hours && typeof expires_in_hours === 'number' && expires_in_hours > 0) {
          expiresAt = now + Math.round(expires_in_hours * 3600);
        }

        const validTheme = [
          'midnight-starlight',
          'enchanted-rose',
          'royal-lavender',
          'golden-diya',
          'celestial-moon',
          'vintage-parchment',
        ].includes(theme)
          ? theme
          : 'midnight-starlight';

        const validSeal = ['heart', 'diya', 'star', 'rose', 'crown', 'lotus'].includes(envelope_seal)
          ? envelope_seal
          : 'heart';

        await env.DB.prepare(
          `INSERT INTO secret_messages (
            id, slug, owner_id, recipient_name, sender_name, title, content,
            password_hash, password_salt, password_hint, theme, envelope_seal,
            expires_at, burn_after_reading, max_views, view_count, is_burned,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`
        )
          .bind(
            messageId,
            slug,
            owner_id(owner),
            recipient_name.trim(),
            (sender_name || owner.display_name || 'A Secret Admirer').trim(),
            (title || 'A Secret Message for You').trim(),
            content,
            passwordHash,
            passwordSalt,
            password_hint ? password_hint.trim() : null,
            validTheme,
            validSeal,
            expiresAt,
            burn_after_reading ? 1 : 0,
            max_views && typeof max_views === 'number' ? Math.max(1, max_views) : null,
            now,
            now
          )
          .run();

        // Store attachment if present
        if (image) {
          const assetId = `ast_${crypto.randomUUID()}`;
          const fileSize = Math.round((image.data_base64.length * 3) / 4);

          await env.DB.prepare(
            `INSERT INTO message_assets (id, message_id, asset_type, mime_type, file_name, file_size, data_base64, created_at)
             VALUES (?, ?, 'image', ?, ?, ?, ?, ?)`
          )
            .bind(
              assetId,
              messageId,
              image.mime_type.toLowerCase(),
              image.file_name ? String(image.file_name).substring(0, 100) : 'attachment',
              fileSize,
              image.data_base64,
              now
            )
            .run();
        }

        return json(
          {
            success: true,
            message: 'Your little secret has been sealed successfully! ❤️',
            data: {
              id: messageId,
              slug,
              share_path: `/m/${slug}`,
              recipient_name: recipient_name.trim(),
              sender_name: (sender_name || owner.display_name || 'A Secret Admirer').trim(),
              title: (title || 'A Secret Message for You').trim(),
              content,
              theme: validTheme,
              envelope_seal: validSeal,
              password_hint: password_hint ? password_hint.trim() : null,
              burn_after_reading: Boolean(burn_after_reading),
              max_views: max_views && typeof max_views === 'number' ? Math.max(1, max_views) : null,
              expires_at: expiresAt,
              created_at: now,
              image: image
                ? {
                    mime_type: image.mime_type,
                    file_name: image.file_name,
                    data_base64: image.data_base64,
                  }
                : null,
            },
          },
          201
        );
      }

      // Helper function for owner id
      function owner_id(o: OwnerRow) {
        return o.id;
      }

      // -------------------------------------------------------------
      // 8. OWNER GET SINGLE MESSAGE FOR EDITING (GET /api/messages/:id)
      // -------------------------------------------------------------
      const singleMessageMatch = path.match(/^\/api\/messages\/([a-zA-Z0-9_\-]+)$/);
      if (singleMessageMatch && method === 'GET') {
        const owner = await authenticateOwner(request, env);
        if (!owner) return errorJson('Unauthorized', 401);

        const messageId = singleMessageMatch[1];
        const msg = await env.DB.prepare(`SELECT * FROM secret_messages WHERE id = ? AND owner_id = ? LIMIT 1`)
          .bind(messageId, owner.id)
          .first<SecretMessageRow>();

        if (!msg) return errorJson('Message not found', 404);

        const asset = await env.DB.prepare(
          `SELECT mime_type, file_name, file_size, data_base64 FROM message_assets WHERE message_id = ? LIMIT 1`
        )
          .bind(messageId)
          .first<MessageAssetRow>();

        return json({
          success: true,
          message: {
            ...msg,
            password_hash: undefined, // Never expose password hash!
            password_salt: undefined,
            burn_after_reading: Boolean(msg.burn_after_reading),
            is_burned: Boolean(msg.is_burned),
            image: asset
              ? {
                  mime_type: asset.mime_type,
                  file_name: asset.file_name,
                  file_size: asset.file_size,
                  data_base64: asset.data_base64,
                }
              : null,
          },
        });
      }

      // -------------------------------------------------------------
      // 9. OWNER UPDATE MESSAGE (PUT /api/messages/:id)
      // -------------------------------------------------------------
      if (singleMessageMatch && method === 'PUT') {
        const owner = await authenticateOwner(request, env);
        if (!owner) return errorJson('Unauthorized', 401);

        const messageId = singleMessageMatch[1];
        const existing = await env.DB.prepare(`SELECT * FROM secret_messages WHERE id = ? AND owner_id = ? LIMIT 1`)
          .bind(messageId, owner.id)
          .first<SecretMessageRow>();

        if (!existing) return errorJson('Message not found', 404);

        const body = await request.json().catch(() => null);
        if (!body) return errorJson('Invalid JSON payload');

        const {
          recipient_name,
          sender_name,
          title,
          content,
          new_password,
          password_hint,
          theme,
          envelope_seal,
          burn_after_reading,
          max_views,
          image,
          remove_image,
        } = body;

        const now = Math.floor(Date.now() / 1000);

        let passwordHash = existing.password_hash;
        let passwordSalt = existing.password_salt;

        if (new_password && typeof new_password === 'string' && new_password.trim().length >= 4) {
          const hashed = await hashPassword(new_password.trim());
          passwordHash = hashed.hash;
          passwordSalt = hashed.salt;
        }

        const updatedTheme = theme || existing.theme;
        const updatedSeal = envelope_seal || existing.envelope_seal;

        await env.DB.prepare(
          `UPDATE secret_messages
           SET recipient_name = ?,
               sender_name = ?,
               title = ?,
               content = ?,
               password_hash = ?,
               password_salt = ?,
               password_hint = ?,
               theme = ?,
               envelope_seal = ?,
               burn_after_reading = ?,
               max_views = ?,
               updated_at = ?
           WHERE id = ? AND owner_id = ?`
        )
          .bind(
            recipient_name ? recipient_name.trim() : existing.recipient_name,
            sender_name ? sender_name.trim() : existing.sender_name,
            title ? title.trim() : existing.title,
            content !== undefined ? content : existing.content,
            passwordHash,
            passwordSalt,
            password_hint !== undefined ? password_hint : existing.password_hint,
            updatedTheme,
            updatedSeal,
            burn_after_reading !== undefined ? (burn_after_reading ? 1 : 0) : existing.burn_after_reading,
            max_views !== undefined ? max_views : existing.max_views,
            now,
            messageId,
            owner.id
          )
          .run();

        // Handle image updates
        if (remove_image) {
          await env.DB.prepare(`DELETE FROM message_assets WHERE message_id = ?`).bind(messageId).run();
        } else if (image && image.data_base64) {
          await env.DB.prepare(`DELETE FROM message_assets WHERE message_id = ?`).bind(messageId).run();
          const assetId = `ast_${crypto.randomUUID()}`;
          const fileSize = Math.round((image.data_base64.length * 3) / 4);

          await env.DB.prepare(
            `INSERT INTO message_assets (id, message_id, asset_type, mime_type, file_name, file_size, data_base64, created_at)
             VALUES (?, ?, 'image', ?, ?, ?, ?, ?)`
          )
            .bind(
              assetId,
              messageId,
              image.mime_type || 'image/jpeg',
              image.file_name || 'attachment',
              fileSize,
              image.data_base64,
              now
            )
            .run();
        }

        return json({ success: true, message: 'Message updated successfully' });
      }

      // -------------------------------------------------------------
      // 10. OWNER DELETE MESSAGE (DELETE /api/messages/:id)
      // -------------------------------------------------------------
      if (singleMessageMatch && method === 'DELETE') {
        const owner = await authenticateOwner(request, env);
        if (!owner) return errorJson('Unauthorized', 401);

        const messageId = singleMessageMatch[1];
        const res = await env.DB.prepare(`DELETE FROM secret_messages WHERE id = ? AND owner_id = ?`)
          .bind(messageId, owner.id)
          .run();

        return json({ success: true, message: 'Message deleted successfully' });
      }

      // -------------------------------------------------------------
      // 11. OWNER DUPLICATE MESSAGE (POST /api/messages/:id/duplicate)
      // -------------------------------------------------------------
      const duplicateMatch = path.match(/^\/api\/messages\/([a-zA-Z0-9_\-]+)\/duplicate$/);
      if (duplicateMatch && method === 'POST') {
        const owner = await authenticateOwner(request, env);
        if (!owner) return errorJson('Unauthorized', 401);

        const sourceId = duplicateMatch[1];
        const original = await env.DB.prepare(`SELECT * FROM secret_messages WHERE id = ? AND owner_id = ? LIMIT 1`)
          .bind(sourceId, owner.id)
          .first<SecretMessageRow>();

        if (!original) return errorJson('Source message not found', 404);

        const newId = `msg_${crypto.randomUUID()}`;
        const newSlug = generateSlug();
        const now = Math.floor(Date.now() / 1000);

        await env.DB.prepare(
          `INSERT INTO secret_messages (
            id, slug, owner_id, recipient_name, sender_name, title, content,
            password_hash, password_salt, password_hint, theme, envelope_seal,
            expires_at, burn_after_reading, max_views, view_count, is_burned,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`
        )
          .bind(
            newId,
            newSlug,
            owner.id,
            `${original.recipient_name} (Copy)`,
            original.sender_name,
            original.title,
            original.content,
            original.password_hash,
            original.password_salt,
            original.password_hint,
            original.theme,
            original.envelope_seal,
            original.expires_at,
            original.burn_after_reading,
            original.max_views,
            now,
            now
          )
          .run();

        // Copy assets if any
        const asset = await env.DB.prepare(`SELECT * FROM message_assets WHERE message_id = ? LIMIT 1`)
          .bind(sourceId)
          .first<MessageAssetRow>();

        if (asset) {
          const newAssetId = `ast_${crypto.randomUUID()}`;
          await env.DB.prepare(
            `INSERT INTO message_assets (id, message_id, asset_type, mime_type, file_name, file_size, data_base64, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              newAssetId,
              newId,
              asset.asset_type,
              asset.mime_type,
              asset.file_name,
              asset.file_size,
              asset.data_base64,
              now
            )
            .run();
        }

        return json({
          success: true,
          message: 'Message duplicated successfully',
          data: {
            id: newId,
            slug: newSlug,
            share_path: `/m/${newSlug}`,
          },
        });
      }

      // -------------------------------------------------------------
      // 12. PUBLIC VIEW PREVIEW METADATA (GET /api/public/message/:slug)
      // NEVER returns content or password!
      // -------------------------------------------------------------
      const publicSlugMatch = path.match(/^\/api\/public\/message\/([a-zA-Z0-9_\-]+)$/);
      if (publicSlugMatch && method === 'GET') {
        const slug = publicSlugMatch[1];
        const msg = await env.DB.prepare(`SELECT * FROM secret_messages WHERE slug = ? LIMIT 1`)
          .bind(slug)
          .first<SecretMessageRow>();

        if (!msg) {
          return errorJson('This secret message does not exist or has been removed.', 404);
        }

        const now = Math.floor(Date.now() / 1000);
        const isExpired = msg.expires_at ? now > msg.expires_at : false;
        const isBurned = Boolean(msg.is_burned);

        // Check rate limiting status for this client IP
        const clientIp = getClientIp(request);
        const ipHash = await sha256(clientIp);
        const windowStart = now - RATE_LIMIT_WINDOW_SECONDS;

        const failedAttemptsResult = await env.DB.prepare(
          `SELECT COUNT(*) as count, MAX(attempted_at) as last_attempt
           FROM unlock_attempts 
           WHERE message_id = ? AND ip_hash = ? AND success = 0 AND attempted_at > ?`
        )
          .bind(msg.id, ipHash, windowStart)
          .first<{ count: number; last_attempt: number | null }>();

        const failedCount = failedAttemptsResult?.count ?? 0;
        const isLockedOut = failedCount >= MAX_FAILED_ATTEMPTS;
        let lockoutSecondsRemaining = 0;

        if (isLockedOut && failedAttemptsResult?.last_attempt) {
          const elapsed = now - failedAttemptsResult.last_attempt;
          lockoutSecondsRemaining = Math.max(0, RATE_LIMIT_WINDOW_SECONDS - elapsed);
        }

        // Check if message has an attachment
        const assetCountResult = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM message_assets WHERE message_id = ?`
        )
          .bind(msg.id)
          .first<{ count: number }>();

        const hasImage = (assetCountResult?.count ?? 0) > 0;
        const remainingViews = msg.max_views ? Math.max(0, msg.max_views - msg.view_count) : null;

        const metadata: PublicMessageMetadata = {
          slug: msg.slug,
          recipient_name: msg.recipient_name,
          sender_name: msg.sender_name,
          title: msg.title,
          theme: msg.theme,
          envelope_seal: msg.envelope_seal,
          password_hint: msg.password_hint,
          has_image: hasImage,
          is_expired: isExpired,
          is_burned: isBurned,
          burn_after_reading: Boolean(msg.burn_after_reading),
          max_views: msg.max_views,
          view_count: msg.view_count,
          remaining_views: remainingViews,
          expires_at: msg.expires_at,
          created_at: msg.created_at,
          attempts_remaining: Math.max(0, MAX_FAILED_ATTEMPTS - failedCount),
          is_locked_out: isLockedOut,
          lockout_seconds_remaining: lockoutSecondsRemaining,
        };

        return json({ success: true, metadata });
      }

      // -------------------------------------------------------------
      // 13. PUBLIC MESSAGE UNLOCK (POST /api/public/message/:slug/unlock)
      // Rate-limited, password verified, returns secret content ONLY on success
      // -------------------------------------------------------------
      const unlockMatch = path.match(/^\/api\/public\/message\/([a-zA-Z0-9_\-]+)\/unlock$/);
      if (unlockMatch && method === 'POST') {
        const slug = unlockMatch[1];
        const msg = await env.DB.prepare(`SELECT * FROM secret_messages WHERE slug = ? LIMIT 1`)
          .bind(slug)
          .first<SecretMessageRow>();

        if (!msg) {
          return errorJson('This secret message does not exist or has been removed.', 404);
        }

        const now = Math.floor(Date.now() / 1000);

        // Check if burned or expired
        if (msg.is_burned) {
          return errorJson(
            'This secret message was set to self-destruct after being opened and is no longer available.',
            410
          );
        }
        if (msg.expires_at && now > msg.expires_at) {
          return errorJson('This secret message has expired and cannot be viewed.', 410);
        }
        if (msg.max_views && msg.view_count >= msg.max_views) {
          return errorJson('This message has reached its maximum view limit.', 410);
        }

        // Rate limiting check
        const clientIp = getClientIp(request);
        const ipHash = await sha256(clientIp);
        const windowStart = now - RATE_LIMIT_WINDOW_SECONDS;

        const failedAttemptsResult = await env.DB.prepare(
          `SELECT COUNT(*) as count, MAX(attempted_at) as last_attempt
           FROM unlock_attempts 
           WHERE message_id = ? AND ip_hash = ? AND success = 0 AND attempted_at > ?`
        )
          .bind(msg.id, ipHash, windowStart)
          .first<{ count: number; last_attempt: number | null }>();

        const failedCount = failedAttemptsResult?.count ?? 0;

        if (failedCount >= MAX_FAILED_ATTEMPTS) {
          const lastAttempt = failedAttemptsResult?.last_attempt || now;
          const elapsed = now - lastAttempt;
          const remainingSeconds = Math.max(1, RATE_LIMIT_WINDOW_SECONDS - elapsed);
          return errorJson(
            `Too many incorrect password attempts. For security, access is temporarily locked. Please try again in ${Math.ceil(
              remainingSeconds / 60
            )} minutes.`,
            429,
            { lockout_seconds_remaining: remainingSeconds }
          );
        }

        const body = await request.json().catch(() => null);
        const password = body?.password;

        if (!password || typeof password !== 'string') {
          return errorJson('Password is required to unlock this message', 400);
        }

        // Constant-time PBKDF2 password verification
        const isValid = await verifyPassword(password, msg.password_hash, msg.password_salt);

        const attemptId = `att_${crypto.randomUUID()}`;

        if (!isValid) {
          // Record failed attempt
          await env.DB.prepare(
            `INSERT INTO unlock_attempts (id, message_id, ip_hash, success, attempted_at)
             VALUES (?, ?, ?, 0, ?)`
          )
            .bind(attemptId, msg.id, ipHash, now)
            .run();

          const attemptsRemaining = Math.max(0, MAX_FAILED_ATTEMPTS - (failedCount + 1));
          return errorJson(
            attemptsRemaining > 0
              ? `Incorrect password. ${attemptsRemaining} attempt${
                  attemptsRemaining === 1 ? '' : 's'
                } remaining before lockout.`
              : `Incorrect password. Maximum attempts exceeded. Locked for 15 minutes.`,
            401,
            { attempts_remaining: attemptsRemaining }
          );
        }

        // Record successful attempt
        await env.DB.prepare(
          `INSERT INTO unlock_attempts (id, message_id, ip_hash, success, attempted_at)
           VALUES (?, ?, ?, 1, ?)`
        )
          .bind(attemptId, msg.id, ipHash, now)
          .run();

        // Increment view count and determine if burning
        const newViewCount = msg.view_count + 1;
        const shouldBurn = Boolean(msg.burn_after_reading) || (msg.max_views !== null && newViewCount >= msg.max_views);

        await env.DB.prepare(
          `UPDATE secret_messages
           SET view_count = ?,
               is_burned = ?,
               last_unlocked_at = ?
           WHERE id = ?`
        )
          .bind(newViewCount, shouldBurn ? 1 : 0, now, msg.id)
          .run();

        // Fetch optional image attachment
        const asset = await env.DB.prepare(
          `SELECT mime_type, file_name, data_base64 FROM message_assets WHERE message_id = ? LIMIT 1`
        )
          .bind(msg.id)
          .first<MessageAssetRow>();

        const unlockedData: UnlockedMessageData = {
          slug: msg.slug,
          recipient_name: msg.recipient_name,
          sender_name: msg.sender_name,
          title: msg.title,
          content: msg.content,
          theme: msg.theme,
          envelope_seal: msg.envelope_seal,
          created_at: msg.created_at,
          view_count: newViewCount,
          is_burned: shouldBurn,
          burn_after_reading: Boolean(msg.burn_after_reading),
          image: asset
            ? {
                mime_type: asset.mime_type,
                file_name: asset.file_name,
                data_base64: asset.data_base64,
              }
            : null,
        };

        return json({ success: true, data: unlockedData });
      }

      // If no route matched in /api
      return errorJson(`API endpoint not found: ${method} ${path}`, 404);
    } catch (err: any) {
      console.error('API Error:', err);
      return errorJson(`Internal server error: ${err?.message || 'Unknown error'}`, 500);
    }
  },
};
