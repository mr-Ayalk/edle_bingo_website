import { Prisma } from '@prisma/client';
import { formatNumber } from './format';

/** Parse monetary input without floating-point drift (e.g. 400 stays 400). */
export function parseMoney(value: unknown): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) return value;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Invalid amount.');
    const normalized = Math.round(value * 100) / 100;
    return new Prisma.Decimal(normalized.toFixed(2));
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) throw new Error('Invalid amount.');
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) throw new Error('Invalid amount.');
    const normalized = Math.round(parsed * 100) / 100;
    return new Prisma.Decimal(normalized.toFixed(2));
  }

  throw new Error('Invalid amount.');
}

export function moneyToNumber(value: Prisma.Decimal | string | number): number {
  return Number(parseMoney(value).toFixed(2));
}

export function formatMoney(value: Prisma.Decimal | string | number): string {
  return formatNumber(moneyToNumber(value));
}

export function subtractMoney(
  balance: Prisma.Decimal,
  amount: Prisma.Decimal,
): Prisma.Decimal {
  const result = parseMoney(balance).minus(parseMoney(amount));
  if (result.lessThan(0)) throw new Error('Insufficient balance.');
  return result;
}

export function addMoney(a: Prisma.Decimal, b: Prisma.Decimal): Prisma.Decimal {
  return parseMoney(a).plus(parseMoney(b));
}
