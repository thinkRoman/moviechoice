import { randomInt, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 1, maxmem: 128 * 1024 * 1024 };

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generatePin(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashPin(pin: string): { pinHash: string; pinSalt: string } {
  const pinSalt = randomBytes(16).toString('hex');
  const pinHash = scryptSync(pin, pinSalt, 64, SCRYPT_OPTIONS).toString('hex');
  return { pinHash, pinSalt };
}

export function verifyPin(pin: string, pinHash: string, pinSalt: string): boolean {
  const candidate = scryptSync(pin, pinSalt, 64, SCRYPT_OPTIONS);
  const expected = Buffer.from(pinHash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function secureStringEqual(value: string, expected: string): boolean {
  const valueDigest = scryptSync(value, 'moviechoice-owner-pin', 64, SCRYPT_OPTIONS);
  const expectedDigest = scryptSync(expected, 'moviechoice-owner-pin', 64, SCRYPT_OPTIONS);
  return timingSafeEqual(valueDigest, expectedDigest);
}
