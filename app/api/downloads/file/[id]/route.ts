import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { resolveAssetAbsPath } from '@/lib/download-storage';
import { parseRouteId } from '@/lib/route-params';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireRole('DOWNLOADER');
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  const assetId = parseRouteId(id);
  if (assetId == null) {
    return NextResponse.json({ message: 'Invalid file ID.' }, { status: 400 });
  }

  const asset = await prisma.downloadAsset.findFirst({
    where: { id: assetId, visible: true },
  });
  if (!asset) {
    return NextResponse.json({ message: 'File not found.' }, { status: 404 });
  }

  try {
    const absPath = resolveAssetAbsPath(asset.filePath);
    const buffer = await readFile(absPath);
    const safeName = asset.fileName.replace(/[^\w\s.-]/g, '_');
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': asset.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Download file error:', error);
    return NextResponse.json({ message: 'File unavailable.' }, { status: 404 });
  }
}
