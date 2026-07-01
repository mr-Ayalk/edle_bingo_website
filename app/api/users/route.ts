import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwner, requireOwnerOrAgent } from '@/lib/api-auth';
import { hashPassword } from '@/lib/password';
import { parseMoney } from '@/lib/money';
import { Prisma } from '@prisma/client';
import { serializeUser } from '@/lib/auth';

export async function GET() {
  const session = await requireOwnerOrAgent();
  if (session instanceof NextResponse) return session;

  if (session.role === 'OWNER') {
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    return NextResponse.json({
      users: users.map(serializeUser),
    });
  }

  const user = await prisma.user.findUnique({ where: { id: Number(session.sub) } });
  if (!user) return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  return NextResponse.json({ user: serializeUser(user) });
}

export async function POST(request: Request) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const body = await request.json();
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const name = String(body.name || '').trim();

  if (!username || !password || !name) {
    return NextResponse.json({ message: 'Name, username, and password are required.' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ message: 'Username already exists.' }, { status: 409 });
  }

  let balance;
  try {
    balance = parseMoney(body.balance ?? 0);
    if (balance.lessThan(0)) {
      return NextResponse.json({ message: 'Balance cannot be negative.' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ message: 'Invalid balance amount.' }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash: await hashPassword(password),
      name,
      role: 'AGENT',
      phone: String(body.phone || ''),
      avatar: String(body.avatar || '🎲'),
      badge: String(body.badge || '🚩'),
      balance,
      gameAgentId: body.gameAgentId ? Number(body.gameAgentId) : null,
    },
  });

  return NextResponse.json({ user: serializeUser(user) }, { status: 201 });
}
