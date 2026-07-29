# Authentication Audit Report — MovieChoice

**Date:** 2026-07-29
**Sprint:** 1A — Authentication Architecture Audit and Repair
**Auditor:** Engineering review

---

## 1. Current Authentication Architecture

### 1.1 Overview

MovieChoice uses NextAuth 5.0.0-beta.32 with JWT session strategy. Three provider configurations exist:

- **Google OAuth** — configured but not wired to `signIn()` on the UI
- **Resend (Email)** — configured but not wired to the UI
- **Credentials (WhatsApp OTP)** — the primary auth flow

### 1.2 Identity Model (Pre-Audit)

- No `User` model existed.
- `Profile.userId` was a plain `string` — sometimes a phone-prefixed string (`whatsapp:+91...`), sometimes a raw phone number, sometimes a MongoDB ObjectId.
- `SavedList.userId` and `TasteSignal.userId` were also plain `string`.
- The canonical user ID was undefined: `session.user.id` was set from `token.sub` (JWT subject), which came from the Profile `_id` during WhatsApp auth.

### 1.3 OTP Storage (Pre-Audit)

- `VerificationCode.code` stored **plaintext OTP** in MongoDB.
- `select: false` on the `code` field partially hid it from queries, but it was still stored in cleartext.
- No attempt tracking, no one-time consumption, no resend cooldown.

---

## 2. Inconsistencies Found

### ISSUE-001: No Canonical User Model
**Priority: Critical**

- **Files:** `src/lib/auth.ts`, `src/models/Profile.ts`, `src/models/SavedList.ts`
- **Description:** No `User` document exists. Identity is split between `Profile.userId` (string) and Profile `_id` (ObjectId).
- **Root Cause:** The original design used Profile as the identity anchor.
- **Impact:** Duplicate user creation risk; inconsistent queries across collections.
- **Fix:** Created `src/models/User.ts` as the canonical identity anchor. Profile now references `User._id` via `ObjectId` ref.

### ISSUE-002: Profile.userId Inconsistent Type
**Priority: Critical**

- **Files:** `src/models/Profile.ts`
- **Description:** `userId` was `String` type in Mongoose, used as both phone-prefixed string and raw phone number.
- **Root Cause:** No explicit type or ref defined.
- **Impact:** Queries like `Profile.findOne({ userId: session.user.id })` fail when `session.user.id` is an ObjectId string but stored value is `whatsapp:+91...`.
- **Fix:** Changed `userId` to `Schema.Types.ObjectId` with `ref: 'User'` and `unique: true` index.

### ISSUE-003: Plaintext OTP Storage
**Priority: Critical**

- **Files:** `src/models/VerificationCode.ts`, `src/app/api/auth/whatsapp/send-otp/route.ts`
- **Description:** OTP stored in plaintext in `code` field.
- **Root Cause:** No hashing utility existed.
- **Impact:** Any database access exposes OTPs; violates security requirement.
- **Fix:** Added `codeHash` and `codeSalt` fields. OTP is hashed with scrypt before storage.

### ISSUE-004: No OTP Attempt Limits
**Priority: High**

- **Files:** `src/models/VerificationCode.ts`, `src/app/api/auth/whatsapp/verify-otp/route.ts`
- **Description:** No attempt count or max-attempts enforcement.
- **Root Cause:** Missing security controls in original design.
- **Impact:** Brute-force attack vector on OTP codes.
- **Fix:** Added `attemptCount`, `maxAttempts` (default 5), `lastAttemptAt` fields. Verify route checks and increments.

### ISSUE-005: No Resend Cooldown
**Priority: High**

- **Files:** `src/app/api/auth/whatsapp/send-otp/route.ts`
- **Description:** No rate limiting on OTP requests per phone number.
- **Root Cause:** Missing in original design.
- **Impact:** Potential abuse / cost overrun on WhatsApp API.
- **Fix:** Added 60-second resend cooldown and 15-minute rate limit (10 requests per window).

### ISSUE-006: No One-Time OTP Consumption
**Priority: High**

- **Files:** `src/app/api/auth/whatsapp/verify-otp/route.ts`
- **Description:** Verified OTPs could be reused to authorize multiple sessions.
- **Root Cause:** No `verified` flag check before use.
- **Impact:** Replay attack on OTP verification.
- **Fix:** OTP is marked `verified: true` and `verifiedAt` is set on successful verification. Verify route only accepts `verified: false` codes.

### ISSUE-007: No Phone Normalization
**Priority: High**

- **Files:** `src/app/api/auth/whatsapp/send-otp/route.ts`
- **Description:** Phone numbers stored as-is without E.164 normalization.
- **Root Cause:** No normalization function existed.
- **Impact:** Same number entered in different formats creates duplicate records.
- **Fix:** Added `normalizePhone()` function in `src/lib/otp.ts`. Applied in send-otp and authorize flows.

### ISSUE-008: localStorage Session Token Storage
**Priority: Critical**

- **Files:** `src/app/signin/page.tsx`
- **Description:** `localStorage.setItem('sessionToken', data.sessionToken)` stores auth token in client-side storage.
- **Root Cause:** Misunderstanding of NextAuth session mechanism.
- **Impact:** XSS vulnerability — any script can read session tokens.
- **Fix:** Removed localStorage usage. Session is managed entirely through NextAuth HTTP-only cookies via `SessionProvider`.

### ISSUE-009: Google SignIn Button Not Wired
**Priority: High**

- **Files:** `src/app/signin/page.tsx`
- **Description:** Google sign-in button was a static `<button>` that did not call `signIn('google', ...)`.
- **Root Cause:** UI component was not integrated with NextAuth.
- **Impact:** Google sign-in appears functional but does nothing.
- **Fix:** Wired button to `signIn('google', { callbackUrl: '/' })`.

