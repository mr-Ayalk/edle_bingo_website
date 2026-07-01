export function formatNumber(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatBirr(amount: number): string {
  return `${formatNumber(amount)} Birr`;
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
