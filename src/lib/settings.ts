import { prisma } from './db';
import { hashPassword } from './password';
import { Prisma } from '@prisma/client';

export async function ensureAppSettings() {
  const existing = await prisma.appSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;

  return prisma.appSettings.create({
    data: {
      id: 1,
      downloadPasswordHash: await hashPassword('downloads123'),
    },
  });
}

export async function getAppSettings() {
  return ensureAppSettings();
}

export async function getPublicSettings() {
  const settings = await getAppSettings();
  return {
    aboutTitle: settings.aboutTitle,
    aboutDescription: settings.aboutDescription,
    contactInfo: settings.contactInfo,
    location: settings.location,
    slogan: settings.slogan,
  };
}

export async function seedDefaultUsers() {
  const ownerCount = await prisma.user.count({ where: { role: 'OWNER' } });
  if (ownerCount > 0) return;

  await prisma.user.createMany({
    data: [
      {
        username: 'Owner',
        passwordHash: await hashPassword('1234'),
        role: 'OWNER',
        name: 'Edle Owner',
        phone: '+251951818822',
        avatar: '🎖',
        badge: '🎖',
        balance: new Prisma.Decimal(0),
      },
      {
        username: 'agent1',
        passwordHash: await hashPassword('1234'),
        role: 'AGENT',
        name: 'Agent One',
        phone: '+251900000001',
        avatar: '🧩',
        badge: '🚩',
        gameAgentId: 1,
        balance: new Prisma.Decimal(10000),
      },
    ],
  });
}
