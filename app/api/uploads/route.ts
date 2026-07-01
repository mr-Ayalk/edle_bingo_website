import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import type { DownloadCategory } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireOwner } from '@/lib/api-auth';
import { getCategoryMeta, isAllowedExtension } from '@/lib/download-categories';

export const runtime = 'nodejs';
export const maxDuration = 300;

const DOWNLOAD_CATEGORIES_IDS = new Set<string>([
  'SETUP',
  'NODE',
  'APK_CARTELA',
  'PNG_CARTELA',
  'CARTELA_SYSTEM',
  'ANYDESK',
]);

function serializeAsset(asset: {
  id: number;
  category: DownloadCategory;
  name: string;
  description: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  visible: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: asset.id,
    category: asset.category,
    name: asset.name,
    description: asset.description,
    fileName: asset.fileName,
    filePath: asset.filePath,
    fileSize: asset.fileSize,
    mimeType: asset.mimeType,
    visible: asset.visible,
    sortOrder: asset.sortOrder,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}

export async function GET() {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const assets = await prisma.downloadAsset.findMany({
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ assets: assets.map(serializeAsset) });
}

export async function POST(request: Request) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const form = await request.formData();
  const category = String(form.get('category') || '') as DownloadCategory;
  const name = String(form.get('name') || '').trim();
  const description = String(form.get('description') || '').trim();
  const visible = form.get('visible') !== 'false';
  const file = form.get('file');

  if (!DOWNLOAD_CATEGORIES_IDS.has(category)) {
    return NextResponse.json({ message: 'Invalid category.' }, { status: 400 });
  }

  const meta = getCategoryMeta(category);

  if (!name) {
    return NextResponse.json({ message: 'Display name is required.' }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: 'File is required.' }, { status: 400 });
  }

  if (!isAllowedExtension(category, file.name)) {
    return NextResponse.json(
      { message: `Invalid file type. Allowed: ${meta.extensions.join(', ')}` },
      { status: 400 },
    );
  }

  const maxBytes = meta.maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { message: `File too large. Maximum size for this category is ${meta.maxSizeMb} MB.` },
      { status: 400 },
    );
  }

  const existingCount = await prisma.downloadAsset.count({ where: { category } });
  if (meta.maxFiles !== null && existingCount >= meta.maxFiles) {
    return NextResponse.json(
      { message: `This category allows at most ${meta.maxFiles} file(s). Delete an existing file first.` },
      { status: 400 },
    );
  }

  const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storedName = `${Date.now()}-${safeBase}`;
  const relDir = path.join('uploads', 'downloads', category.toLowerCase());
  const absDir = path.join(process.cwd(), 'public', relDir);
  await mkdir(absDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const absPath = path.join(absDir, storedName);
  await writeFile(absPath, buffer);

  const filePath = `/${relDir.replace(/\\/g, '/')}/${storedName}`;

  const asset = await prisma.downloadAsset.create({
    data: {
      category,
      name,
      description,
      fileName: file.name,
      filePath,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      visible,
      sortOrder: existingCount,
    },
  });

  return NextResponse.json({ asset: serializeAsset(asset) }, { status: 201 });
}
