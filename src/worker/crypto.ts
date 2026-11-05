/**
 * Cryptographic security utilities for DiwaliVerse Secret Messages
 * Uses 100% standard Web Crypto API (crypto.subtle), fully supported
 * by Cloudflare Workers, Node.js 18+, and standard browsers.
 */

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32; // 256 bits

/**
 * Converts ArrayBuffer or Uint8Array to hexadecimal string
 */
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Converts hexadecimal string to Uint8Array
 */
export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generates cryptographically secure random hexadecimal salt
 */
export function generateSalt(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes);
}

/**
 * Generates an unpredictable URL slug
 */
export function generateSlug(prefix = 'm_'): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${prefix}${base64}`;
}

/**
 * Generates a secure random session token
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes);
}

/**
 * Computes SHA-256 hash (hex) of a string or buffer
 */
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Hashes a password using PBKDF2-HMAC-SHA256 with 100,000 iterations
 */
export async function hashPassword(password: string, existingSalt?: string): Promise<{ hash: string; salt: string }> {
  const saltHex = existingSalt || generateSalt(16);
  const saltBytes = hexToBuffer(saltHex);
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as any,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  return {
    hash: bufferToHex(derivedKey),
    salt: saltHex,
  };
}

/**
 * Constant-time comparison to prevent timing side-channel attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Verifies password against stored PBKDF2 hash and salt
 */
export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash: computedHash } = await hashPassword(password, salt);
  return constantTimeCompare(computedHash, storedHash);
}
