import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { DOWNLOAD_CATEGORIES } from '@/lib/download-categories';

export async function GET() {
  const session = await requireRole('DOWNLOADER');
  if (session instanceof NextResponse) return session;

  const assets = await prisma.downloadAsset.findMany({
    where: { visible: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  const grouped = DOWNLOAD_CATEGORIES.map((cat) => ({
    category: cat.id,
    label: cat.label,
    description: cat.description,
    icon: cat.icon,
    files: assets
      .filter((a) => a.category === cat.id)
      .map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        fileName: a.fileName,
        file: a.filePath,
        fileSize: a.fileSize,
      })),
  })).filter((g) => g.files.length > 0);

  return NextResponse.json({ downloads: grouped });
}
