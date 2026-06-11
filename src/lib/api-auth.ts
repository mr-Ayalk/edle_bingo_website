import { NextResponse } from 'next/server';
import type { Role } from '@prisma/client';
import { getSession, type SessionPayload } from './auth';

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ message }, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ message }, { status: 403 });
}

export async function requireSession(): Promise<
  SessionPayload | NextResponse
> {
  const session = await getSession();
  if (!session) return unauthorized();
  return session;
}

export async function requireRole(
  ...roles: Array<Role | 'DOWNLOADER'>
): Promise<SessionPayload | NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  if (!roles.includes(session.role)) return forbidden();
  return session;
}

export async function requireOwner(): Promise<SessionPayload | NextResponse> {
  return requireRole('OWNER');
}

export async function requireAgent(): Promise<SessionPayload | NextResponse> {
  return requireRole('AGENT');
}

export async function requireOwnerOrAgent(): Promise<SessionPayload | NextResponse> {
  return requireRole('OWNER', 'AGENT');
}
