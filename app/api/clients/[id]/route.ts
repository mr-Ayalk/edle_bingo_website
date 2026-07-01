import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwnerOrAgent } from '@/lib/api-auth';
import { parseMoney, moneyToNumber } from '@/lib/money';
import { parseRouteId } from '@/lib/route-params';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireOwnerOrAgent();
  if (session instanceof NextResponse) return session;
  if (session.role !== 'AGENT') {
    return NextResponse.json({ message: 'Only agents can update clients.' }, { status: 403 });
  }

  const { id } = await context.params;
  const clientId = parseRouteId(id);
  if (clientId == null) {
    return NextResponse.json({ message: 'Invalid client ID.' }, { status: 400 });
  }

  const existing = await prisma.client.findFirst({
    where: { id: clientId, agentUserId: Number(session.sub) },
  });
  if (!existing) {
    return NextResponse.json({ message: 'Client not found.' }, { status: 404 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.fullName !== undefined) data.fullName = String(body.fullName).trim();
  if (body.phone !== undefined) data.phone = String(body.phone).trim();
  if (body.country !== undefined) data.country = String(body.country);
  if (body.region !== undefined) data.region = String(body.region);
  if (body.zone !== undefined) data.zone = String(body.zone);
  if (body.city !== undefined) data.city = String(body.city);
  if (body.town !== undefined) data.town = String(body.town);
  if (body.wereda !== undefined) data.wereda = String(body.wereda);
  if (body.kebele !== undefined) data.kebele = String(body.kebele);
  if (body.addressDetail !== undefined) data.addressDetail = String(body.addressDetail);
  if (body.packageAmount !== undefined) {
    try {
      data.packageAmount = parseMoney(body.packageAmount);
    } catch {
      return NextResponse.json({ message: 'Invalid package amount.' }, { status: 400 });
    }
  }

  const client = await prisma.client.update({ where: { id: clientId }, data });

  return NextResponse.json({
    client: {
      id: client.id,
      fullName: client.fullName,
      phone: client.phone,
      packageAmount: moneyToNumber(client.packageAmount),
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireOwnerOrAgent();
  if (session instanceof NextResponse) return session;
  if (session.role !== 'AGENT') {
    return NextResponse.json({ message: 'Only agents can delete clients.' }, { status: 403 });
  }

  const { id } = await context.params;
  const clientId = parseRouteId(id);
  if (clientId == null) {
    return NextResponse.json({ message: 'Invalid client ID.' }, { status: 400 });
  }

  const existing = await prisma.client.findFirst({
    where: { id: clientId, agentUserId: Number(session.sub) },
  });
  if (!existing) {
    return NextResponse.json({ message: 'Client not found.' }, { status: 404 });
  }

  await prisma.client.delete({ where: { id: clientId } });
  return NextResponse.json({ message: 'Client removed.' });
}