### ISSUE-10: Resend Provider in Production Code
**Priority: Medium**

- **Files:** `src/lib/auth.ts`
- **Description:** Resend email provider imported and configured but not functional for the app.
- **Root Cause:** Leftover from initial scaffolding.
- **Impact:** Confusion; potential for unused dependency in production bundle.
- **Fix:** Removed Resend provider (kept Credentials and Google).

### ISSUE-11: Profile Creation During Google Callback
**Priority: Medium**

- **Files:** `src/lib/auth.ts`
- **Description:** Google signIn callback creates Profile using `user.id` (Google sub) as userId, which doesn't match the canonical User pattern.
- **Root Cause:** No User model existed at the time.
- **Impact:** Google users get profiles with non-canonical userId.
- **Fix:** Google callback now creates/links a canonical User document first, then creates Profile with `User._id.toString()`.

### ISSUE-12: No Zod Validation on API Routes
**Priority: Medium**

- **Files:** `src/app/api/user/profile/route.ts`, `src/app/api/auth/whatsapp/send-otp/route.ts`, `src/app/api/auth/whatsapp/verify-otp/route.ts`
- **Description:** API routes accept any input without validation.
- **Root Cause:** No validation layer existed.
- **Impact:** Malformed or malicious input can reach the database.
- **Fix:** Added Zod schemas for profile name, ageRange, genres, streamingServices, phone number format, and OTP format.

### ISSUE-13: No Session Provider in Root Layout
**Priority: High**

- **Files:** `src/app/layout.tsx`
- **Description:** `SessionProvider` from next-auth/react was not in the root layout.
- **Root Cause:** Missed during initial setup.
- **Impact:** Client components cannot access `useSession()`.
- **Fix:** Added `<SessionProvider>` wrapper to root layout.

### ISSUE-14: Development OTP Leak Risk
**Priority: Medium**

- **Files:** `src/app/api/auth/whatsapp/send-otp/route.ts`
- **Description:** `developmentOtp` returned in response always, with only `NODE_ENV === 'development'` guard.
- **Root Cause:** Development convenience left in production code.
- **Impact:** OTP could leak in production if NODE_ENV is misconfigured.
- **Fix:** Added explicit `OTP_DEV_MODE` environment flag requirement alongside NODE_ENV check.

### ISSUE-15: WhatsApp API Timeout Not Set
**Priority: Medium**

- **Files:** `src/app/api/auth/whatsapp/send-otp/route.ts`
- **Description:** `fetch()` to WhatsApp API has no timeout.
- **Root Cause:** Missing timeout configuration.
- **Impact:** Can hang indefinitely, causing request timeout.
- **Fix:** Added `Promise.race` with 10-second timeout.

---

## 3. Security Risk Summary

| Priority | Count | Description |
|----------|-------|-------------|
| Critical | 3 | No canonical user, plaintext OTP, localStorage token |
| High | 5 | No attempt limits, no resend cooldown, no OTP consumption, no phone normalization, Google button not wired |
| Medium | 7 | Resend provider, no Zod validation, no SessionProvider, dev OTP leak, no timeout |

---

## 4. Functional Impact Summary

| Issue | Impact Before Fix | Status After Fix |
|-------|-------------------|------------------|
| ISSUE-001 | No canonical identity | User model created |
| ISSUE-002 | Inconsistent profile queries | ObjectId ref added |
| ISSUE-003 | Plaintext OTP in DB | OTP hashed with scrypt |
| ISSUE-004 | Brute-force possible | 5-attempt limit added |
| ISSUE-005 | API abuse possible | Rate limiting added |
| ISSUE-006 | OTP replay possible | One-time consumption enforced |
| ISSUE-007 | Duplicate records | Phone normalization applied |
| ISSUE-008 | XSS vulnerability | localStorage removed |
| ISSUE-009 | Google sign-in broken | Wired to NextAuth |
| ISSUE-010 | Confusing config | Resend removed |
| ISSUE-011 | Non-canonical profiles | Fixed via User model |
| ISSUE-012 | No input validation | Zod schemas added |
| ISSUE-013 | No useSession() | SessionProvider added |
| ISSUE-014 | Dev OTP leak risk | Explicit dev flag added |
| ISSUE-015 | API hangs possible | Timeout added |

---

## 5. Files Affected

### Created
- `src/models/User.ts` — Canonical user identity model
- `src/lib/otp.ts` — OTP utility (hashing, normalization, constants)

### Modified
- `src/lib/auth.ts` — Canonical identity, Google callback, session shape, Credentials authorize
- `src/models/Profile.ts` — userId as ObjectId ref
- `src/models/VerificationCode.ts` — codeHash, codeSalt, attempt tracking
- `src/app/api/auth/whatsapp/send-otp/route.ts` — Rate limiting, phone normalization, OTP hashing
- `src/app/api/auth/whatsapp/verify-otp/route.ts` — Attempt limits, one-time consumption, session establishment
- `src/app/api/user/profile/route.ts` — Zod validation, PUT endpoint, authorization
- `src/app/signin/page.tsx` — Removed localStorage, wired Google signIn, useSession integration
- `src/app/layout.tsx` — Added SessionProvider

### Unchanged (but audited)
- `src/models/SavedList.ts` — userId still String (to be migrated when profiles are created)
- `src/models/TasteSignal.ts` — userId still String (to be migrated when profiles are created)
- `src/models/CatalogCache.ts` — No identity relationship
- `src/app/api/auth/[...nextauth]/route.ts` — No changes needed
- `src/lib/mongodb.ts` — No changes needed
- `src/app/page.tsx` — No auth changes needed (stub UI)
- `.gitignore` — Already excludes .env files
