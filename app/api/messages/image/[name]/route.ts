import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import { requireOwnerOrAgent } from '@/lib/api-auth';
import {
  isSafeMessageFilename,
  messageImageMime,
  messageImageApiUrl,
  messageStoragePath,
} from '@/lib/message-storage';

type RouteContext = { params: Promise<{ name: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireOwnerOrAgent();
  if (session instanceof NextResponse) return session;

  const { name } = await context.params;
  if (!isSafeMessageFilename(name)) {
    return NextResponse.json({ message: 'Invalid image.' }, { status: 400 });
  }

  const apiUrl = messageImageApiUrl(name);
  const legacyUrl = `/uploads/messages/${name}`;

  const message = await prisma.message.findFirst({
    where: { OR: [{ imageUrl: apiUrl }, { imageUrl: legacyUrl }] },
  });

  if (!message) {
    return NextResponse.json({ message: 'Image not found.' }, { status: 404 });
  }

  const myId = Number(session.sub);
  if (message.senderId !== myId && message.receiverId !== myId) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  try {
    let buffer: Buffer;
    try {
      buffer = await readFile(messageStoragePath(name));
    } catch {
      buffer = await readFile(path.join(process.cwd(), 'public', 'uploads', 'messages', name));
    }
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': messageImageMime(name),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ message: 'Image file missing.' }, { status: 404 });
  }
}
