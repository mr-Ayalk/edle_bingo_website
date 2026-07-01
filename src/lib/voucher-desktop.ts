import type { Voucher } from '@prisma/client';
import { moneyToNumber } from './money';

/** Desktop app sends `voucherCode`; web portal may send `code`. */
export function parseVoucherCode(
  searchParams: URLSearchParams,
  body?: Record<string, unknown>,
): string {
  const fromQuery =
    searchParams.get('voucherCode') ||
    searchParams.get('code') ||
    searchParams.get('voucher');
  if (fromQuery?.trim()) return fromQuery.trim();

  if (body) {
    const fromBody = body.voucherCode ?? body.code ?? body.voucher;
    if (fromBody) return String(fromBody).trim();
  }

  return '';
}

export function parseOptionalAgentId(
  searchParams: URLSearchParams,
  body?: Record<string, unknown>,
): number | null {
  const raw = searchParams.get('agentId') ?? (body?.agentId != null ? String(body.agentId) : null);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function voucherBelongsToAgent(voucher: Voucher, agentId: number | null): boolean {
  if (agentId == null) return false;
  if (voucher.gameAgentId != null) return voucher.gameAgentId === agentId;
  return voucher.agentUserId === agentId;
}

export function serializeVoucherForDesktop(voucher: Voucher) {
  return {
    code: voucher.code,
    voucherCode: voucher.code,
    amount: moneyToNumber(voucher.amount),
    status: voucher.status.toLowerCase(),
    agentName: voucher.agentName,
    agentId: voucher.gameAgentId,
    gameAgentId: voucher.gameAgentId,
    createdAt: voucher.createdAt.toISOString(),
    usedAt: voucher.usedAt?.toISOString() ?? null,
  };
}
