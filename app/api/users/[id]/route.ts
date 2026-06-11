import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwner, requireSession } from '@/lib/api-auth';
import { hashPassword } from '@/lib/password';
import { parseMoney } from '@/lib/money';
import { serializeUser } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  const userId = Number(id);

  const isSelf = Number(session.sub) === userId;
  if (!isSelf && session.role !== 'OWNER') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.username) {
    const existing = await prisma.user.findFirst({
      where: { username: String(body.username), NOT: { id: userId } },
    });
    if (existing) {
      return NextResponse.json({ message: 'Username already in use.' }, { status: 409 });
    }
    data.username = String(body.username).trim();
  }
  if (body.name) data.name = String(body.name).trim();
  if (body.password) data.passwordHash = await hashPassword(String(body.password));
  if (body.phone !== undefined) data.phone = String(body.phone);
  if (body.avatar) data.avatar = String(body.avatar);
  if (body.badge) data.badge = String(body.badge);
  if (body.balance !== undefined) data.balance = parseMoney(body.balance);
  if (body.gameAgentId !== undefined) {
    data.gameAgentId = body.gameAgentId === null ? null : Number(body.gameAgentId);
  }

  const updated = await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json({ user: serializeUser(updated) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  const userId = Number(id);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }
  if (user.role !== 'AGENT') {
    return NextResponse.json({ message: 'Only agents can be deleted.' }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ message: 'Agent removed.' });
}
