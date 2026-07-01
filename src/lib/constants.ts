function randomInt(min: number, max: number): number {
  const range = max - min;
  if (typeof globalThis.crypto !== 'undefined' && 'getRandomValues' in globalThis.crypto) {
    const arr = new Uint32Array(1);
    globalThis.crypto.getRandomValues(arr);
    return min + (arr[0] % range);
  }
  return Math.floor(Math.random() * range) + min;
}

export function generateVoucherCode(): string {
  const part = () => String(randomInt(0, 1000)).padStart(3, '0');
  const part4 = () => String(randomInt(0, 10000)).padStart(4, '0');
  return `${part()}-${part()}-${part4()}`;
}

export function isValidVoucherCode(code: string): boolean {
  return /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/.test(code.trim());
}

export const FONT_OPTIONS = [
  { id: 'Inter', label: 'Inter' },
  { id: 'Roboto', label: 'Roboto' },
  { id: 'Georgia', label: 'Georgia' },
  { id: 'Noto Sans Ethiopic', label: 'Noto Sans Ethiopic' },
  { id: 'Courier New', label: 'Monospace' },
] as const;

export const STICKERS = ['🎲', '🎯', '🏆', '💎', '🎖️', '🥇', '🥈', '🚩', '✨', '🔥', '💰', '🎉'] as const;

export const BADGES = [
  { value: '🚩', label: 'Agent' },
  { value: '🥈', label: 'Silver' },
  { value: '🥇', label: 'Golden' },
  { value: '🎖', label: 'Platinum' },
  { value: '©💎', label: 'Diamond' },
] as const;

export const AVATARS = ['🎲', '🧩', '♠️', '♣️', '♥️', '♦️', '🟢', '🔵', '🟠'] as const;
