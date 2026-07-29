/**
 * Tests for OTP utility functions: phone normalization, OTP generation, hashing, constants.
 */

import { describe, it, expect } from 'vitest';
import { normalizePhone, generateOtp, hashOtp, verifyOtp, MAX_ATTEMPTS, OTP_EXPIRY_MS, RESEND_COOLDOWN_MS, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from '@/lib/otp';

describe('normalizePhone', () => {
  it('passes through already-normalized E.164', () => {
    expect(normalizePhone('+919876543210')).toBe('+919876543210');
  });

  it('strips spaces from E.164 number', () => {
    expect(normalizePhone('+91 98765 43210')).toBe('+919876543210');
  });

  it('strips dashes from E.164 number', () => {
    expect(normalizePhone('+1-202-555-0100')).toBe('+12025550100');
  });

  it('strips parentheses from phone number', () => {
    expect(normalizePhone('+1 (202) 555-0100')).toBe('+12025550100');
  });

  it('prefixes + to plain 10+ digit numbers', () => {
    expect(normalizePhone('2025550100')).toBe('+2025550100');
  });

  it('prefixes + to 11 digit numbers without leading +', () => {
    expect(normalizePhone('98765432101')).toBe('+98765432101');
  });

  it('handles whatsapp: prefix (normalizePhone does NOT strip it — caller handles it)', () => {
    expect(normalizePhone('whatsapp:+919876543210')).toBe('whatsapp:+919876543210');
  });

  it('returns short numbers as-is (invalid)', () => {
    expect(normalizePhone('12345')).toBe('12345');
    expect(normalizePhone('')).toBe('');
  });
});

describe('generateOtp', () => {
  it('generates a 6-digit numeric string', () => {
    const otp = generateOtp();
    expect(otp).toHaveLength(6);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('generates values within 100000-999999 range', () => {
    for (let i = 0; i < 1000; i++) {
      const otp = generateOtp();
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });

  it('generates unique values on repeated calls', () => {
    const otps = new Set<string>();
    for (let i = 0; i < 100; i++) {
      otps.add(generateOtp());
    }
    expect(otps.size).toBeGreaterThan(90);
  });
});

describe('hashOtp and verifyOtp — production helpers', () => {
  it('correctly verifies a matching OTP', () => {
    const otp = '123456';
    const { hash, salt } = hashOtp(otp);
    expect(verifyOtp(otp, hash, salt)).toBe(true);
  });

  it('rejects a wrong OTP', () => {
    const { hash, salt } = hashOtp('123456');
    expect(verifyOtp('654321', hash, salt)).toBe(false);
  });

  it('different salts produce different hashes for the same OTP', () => {
    const otp = '123456';
    const { hash: hash1 } = hashOtp(otp);
    const { hash: hash2 } = hashOtp(otp);
    expect(hash1).not.toBe(hash2);
  });

  it('hash and salt are hex strings', () => {
    const { hash, salt } = hashOtp('123456');
    expect(hash).toMatch(/^[0-9a-fA-F]+$/);
    expect(salt).toMatch(/^[0-9a-fA-F]+$/);
  });
});

describe('OTP constants', () => {
  it('MAX_ATTEMPTS is 5', () => {
    expect(MAX_ATTEMPTS).toBe(5);
  });

  it('OTP_EXPIRY_MS is 5 minutes', () => {
    expect(OTP_EXPIRY_MS).toBe(5 * 60 * 1000);
  });

  it('RESEND_COOLDOWN_MS is 60 seconds', () => {
    expect(RESEND_COOLDOWN_MS).toBe(60 * 1000);
  });

  it('RATE_LIMIT_WINDOW_MS is 15 minutes', () => {
    expect(RATE_LIMIT_WINDOW_MS).toBe(15 * 60 * 1000);
  });

  it('RATE_LIMIT_MAX_REQUESTS is 10', () => {
    expect(RATE_LIMIT_MAX_REQUESTS).toBe(10);
  });
});
