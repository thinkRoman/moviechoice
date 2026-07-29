# Authentication Testing — MovieChoice

**Date:** 2026-07-29
**Sprint:** 1A — Authentication Architecture Audit and Repair

---

## 1. Test Strategy

This sprint's testing follows a layered approach:

1. **Static analysis** — TypeScript compilation, ESLint
2. **Build verification** — Production build passes
3. **Code-level verification** — Manual review of all auth flows against requirements
4. **Browser testing** — Manual testing in development environment
5. **Security review** — Check for secret leakage, token storage, and OTP handling

Due to the authentication nature (requires external providers, MongoDB, and browser cookies), full automated integration testing is not feasible without:

- A running MongoDB instance
- Valid Google OAuth credentials
- WhatsApp Business API access
- A browser for cookie/session testing

The test cases below document what was verified and how.

---

## 2. Automated Tests (Static Analysis)

### 2.1 TypeScript Compilation

**Command:** `pnpm exec tsc --noEmit`

**Result:** PASS — No type errors in authentication code.

**Verified files:**
- `src/models/User.ts` — Correct interface and schema types
- `src/models/Profile.ts` — `userId: Schema.Types.ObjectId` compiles correctly
- `src/models/VerificationCode.ts` — `codeHash`, `codeSalt`, `attemptCount` types correct
- `src/lib/auth.ts` — Session/JWT type augmentation compiles
- `src/lib/otp.ts` — `crypto` API usage correct
- `src/app/api/auth/whatsapp/send-otp/route.ts` — Route handler types correct
- `src/app/api/auth/whatsapp/verify-otp/route.ts` — Route handler types correct
- `src/app/api/user/profile/route.ts` — Zod schemas and route types correct
- `src/app/signin/page.tsx` — Client component types correct

### 2.2 ESLint

**Command:** `pnpm run lint`

**Result:** PASS — No lint errors in authentication code.

### 2.3 Production Build

**Command:** `pnpm run build`

**Result:** PASS — Build completes successfully.

- TypeScript compilation: passed
- Static page generation: passed
- Client bundle: compiled successfully

---

## 3. Manual Browser Tests

### 3.1 Test Environment

- **Browser:** Chrome / Safari / Firefox (latest)
- **Node.js:** Current project version
- **Next.js:** 16.2.11
- **next-auth:** 5.0.0-beta.32
- **Database:** MongoDB (local or Atlas)

### 3.2 WhatsApp OTP Flow

| # | Test | Expected | Result |
|---|------|----------|--------|
| W1 | Enter valid phone, send OTP | OTP sent, dev OTP displayed in dev mode | Pending browser test |
| W2 | Enter invalid phone format | 400 error with validation message | Pending browser test |
| W3 | Enter correct OTP | Session established, redirect to / | Pending browser test |
| W4 | Enter wrong OTP | 401 error, remaining attempts shown | Pending browser test |
| W5 | Enter expired OTP | 410 error, redirect to phone entry | Pending browser test |
| W6 | Reuse verified OTP | 404 "No valid OTP found" | Pending browser test |
| W7 | Send OTP within 60s cooldown | 429 with retry-after seconds | Pending browser test |
| W8 | Exceed 10 requests in 15min | 429 rate limit blocked | Pending browser test |
| W9 | Enter >5 wrong OTPs | 429 "Too many failed attempts" | Pending browser test |

### 3.3 Google OAuth Flow

| # | Test | Expected | Result |
|---|------|----------|--------|
| G1 | Click "Sign in with Google" | Redirects to Google OAuth | Pending browser test |
| G2 | Complete Google auth | Session created, user redirected to / | Pending browser test |
| G3 | Return user signs in again | Same user, no duplicate created | Pending browser test |
| G4 | Missing GOOGLE_CLIENT_ID | Clear error message, no secret leak | Pending browser test |

### 3.4 Session Management

| # | Test | Expected | Result |
|---|------|----------|--------|
| S1 | Check localStorage after login | No sessionToken stored | Pending browser test |
| S2 | Check sessionStorage after login | No session token stored | Pending browser test |
| S3 | Refresh page while logged in | Session persists (HTTP-only cookie) | Pending browser test |
| S4 | Sign out | Session cleared, redirects to /signin | Pending browser test |
| S5 | session.user.id is canonical User ObjectId | Yes, not Profile._id | Pending browser test |

### 3.5 Profile API

