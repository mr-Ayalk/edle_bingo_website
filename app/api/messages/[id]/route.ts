import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwnerOrAgent } from '@/lib/api-auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireOwnerOrAgent();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  const messageId = Number(id);
  const userId = Number(session.sub);
  const body = await request.json();

  const existing = await prisma.message.findUnique({ where: { id: messageId } });
  if (!existing) {
    return NextResponse.json({ message: 'Message not found.' }, { status: 404 });
  }
  if (existing.senderId !== userId) {
    return NextResponse.json({ message: 'You can only edit your own messages.' }, { status: 403 });
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      ...(body.content !== undefined ? { content: String(body.content) } : {}),
      ...(body.fontFamily !== undefined ? { fontFamily: String(body.fontFamily) } : {}),
    },
  });

  return NextResponse.json({
    message: {
      id: updated.id,
      content: updated.content,
      fontFamily: updated.fontFamily,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireOwnerOrAgent();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  const messageId = Number(id);
  const userId = Number(session.sub);

  const existing = await prisma.message.findUnique({ where: { id: messageId } });
  if (!existing) {
    return NextResponse.json({ message: 'Message not found.' }, { status: 404 });
  }
  if (existing.senderId !== userId) {
    return NextResponse.json({ message: 'You can only delete your own messages.' }, { status: 403 });
  }

  await prisma.message.delete({ where: { id: messageId } });
  return NextResponse.json({ message: 'Message deleted.' });
}
