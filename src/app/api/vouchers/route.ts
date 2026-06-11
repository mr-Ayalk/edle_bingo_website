import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwnerOrAgent, requireAgent } from '@/lib/api-auth';
import { generateVoucherCode, isValidVoucherCode } from '@/lib/constants';
import { parseMoney, subtractMoney, moneyToNumber } from '@/lib/money';
import { serializeUser } from '@/lib/auth';

export async function GET() {
  const session = await requireOwnerOrAgent();
  if (session instanceof NextResponse) return session;

  if (session.role === 'OWNER') {
    const vouchers = await prisma.voucher.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({
      vouchers: vouchers.map((v) => ({
        id: v.id,
        code: v.code,
        amount: moneyToNumber(v.amount),
        agentUserId: v.agentUserId,
        agentName: v.agentName,
        gameAgentId: v.gameAgentId,
        status: v.status.toLowerCase(),
        createdAt: v.createdAt.toISOString(),
        usedAt: v.usedAt?.toISOString() ?? null,
        redeemedBy: v.redeemedBy,
      })),
    });
  }

  const userId = Number(session.sub);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ message: 'User not found.' }, { status: 404 });

  const vouchers = await prisma.voucher.findMany({
    where: {
      OR: [{ agentUserId: userId }, ...(user.gameAgentId ? [{ gameAgentId: user.gameAgentId }] : [])],
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    vouchers: vouchers.map((v) => ({
      id: v.id,
      code: v.code,
      amount: moneyToNumber(v.amount),
      agentUserId: v.agentUserId,
      agentName: v.agentName,
      status: v.status.toLowerCase(),
      createdAt: v.createdAt.toISOString(),
      usedAt: v.usedAt?.toISOString() ?? null,
    })),
    balance: moneyToNumber(user.balance),
  });
}

export async function POST(request: Request) {
  const session = await requireAgent();
  if (session instanceof NextResponse) return session;

  const body = await request.json();
  const userId = Number(session.sub);

  let voucherAmount;
  try {
    voucherAmount = parseMoney(body.amount);
  } catch {
    return NextResponse.json({ message: 'Invalid voucher amount.' }, { status: 400 });
  }

  if (voucherAmount.lessThanOrEqualTo(0)) {
    return NextResponse.json({ message: 'Invalid voucher amount.' }, { status: 400 });
  }

  const voucherCode = (body.code ? String(body.code) : generateVoucherCode()).trim();
  if (!isValidVoucherCode(voucherCode)) {
    return NextResponse.json(
      { message: 'Voucher code must use format 391-143-6825.' },
      { status: 400 },
    );
  }

  const existing = await prisma.voucher.findUnique({ where: { code: voucherCode } });
  if (existing) {
    return NextResponse.json({ message: 'A voucher with this code already exists.' }, { status: 409 });
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const agent = await tx.user.findFirst({
          where: { id: userId, role: 'AGENT' },
        });
        if (!agent) throw new Error('Agent not found.');

        const newBalance = subtractMoney(agent.balance, voucherAmount);

        const updatedAgent = await tx.user.update({
          where: { id: agent.id },
          data: { balance: newBalance },
        });

        const voucher = await tx.voucher.create({
          data: {
            code: voucherCode,
            amount: voucherAmount,
            agentUserId: agent.id,
            agentName: agent.name,
            gameAgentId: agent.gameAgentId,
          },
        });

        return { voucher, agent: updatedAgent };
      },
      { maxWait: 10000, timeout: 30000 },
    );

    return NextResponse.json(
      {
        voucher: {
          id: result.voucher.id,
          code: result.voucher.code,
          amount: moneyToNumber(result.voucher.amount),
          status: result.voucher.status.toLowerCase(),
          createdAt: result.voucher.createdAt.toISOString(),
        },
        user: serializeUser(result.agent),
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create voucher.';
    const status = message.includes('Insufficient') ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}
