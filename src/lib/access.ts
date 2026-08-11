import { createHash } from 'crypto';
import { generatePin, hashPin, normalizeEmail, secureStringEqual, verifyPin } from '@/lib/pin';

export type UserRole = 'OWNER' | 'MEMBER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface AccessPrincipal {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface MemberCredentials {
  id: string;
  name: string;
  email: string;
  pinHash: string;
  pinSalt: string;
  role: UserRole;
  status: UserStatus;
}

export interface SafeAccessUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  monthlyAiLimitUsd: number | null;
  countryCode: string;
  whatsappNumber: string;
  notifyVia: 'email' | 'whatsapp' | 'both';
  createdAt: string;
  lastLoginAt: string | null;
}

export interface MemberRepository {
  findCredentialsByEmail(email: string): Promise<MemberCredentials | null>;
  create(input: {
    name: string;
    email: string;
    pinHash: string;
    pinSalt: string;
    role: 'MEMBER';
    status: 'ACTIVE';
    monthlyAiLimitUsd?: number;
  }): Promise<SafeAccessUser>;
  setStatus(id: string, status: UserStatus): Promise<SafeAccessUser | null>;
  setPin(id: string, pinHash: string, pinSalt: string): Promise<SafeAccessUser | null>;
}

export function ownerId(email: string): string {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex').slice(0, 24);
}

export async function authenticateAccess(
  email: string,
  pin: string,
  repository: Pick<MemberRepository, 'findCredentialsByEmail'>,
  ownerEmail = process.env.OWNER_EMAIL,
  ownerPin = process.env.OWNER_PIN,
): Promise<AccessPrincipal | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !/^\d{6}$/.test(pin)) return null;

  if (
    ownerEmail &&
    ownerPin &&
    secureStringEqual(normalizedEmail, normalizeEmail(ownerEmail)) &&
    secureStringEqual(pin, ownerPin)
  ) {
    return {
      id: ownerId(normalizedEmail),
      name: 'Owner',
      email: normalizedEmail,
      role: 'OWNER',
    };
  }

  const member = await repository.findCredentialsByEmail(normalizedEmail);
  if (
    !member ||
    member.role !== 'MEMBER' ||
    member.status !== 'ACTIVE' ||
    !verifyPin(pin, member.pinHash, member.pinSalt)
  ) {
    return null;
  }

  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
  };
}

export function requireOwner(role?: UserRole): void {
  if (role !== 'OWNER') throw new Error('FORBIDDEN');
}

export async function createMember(
  role: UserRole | undefined,
  input: { name: string; email: string; pin?: string; monthlyAiLimitUsd?: number },
  repository: MemberRepository,
): Promise<{ user: SafeAccessUser; pin: string }> {
  requireOwner(role);
  const email = normalizeEmail(input.email);
  const pin = input.pin && /^\d{6}$/.test(input.pin) ? input.pin : generatePin();
  const { pinHash, pinSalt } = hashPin(pin);
  const user = await repository.create({
    name: input.name.trim(),
    email,
    pinHash,
    pinSalt,
    role: 'MEMBER',
    status: 'ACTIVE',
    monthlyAiLimitUsd: input.monthlyAiLimitUsd,
  });
  return { user, pin };
}

export async function changeMemberStatus(
  role: UserRole | undefined,
  id: string,
  status: UserStatus,
  repository: MemberRepository,
): Promise<SafeAccessUser | null> {
  requireOwner(role);
  return repository.setStatus(id, status);
}

export async function regenerateMemberPin(
  role: UserRole | undefined,
  id: string,
  repository: MemberRepository,
): Promise<{ user: SafeAccessUser; pin: string } | null> {
  requireOwner(role);
  const pin = generatePin();
  const { pinHash, pinSalt } = hashPin(pin);
  const user = await repository.setPin(id, pinHash, pinSalt);
  if (!user) return null;
  return { user, pin };
}
