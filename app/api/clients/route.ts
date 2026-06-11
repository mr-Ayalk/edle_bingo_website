import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwnerOrAgent } from '@/lib/api-auth';
import { parseMoney, moneyToNumber } from '@/lib/money';

function serializeClient(client: {
  id: number;
  agentUserId: number;
  fullName: string;
  phone: string;
  country: string;
  region: string;
  zone: string;
  city: string;
  town: string;
  wereda: string;
  kebele: string;
  addressDetail: string;
  packageAmount: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
  agent?: { name: string; username: string };
}) {
  return {
    id: client.id,
    agentUserId: client.agentUserId,
    agentName: client.agent?.name,
    agentUsername: client.agent?.username,
    fullName: client.fullName,
    phone: client.phone,
    country: client.country,
    region: client.region,
    zone: client.zone,
    city: client.city,
    town: client.town,
    wereda: client.wereda,
    kebele: client.kebele,
    addressDetail: client.addressDetail,
    packageAmount: moneyToNumber(client.packageAmount),
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

export async function GET() {
  const session = await requireOwnerOrAgent();
  if (session instanceof NextResponse) return session;

  if (session.role === 'OWNER') {
    const clients = await prisma.client.findMany({
      include: { agent: { select: { name: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const totalSpent = clients.reduce((sum, c) => sum + moneyToNumber(c.packageAmount), 0);
    return NextResponse.json({
      clients: clients.map(serializeClient),
      totalSpent,
    });
  }

  const clients = await prisma.client.findMany({
    where: { agentUserId: Number(session.sub) },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    clients: clients.map((c) => serializeClient(c)),
  });
}

export async function POST(request: Request) {
  const session = await requireOwnerOrAgent();
  if (session instanceof NextResponse) return session;
  if (session.role !== 'AGENT') {
    return NextResponse.json({ message: 'Only agents can add clients.' }, { status: 403 });
  }

  const body = await request.json();
  const fullName = String(body.fullName || '').trim();
  const phone = String(body.phone || '').trim();

  if (!fullName || !phone) {
    return NextResponse.json({ message: 'Full name and phone are required.' }, { status: 400 });
  }

  let packageAmount;
  try {
    packageAmount = parseMoney(body.packageAmount ?? 0);
  } catch {
    return NextResponse.json({ message: 'Invalid package amount.' }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      agentUserId: Number(session.sub),
      fullName,
      phone,
      country: String(body.country || ''),
      region: String(body.region || ''),
      zone: String(body.zone || ''),
      city: String(body.city || ''),
      town: String(body.town || ''),
      wereda: String(body.wereda || ''),
      kebele: String(body.kebele || ''),
      addressDetail: String(body.addressDetail || ''),
      packageAmount,
    },
  });

  return NextResponse.json({ client: serializeClient(client) }, { status: 201 });
}
