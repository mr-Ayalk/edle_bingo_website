export function formatNumber(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatBirr(amount: number): string {
  return `${formatNumber(amount)} Birr`;
}
