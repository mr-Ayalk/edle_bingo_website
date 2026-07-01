import { prisma } from './db';
import { hashPassword } from './password';
import { Prisma } from '@prisma/client';

export async function ensureAppSettings() {
  const existing = await prisma.appSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;

  const defaultDownloadPassword = process.env.DEFAULT_DOWNLOAD_PASSWORD;
  if (process.env.NODE_ENV === 'production' && !defaultDownloadPassword) {
    throw new Error('DEFAULT_DOWNLOAD_PASSWORD must be set before first run in production.');
  }

  return prisma.appSettings.create({
    data: {
      id: 1,
      downloadPasswordHash: await hashPassword(defaultDownloadPassword || 'downloads123'),
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

const DEFAULT_SEED_USERS = [
  {
    username: 'Owner2',
    password: '12345678',
    role: 'OWNER' as const,
    name: 'Edle Owner',
    phone: '+251951818822',
    avatar: '🎖',
    badge: '🎖',
    gameAgentId: null as number | null,
    balance: new Prisma.Decimal(0),
  },
  {
    username: 'Ayalk',
    password: '12345678',
    role: 'AGENT' as const,
    name: 'Agent One',
    phone: '+251900000001',
    avatar: '🧩',
    badge: '🚩',
    gameAgentId: 1,
    balance: new Prisma.Decimal(10000),
  },
];

/** Creates default users only when their username is not already in the database. Dev/seed only. */
export async function seedDefaultUsers() {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEFAULT_SEED !== 'true') {
    return;
  }

  for (const user of DEFAULT_SEED_USERS) {
    const existing = await prisma.user.findUnique({ where: { username: user.username } });
    if (existing) continue;

    await prisma.user.create({
      data: {
        username: user.username,
        passwordHash: await hashPassword(user.password),
        role: user.role,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        badge: user.badge,
        gameAgentId: user.gameAgentId,
        balance: user.balance,
      },
    });
  }
}