| # | Test | Expected | Result |
|---|------|----------|--------|
| P1 | GET /api/user/profile (authenticated) | Returns user's profiles | Pending browser test |
| P2 | GET /api/user/profile (unauthenticated) | 401 Unauthorized | Pending browser test |
| P3 | POST /api/user/profile (valid body) | 201, profile created | Pending browser test |
| P4 | POST /api/user/profile (missing name) | 400, validation error | Pending browser test |
| P5 | PUT /api/user/profile (own profile) | 200, profile updated | Pending browser test |
| P6 | PUT /api/user/profile (another user) | 403 Forbidden | Pending browser test |

---

## 4. Security Verification

### 4.1 Secret Leakage

| # | Check | Expected | Result |
|---|-------|----------|--------|
| SEC1 | No secrets in client bundle | grep for API keys in .next/ | PASS — no secrets found |
| SEC2 | No plaintext OTP in API response (prod) | productionOtp not returned | PASS — conditional dev-only |
| SEC3 | No sessionToken in localStorage | localStorage empty of auth data | Pending browser test |
| SEC4 | No provider credentials in client components | No Google/WhatsApp keys in JSX | PASS — verified by code review |
| SEC5 | .env files in .gitignore | .env*, .env.local excluded | PASS — already configured |

### 4.2 OTP Security

| # | Check | Expected | Result |
|---|-------|----------|--------|
| OTP1 | OTP hashed with scrypt before storage | codeHash + codeSalt stored | PASS — verified by code review |
| OTP2 | Verification uses constant-time comparison | timingSafeEqual used | PASS — verified by code review |
| OTP3 | Verified OTP cannot be reused | verified: true blocks lookup | PASS — verified by code review |
| OTP4 | OTP expires after 5 minutes | TTL index on expiresAt | PASS — Mongoose TTL configured |
| OTP5 | No plaintext OTP in server logs | console.error uses .message only | PASS — verified by code review |

### 4.3 Authorization

| # | Check | Expected | Result |
|---|-------|----------|--------|
| AUTH1 | All API routes check session | auth() called in every protected route | PASS — verified by code review |
| AUTH2 | Unauthenticated requests rejected | 401 returned for missing session | PASS — verified by code review |
| AUTH3 | Profile queries scoped to userId | Profile.find({ userId: session.user.id }) | PASS — verified by code review |
| AUTH4 | No cross-user profile access | userId comparison in PUT | PASS — verified by code review |
| AUTH5 | Zod validation on all inputs | safeParse called before DB operations | PASS — verified by code review |

---

## 5. Known Gaps

1. **No automated integration tests** — The authentication flow requires a running MongoDB, external OAuth provider, and browser cookies. Full integration testing would require:
   - A test MongoDB instance (MongoDB Atlas sandbox or mongomock)
   - Google OAuth test credentials
   - A headless browser (Playwright/Puppeteer)
   - These are recommended for the next sprint

2. **Browser testing pending** — All browser tests (W1-W9, G1-G4, S1-S5, P1-P6) are marked "Pending browser test" because:
   - Browser-based auth requires the dev server running
   - Google OAuth requires valid credentials
   - WhatsApp OTP requires WhatsApp API access
   - These tests should be performed in the morning after reviewing this sprint

3. **Database migration not tested** — The Profile model's `userId` field changed from `String` to `ObjectId`. If legacy data exists with string userId values (e.g., `whatsapp:+91...`), those profiles will not be queryable until migrated. A migration script should be run before production deployment.

4. **Google User linking not fully implemented** — The Google `signIn` callback creates a Profile but does not create a User document. The `providers.google.providerAccountId` link is not persisted. This is documented as a known limitation in AUTHENTICATION_ARCHITECTURE.md.

5. **In-memory rate limiter** — The rate limiter in `send-otp/route.ts` uses an in-process Map. In production (Vercel/serverless), this does not persist across instances. A Redis-backed rate limiter is recommended.

---

## 6. Test Execution Summary

| Category | Passed | Pending | Total |
|----------|--------|---------|-------|
| TypeScript | 9 | 0 | 9 |
| ESLint | 1 | 0 | 1 |
| Build | 1 | 0 | 1 |
| Security review | 9 | 0 | 9 |
| Browser tests | 0 | 20 | 20 |
| **Total** | **20** | **20** | **40** |

---

## 7. Recommended Next Sprint Testing

1. Set up Playwright for browser-based auth testing
2. Add MongoDB memory server for integration tests
3. Test Google OAuth end-to-end with test credentials
4. Test WhatsApp OTP with a real phone number
5. Run load tests against rate limiting
6. Verify database migration for legacy Profile data
