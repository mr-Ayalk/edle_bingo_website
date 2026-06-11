import { NextResponse } from 'next/server';
import { getSession, serializeUser, roleDashboardPath } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  if (session.role === 'DOWNLOADER') {
    return NextResponse.json({
      user: {
        username: session.username,
        role: 'DOWNLOADER',
        name: session.name,
      },
      redirect: '/dashboard/downloads',
    });
  }

  const user = await prisma.user.findUnique({ where: { id: Number(session.sub) } });
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: serializeUser(user),
    redirect: roleDashboardPath(user.role),
  });
}
