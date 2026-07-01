import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyDesktopApiKey } from '@/lib/desktop-api-auth';
import {
  parseOptionalAgentId,
  parseVoucherCode,
  serializeVoucherForDesktop,
  voucherBelongsToAgent,
} from '@/lib/voucher-desktop';

export async function GET(request: Request) {
  try {
    if (!verifyDesktopApiKey(request)) {
      return NextResponse.json({ message: 'Unauthorized desktop API request.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = parseVoucherCode(searchParams);
    const agentId = parseOptionalAgentId(searchParams);

    if (!code) {
      return NextResponse.json({ message: 'Voucher code is required.' }, { status: 400 });
    }

    if (agentId == null) {
      return NextResponse.json({ message: 'Agent ID is required.' }, { status: 400 });
    }

    const voucher = await prisma.voucher.findUnique({ where: { code } });
    if (!voucher) {
      return NextResponse.json({ message: 'Voucher not found.' }, { status: 404 });
    }

    if (!voucherBelongsToAgent(voucher, agentId)) {
      return NextResponse.json({ message: 'Invalid voucher for this agent.' }, { status: 400 });
    }

    return NextResponse.json(serializeVoucherForDesktop(voucher));
  } catch (error) {
    console.error('Voucher status error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
