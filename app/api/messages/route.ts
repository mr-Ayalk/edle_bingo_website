import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwnerOrAgent } from '@/lib/api-auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const session = await requireOwnerOrAgent();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const withUserId = searchParams.get('withUserId');

  if (!withUserId) {
    if (session.role === 'OWNER') {
      const agents = await prisma.user.findMany({
        where: { role: 'AGENT' },
        select: { id: true, name: true, username: true, avatar: true },
      });
      return NextResponse.json({ agents });
    }
    const owner = await prisma.user.findFirst({
      where: { role: 'OWNER' },
      select: { id: true, name: true, username: true, avatar: true },
    });
    return NextResponse.json({ agents: owner ? [owner] : [] });
  }

  const otherUserId = Number(withUserId);
  const myId = session.role === 'DOWNLOADER' ? 0 : Number(session.sub);

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.content,
      fontFamily: m.fontFamily,
      imageUrl: m.imageUrl,
      sticker: m.sticker,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireOwnerOrAgent();
  if (session instanceof NextResponse) return session;

  const contentType = request.headers.get('content-type') || '';
  let receiverId: number;
  let content: string;
  let fontFamily = 'Inter';
  let sticker: string | null = null;
  let imageUrl: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    receiverId = Number(form.get('receiverId'));
    content = String(form.get('content') || '');
    fontFamily = String(form.get('fontFamily') || 'Inter');
    sticker = form.get('sticker') ? String(form.get('sticker')) : null;

    const image = form.get('image');
    if (image && image instanceof File && image.size > 0) {
      const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowed.includes(image.type)) {
        return NextResponse.json({ message: 'Only PNG and JPG images are allowed.' }, { status: 400 });
      }
      const buffer = Buffer.from(await image.arrayBuffer());
      const ext = image.type === 'image/png' ? 'png' : 'jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'messages');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      imageUrl = `/uploads/messages/${filename}`;
    }
  } else {
    const body = await request.json();
    receiverId = Number(body.receiverId);
    content = String(body.content || '');
    fontFamily = String(body.fontFamily || 'Inter');
    sticker = body.sticker ? String(body.sticker) : null;
    imageUrl = body.imageUrl ? String(body.imageUrl) : null;
  }

  if (!receiverId || (!content.trim() && !sticker && !imageUrl)) {
    return NextResponse.json({ message: 'Message content is required.' }, { status: 400 });
  }

  const senderId = Number(session.sub);

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      content: content.trim(),
      fontFamily,
      sticker,
      imageUrl,
    },
  });

  await prisma.notification.create({
    data: {
      userId: receiverId,
      title: 'New message',
      body: content.trim().slice(0, 120) || (sticker ? 'Sent a sticker' : 'Sent an image'),
      link: '/dashboard/inbox',
    },
  });

  return NextResponse.json(
    {
      message: {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        fontFamily: message.fontFamily,
        imageUrl: message.imageUrl,
        sticker: message.sticker,
        createdAt: message.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
