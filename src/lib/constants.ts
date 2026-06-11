export function generateVoucherCode(): string {
  const part = () => String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const part4 = () => String(Math.floor(Math.random() * 10000)).padStart(4, '0');
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
