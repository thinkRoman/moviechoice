import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  authenticateAccess,
  changeMemberStatus,
  createMember,
  regenerateMemberPin,
  type MemberCredentials,
  type MemberRepository,
  type SafeAccessUser,
} from '@/lib/access';

function makeRepository() {
  const credentials = new Map<string, MemberCredentials>();
  const safeUsers = new Map<string, SafeAccessUser>();
  const persistedWrites: object[] = [];
  let nextId = 1;

  const repository: MemberRepository = {
    async findCredentialsByEmail(email) {
      return credentials.get(email) ?? null;
    },
    async create(input) {
      persistedWrites.push({ ...input });
      const id = `member-${nextId++}`;
      credentials.set(input.email, { id, ...input });
      const user: SafeAccessUser = {
        id,
        name: input.name,
        email: input.email,
        role: 'MEMBER',
        status: 'ACTIVE',
        monthlyAiLimitUsd: input.monthlyAiLimitUsd ?? null,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      };
      safeUsers.set(id, user);
      return user;
    },
    async setStatus(id, status) {
      const user = safeUsers.get(id);
      if (!user) return null;
      user.status = status;
      const credential = credentials.get(user.email);
      if (credential) credential.status = status;
      return { ...user };
    },
    async setPin(id, pinHash, pinSalt) {
      const user = safeUsers.get(id);
      if (!user) return null;
      const credential = credentials.get(user.email);
      if (!credential) return null;
      credential.pinHash = pinHash;
      credential.pinSalt = pinSalt;
      persistedWrites.push({ id, pinHash, pinSalt });
      return { ...user };
    },
  };

  return { repository, credentials, persistedWrites };
}

describe('invite-only email and PIN access', () => {
  const ownerEmail = 'owner@example.com';
  const ownerPin = '246810';
  let store: ReturnType<typeof makeRepository>;
  let sentPins: Array<{ name: string; email: string; pin: string }>;
  const sendInvitation = vi.fn(async (input: { name: string; email: string; pin: string }) => {
    sentPins.push(input);
  });

  beforeEach(() => {
    store = makeRepository();
    sentPins = [];
    sendInvitation.mockClear();
  });

  it('owner bootstrap login succeeds', async () => {
    const result = await authenticateAccess(
      ' OWNER@example.com ',
      ownerPin,
      store.repository,
      ownerEmail,
      ownerPin,
    );
    expect(result).toMatchObject({ email: ownerEmail, role: 'OWNER' });
  });

  it('invalid owner PIN fails', async () => {
    expect(
      await authenticateAccess(ownerEmail, '000000', store.repository, ownerEmail, ownerPin),
    ).toBeNull();
  });

  it('owner can create a member and the member PIN is hashed', async () => {
    const user = await createMember(
      'OWNER',
      { name: 'Alex', email: ' Alex@Example.com ', pin: '135791' },
      store.repository,
      sendInvitation,
    );
    const stored = store.credentials.get('alex@example.com');
    expect(user).toMatchObject({ email: 'alex@example.com', role: 'MEMBER' });
    expect(stored?.pinHash).toMatch(/^[a-f0-9]+$/);
    expect(sentPins[0].pin).toBe('135791');
    expect(stored?.pinHash).not.toBe(sentPins[0].pin);
    expect(stored?.pinSalt).toBeTruthy();
  });

  it('auto-generates a PIN when none is provided', async () => {
    await createMember(
      'OWNER',
      { name: 'Sam', email: 'sam@example.com' },
      store.repository,
      sendInvitation,
    );
    expect(sentPins[0].pin).toMatch(/^\d{6}$/);
  });

  it('unknown email fails', async () => {
    expect(
      await authenticateAccess('unknown@example.com', '123456', store.repository, ownerEmail, ownerPin),
    ).toBeNull();
  });

  it('invalid PIN fails and valid member login succeeds', async () => {
    await createMember('OWNER', { name: 'Alex', email: 'alex@example.com' }, store.repository, sendInvitation);
    expect(
      await authenticateAccess('alex@example.com', '999999', store.repository, ownerEmail, ownerPin),
    ).toBeNull();
    expect(
      await authenticateAccess('alex@example.com', sentPins[0].pin, store.repository, ownerEmail, ownerPin),
    ).toMatchObject({ email: 'alex@example.com', role: 'MEMBER' });
  });

  it('suspended user fails', async () => {
    const user = await createMember('OWNER', { name: 'Alex', email: 'alex@example.com' }, store.repository, sendInvitation);
    await changeMemberStatus('OWNER', user.id, 'SUSPENDED', store.repository);
    expect(
      await authenticateAccess('alex@example.com', sentPins[0].pin, store.repository, ownerEmail, ownerPin),
    ).toBeNull();
  });

  it('member cannot access user-management APIs through the shared server guard', async () => {
    await expect(
      createMember('MEMBER', { name: 'Nope', email: 'nope@example.com' }, store.repository, sendInvitation),
    ).rejects.toThrow('FORBIDDEN');
    await expect(
      changeMemberStatus('MEMBER', 'member-1', 'SUSPENDED', store.repository),
    ).rejects.toThrow('FORBIDDEN');
  });

  it('owner can suspend and reactivate a member', async () => {
    const user = await createMember('OWNER', { name: 'Alex', email: 'alex@example.com' }, store.repository, sendInvitation);
    expect((await changeMemberStatus('OWNER', user.id, 'SUSPENDED', store.repository))?.status).toBe('SUSPENDED');
    expect((await changeMemberStatus('OWNER', user.id, 'ACTIVE', store.repository))?.status).toBe('ACTIVE');
  });

  it('owner can regenerate a PIN and invalidate the previous PIN', async () => {
    const user = await createMember('OWNER', { name: 'Alex', email: 'alex@example.com' }, store.repository, sendInvitation);
    const oldPin = sentPins[0].pin;
    await regenerateMemberPin('OWNER', user.id, store.repository, sendInvitation);
    const newPin = sentPins[1].pin;
    expect(newPin).toMatch(/^\d{6}$/);
    expect(
      await authenticateAccess(user.email, oldPin, store.repository, ownerEmail, ownerPin),
    ).toBeNull();
    expect(
      await authenticateAccess(user.email, newPin, store.repository, ownerEmail, ownerPin),
    ).toMatchObject({ id: user.id });
  });

  it('plaintext PIN is never persisted', async () => {
    await createMember('OWNER', { name: 'Alex', email: 'alex@example.com' }, store.repository, sendInvitation);
    const persisted = JSON.stringify(store.persistedWrites);
    expect(persisted).not.toContain(sentPins[0].pin);
    expect(persisted).not.toContain('"pin"');
  });
});
