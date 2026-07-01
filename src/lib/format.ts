export function formatNumber(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatBirr(amount: number): string {
  return `${formatNumber(amount)} Birr`;
}

/** Strip commas and parse a user-entered amount string. */
export function parseAmountInput(value: string): number {
  const cleaned = value.replace(/,/g, '').trim();
  if (!cleaned) return NaN;
  return Number(cleaned);
}

/** Format digits with thousand separators while typing (e.g. 20000 → 20,000). */
export function formatAmountInputRaw(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  if (!cleaned) return '';

  const dotIndex = cleaned.indexOf('.');
  const intRaw = dotIndex === -1 ? cleaned : cleaned.slice(0, dotIndex);
  const decRaw = dotIndex === -1 ? '' : cleaned.slice(dotIndex + 1, dotIndex + 3);

  const intPart = intRaw.replace(/^0+(?=\d)/, '') || intRaw;
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (dotIndex !== -1) {
    return decRaw.length ? `${formattedInt}.${decRaw}` : `${formattedInt}.`;
  }
  return formattedInt;
}

const DATE_LOCALES = { en: 'en-US', am: 'am-ET' } as const;

export function formatDisplayDate(iso: string, locale: keyof typeof DATE_LOCALES = 'en'): string {
  return new Date(iso).toLocaleDateString(DATE_LOCALES[locale], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDisplayDateTime(iso: string, locale: keyof typeof DATE_LOCALES = 'en'): string {
  return new Date(iso).toLocaleString(DATE_LOCALES[locale], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
