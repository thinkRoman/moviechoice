import { randomInt, scryptSync, timingSafeEqual } from 'crypto';

/**
 * Normalize a phone number to E.164 canonical format.
 * Examples:
 *   "+919876543210" -> "+919876543210"
 *   "919876543210"   -> "+919876543210"
 *   "+1 415-555-0123" -> "+14155550123"
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  // If starts with country code without +, prefix it
  if (/^\+?\d{10,15}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return cleaned;
}

/**
 * Generate a cryptographically secure 6-digit OTP.
 */
export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

/**
 * Hash an OTP code with a random salt using scrypt.
 * Returns { hash, salt } as hex strings.
 */
export function hashOtp(otp: string): { hash: string; salt: string } {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Buffer.from(salt).toString('hex');
  const hash = scryptSync(otp, saltHex, 64, { N: 32768, r: 8, p: 1 });
  return { hash: hash.toString('hex'), salt: saltHex };
}

/**
 * Verify an OTP code against a stored hash.
 * Returns true if the code matches.
 */
export function verifyOtp(otp: string, storedHash: string, salt: string): boolean {
  const computed = scryptSync(otp, salt, 64, { N: 32768, r: 8, p: 1 });
  const computedHash = computed.toString('hex');
  if (computedHash.length !== storedHash.length) return false;
  const storedBuffer = Buffer.from(storedHash, 'hex');
  const computedBuffer = Buffer.from(computedHash, 'hex');
  return timingSafeEqual(computedBuffer, storedBuffer);
}

/**
 * Resend cooldown in milliseconds (default 60 seconds).
 */
export const RESEND_COOLDOWN_MS = 60 * 1000;

/**
 * OTP expiration in milliseconds (default 5 minutes).
 */
export const OTP_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Maximum verification attempts before blocking.
 */
export const MAX_ATTEMPTS = 5;

/**
 * Rate limit: max OTP requests per phone number per window.
 */
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 10;
