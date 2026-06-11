import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwner } from '@/lib/api-auth';
import { hashPassword } from '@/lib/password';

export async function GET() {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    return NextResponse.json({ message: 'Settings not found.' }, { status: 404 });
  }

  return NextResponse.json({
    aboutTitle: settings.aboutTitle,
    aboutDescription: settings.aboutDescription,
    contactInfo: settings.contactInfo,
    location: settings.location,
    slogan: settings.slogan,
    downloadUsername: settings.downloadUsername,
  });
}

export async function PATCH(request: Request) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const body = await request.json();
  const data: Record<string, string> = {};

  if (body.aboutTitle !== undefined) data.aboutTitle = String(body.aboutTitle);
  if (body.aboutDescription !== undefined) data.aboutDescription = String(body.aboutDescription);
  if (body.contactInfo !== undefined) data.contactInfo = String(body.contactInfo);
  if (body.location !== undefined) data.location = String(body.location);
  if (body.slogan !== undefined) data.slogan = String(body.slogan);
  if (body.downloadUsername !== undefined) data.downloadUsername = String(body.downloadUsername).trim();

  const updateData: Record<string, unknown> = { ...data };

  if (body.downloadPassword) {
    updateData.downloadPasswordHash = await hashPassword(String(body.downloadPassword));
  }

  const settings = await prisma.appSettings.update({
    where: { id: 1 },
    data: updateData,
  });

  return NextResponse.json({
    aboutTitle: settings.aboutTitle,
    aboutDescription: settings.aboutDescription,
    contactInfo: settings.contactInfo,
    location: settings.location,
    slogan: settings.slogan,
    downloadUsername: settings.downloadUsername,
  });
}
