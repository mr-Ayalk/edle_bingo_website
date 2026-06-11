import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';

const DOWNLOADS = [
  {
    id: 'edle-bingo',
    name: 'EDLE_BINGO.exe',
    description: 'Edle Bingo desktop application',
    file: '/downloads/EDLE_BINGO.exe',
  },
  {
    id: 'nodejs',
    name: 'Node.js Runtime',
    description: 'Required Node.js runtime for Edle Bingo',
    file: '/downloads/nodejs-installer.msi',
  },
];

export async function GET() {
  const session = await requireRole('DOWNLOADER');
  if (session instanceof NextResponse) return session;
  return NextResponse.json({ downloads: DOWNLOADS });
}
