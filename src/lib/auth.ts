import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { Role } from '@prisma/client';
import { getJwtSecretBytes } from './jwt-secret';

export const AUTH_COOKIE = 'edle_auth_token';

export type SessionPayload = {
  sub: string;
  username: string;
  role: Role | 'DOWNLOADER';
  name: string;
};

function getSecret(): Uint8Array {
  return getJwtSecretBytes();
}

export async function createToken(payload: SessionPayload): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function roleDashboardPath(role: SessionPayload['role']): string {
  switch (role) {
    case 'OWNER':
      return '/dashboard/owner';
    case 'AGENT':
      return '/dashboard/agent';
    case 'DOWNLOADER':
      return '/dashboard/downloads';
    default:
      return '/';
  }
}

export function serializeUser(user: {
  id: number;
  username: string;
  name: string;
  role: Role;
  phone: string;
  avatar: string;
  badge: string;
  balance: { toString(): string };
  gameAgentId: number | null;
}) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
    badge: user.badge,
    balance: Number(user.balance.toString()),
    gameAgentId: user.gameAgentId,
  };
}
