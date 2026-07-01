import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwner } from '@/lib/api-auth';
import { removeAssetFile } from '@/lib/download-storage';
import { parseBoolean } from '@/lib/parse-boolean';
import { parseRouteId } from '@/lib/route-params';

type RouteContext = { params: Promise<{ id: string }> };

function serializeAsset(asset: {
  id: number;
  category: string;
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

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  const assetId = parseRouteId(id);
  if (assetId == null) {
    return NextResponse.json({ message: 'Invalid file ID.' }, { status: 400 });
  }

  const body = await request.json();

  const existing = await prisma.downloadAsset.findUnique({ where: { id: assetId } });
  if (!existing) {
    return NextResponse.json({ message: 'File not found.' }, { status: 404 });
  }

  const updated = await prisma.downloadAsset.update({
    where: { id: assetId },
    data: {
      ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
      ...(body.description !== undefined ? { description: String(body.description) } : {}),
      ...(body.visible !== undefined ? { visible: parseBoolean(body.visible) } : {}),
    },
  });

  return NextResponse.json({ asset: serializeAsset(updated) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  const assetId = parseRouteId(id);
  if (assetId == null) {
    return NextResponse.json({ message: 'Invalid file ID.' }, { status: 400 });
  }

  const existing = await prisma.downloadAsset.findUnique({ where: { id: assetId } });
  if (!existing) {
    return NextResponse.json({ message: 'File not found.' }, { status: 404 });
  }

  await removeAssetFile(existing.filePath);
  await prisma.downloadAsset.delete({ where: { id: assetId } });

  return NextResponse.json({ message: 'File deleted.' });
}
