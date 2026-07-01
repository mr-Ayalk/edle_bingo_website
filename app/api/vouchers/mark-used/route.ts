import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';

import { verifyDesktopApiKey } from '@/lib/desktop-api-auth';

import {

  parseOptionalAgentId,

  parseVoucherCode,

  serializeVoucherForDesktop,

  voucherBelongsToAgent,

} from '@/lib/voucher-desktop';



export async function PUT(request: Request) {

  try {

    if (!verifyDesktopApiKey(request)) {

      return NextResponse.json({ message: 'Unauthorized desktop API request.' }, { status: 401 });

    }



    const body = await request.json().catch(() => ({}));

    const code = parseVoucherCode(new URL(request.url).searchParams, body);

    const agentId = parseOptionalAgentId(new URL(request.url).searchParams, body);

    const redeemedBy =

      body.redeemedBy != null

        ? String(body.redeemedBy)

        : agentId != null

          ? String(agentId)

          : null;



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



    if (voucher.status === 'USED') {

      return NextResponse.json({ message: 'Voucher already used.' }, { status: 409 });

    }



    const result = await prisma.voucher.updateMany({

      where: { code, status: 'ACTIVE' },

      data: {

        status: 'USED',

        usedAt: new Date(),

        redeemedBy,

      },

    });



    if (result.count === 0) {

      const current = await prisma.voucher.findUnique({ where: { code } });

      if (current?.status === 'USED') {

        return NextResponse.json({ message: 'Voucher already used.' }, { status: 409 });

      }

      return NextResponse.json({ message: 'Unable to redeem voucher.' }, { status: 409 });

    }



    const updated = await prisma.voucher.findUnique({ where: { code } });

    if (!updated) {

      return NextResponse.json({ message: 'Voucher not found.' }, { status: 404 });

    }



    return NextResponse.json(serializeVoucherForDesktop(updated));

  } catch (error) {

    console.error('Mark voucher used error:', error);

    return NextResponse.json({ message: 'Server Error' }, { status: 500 });

  }

}

