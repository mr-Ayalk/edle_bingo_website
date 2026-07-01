import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwnerOrAgent } from '@/lib/api-auth';
import { writeFile, mkdir } from 'fs/promises';
import { parseRouteId } from '@/lib/route-params';
import { validateImageBuffer } from '@/lib/image-validation';
import {
  messageImageApiUrl,
  messageStorageDir,
  messageStoragePath,
} from '@/lib/message-storage';

const MAX_MESSAGE_IMAGE_BYTES = 5 * 1024 * 1024;

async function isAllowedReceiver(
  senderId: number,
  senderRole: string,
  receiverId: number,
): Promise<boolean> {
  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) return false;
  if (senderRole === 'OWNER') return receiver.role === 'AGENT';
  if (senderRole === 'AGENT') return receiver.role === 'OWNER';
  return false;
}

function inboxLinkForRole(role: string): string {
  return role === 'OWNER' ? '/dashboard/owner?section=inbox' : '/dashboard/agent?section=inbox';
}

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

  const otherUserId = parseRouteId(withUserId);
  if (otherUserId == null) {
    return NextResponse.json({ message: 'Invalid user ID.' }, { status: 400 });
  }

  const myId = Number(session.sub);

  if (!(await isAllowedReceiver(myId, session.role, otherUserId))) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

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
      imageUrl: m.imageUrl?.startsWith('/uploads/messages/')
        ? m.imageUrl.replace('/uploads/messages/', '/api/messages/image/')
        : m.imageUrl,
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
      if (process.env.VERCEL === '1') {
        return NextResponse.json(
          { message: 'Image uploads are not supported on this deployment.' },
          { status: 503 },
        );
      }
      if (image.size > MAX_MESSAGE_IMAGE_BYTES) {
        return NextResponse.json({ message: 'Image must be 5 MB or smaller.' }, { status: 400 });
      }
      const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowed.includes(image.type)) {
        return NextResponse.json({ message: 'Only PNG and JPG images are allowed.' }, { status: 400 });
      }
      const buffer = Buffer.from(await image.arrayBuffer());
      const detected = validateImageBuffer(buffer);
      if (!detected) {
        return NextResponse.json({ message: 'Only PNG and JPG images are allowed.' }, { status: 400 });
      }
      const ext = detected === 'png' ? 'png' : 'jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      await mkdir(messageStorageDir(), { recursive: true });
      await writeFile(messageStoragePath(filename), buffer);
      imageUrl = messageImageApiUrl(filename);
    }
  } else {
    const body = await request.json();
    receiverId = Number(body.receiverId);
    content = String(body.content || '');
    fontFamily = String(body.fontFamily || 'Inter');
    sticker = body.sticker ? String(body.sticker) : null;
  }

  const parsedReceiverId = parseRouteId(String(receiverId));
  if (parsedReceiverId == null) {
    return NextResponse.json({ message: 'Invalid receiver.' }, { status: 400 });
  }
  receiverId = parsedReceiverId;

  if (!content.trim() && !sticker && !imageUrl) {
    return NextResponse.json({ message: 'Message content is required.' }, { status: 400 });
  }

  const senderId = Number(session.sub);

  if (!(await isAllowedReceiver(senderId, session.role, receiverId))) {
    return NextResponse.json({ message: 'Invalid message recipient.' }, { status: 403 });
  }

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

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });

  await prisma.notification.create({
    data: {
      userId: receiverId,
      title: 'New message',
      body: content.trim().slice(0, 120) || (sticker ? 'Sent a sticker' : 'Sent an image'),
      link: inboxLinkForRole(receiver?.role ?? 'AGENT'),
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
