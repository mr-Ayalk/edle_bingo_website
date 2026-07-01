import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  parseOptionalAgentId,
  parseVoucherCode,
  serializeVoucherForDesktop,
  voucherBelongsToAgent,
} from '@/lib/voucher-desktop';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = parseVoucherCode(searchParams);
    const agentId = parseOptionalAgentId(searchParams);

    if (!code) {
      return NextResponse.json({ message: 'Voucher code is required.' }, { status: 400 });
    }

    const voucher = await prisma.voucher.findUnique({ where: { code } });
    if (!voucher) {
      return NextResponse.json({ message: 'Voucher not found.' }, { status: 404 });
    }

    if (agentId != null && !voucherBelongsToAgent(voucher, agentId)) {
      return NextResponse.json({ message: 'Invalid voucher for this agent.' }, { status: 400 });
    }

    return NextResponse.json(serializeVoucherForDesktop(voucher));
  } catch (error) {
    console.error('Voucher status error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
