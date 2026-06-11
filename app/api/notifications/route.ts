import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwnerOrAgent } from '@/lib/api-auth';

export async function GET() {
  const session = await requireOwnerOrAgent();
  if (session instanceof NextResponse) return session;

  const userId = Number(session.sub);
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  });

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      read: n.read,
      link: n.link,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  });
}

export async function PATCH(request: Request) {
  const session = await requireOwnerOrAgent();
  if (session instanceof NextResponse) return session;

  const body = await request.json();
  const userId = Number(session.sub);

  if (body.markAllRead) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return NextResponse.json({ message: 'All notifications marked as read.' });
  }

  if (body.id) {
    await prisma.notification.updateMany({
      where: { id: Number(body.id), userId },
      data: { read: true },
    });
  }

  return NextResponse.json({ message: 'Updated.' });
}
