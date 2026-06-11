import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwner } from '@/lib/api-auth';
import { addMoney, parseMoney } from '@/lib/money';
import { serializeUser } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  const userId = Number(id);
  const body = await request.json();

  const agent = await prisma.user.findFirst({
    where: { id: userId, role: 'AGENT' },
  });
  if (!agent) {
    return NextResponse.json({ message: 'Agent not found.' }, { status: 404 });
  }

  let amount;
  try {
    amount = parseMoney(body.amount);
  } catch {
    return NextResponse.json({ message: 'Invalid top-up amount.' }, { status: 400 });
  }

  if (amount.lessThanOrEqualTo(0)) {
    return NextResponse.json({ message: 'Invalid top-up amount.' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { balance: addMoney(agent.balance, amount) },
  });

  return NextResponse.json({
    message: 'Agent balance updated.',
    agent: serializeUser(updated),
  });
}
