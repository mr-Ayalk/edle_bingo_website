import type { DownloadCategory } from '@prisma/client';

export type CategoryMeta = {
  id: DownloadCategory;
  label: string;
  description: string;
  icon: string;
  maxFiles: number | null;
  hint: string;
  accept: string;
  extensions: string[];
  maxSizeMb: number;
};

export const DOWNLOAD_CATEGORIES: CategoryMeta[] = [
  {
    id: 'SETUP',
    label: 'Setup',
    description: 'Edle Bingo desktop installer',
    icon: '💻',
    maxFiles: 1,
    hint: '1 file — e.g. EDLE_BINGO-Setup-7.4.2.exe (up to 250 MB)',
    accept: '.exe',
    extensions: ['.exe'],
    maxSizeMb: 250,
  },
  {
    id: 'NODE',
    label: 'Node',
    description: 'Node.js runtime installer',
    icon: '🟢',
    maxFiles: 1,
    hint: '1 file — Node.js installer (.exe, .msi)',
    accept: '.exe,.msi',
    extensions: ['.exe', '.msi'],
    maxSizeMb: 150,
  },
  {
    id: 'APK_CARTELA',
    label: 'APK Cartela',
    description: 'Android cartela APK packages',
    icon: '📱',
    maxFiles: null,
    hint: '6–10+ APK files',
    accept: '.apk',
    extensions: ['.apk'],
    maxSizeMb: 100,
  },
  {
    id: 'PNG_CARTELA',
    label: 'PNG Cartela',
    description: 'PNG cartela zip archives',
    icon: '🖼️',
    maxFiles: null,
    hint: '6–10+ ZIP files',
    accept: '.zip',
    extensions: ['.zip'],
    maxSizeMb: 100,
  },
  {
    id: 'CARTELA_SYSTEM',
    label: 'Cartela System',
    description: 'Spreadsheet and JSON configuration files',
    icon: '📊',
    maxFiles: null,
    hint: '10–20+ XLSX and JSON files',
    accept: '.xlsx,.xls,.json',
    extensions: ['.xlsx', '.xls', '.json'],
    maxSizeMb: 50,
  },
  {
    id: 'ANYDESK',
    label: 'AnyDesk',
    description: 'AnyDesk remote support apps',
    icon: '🛰️',
    maxFiles: 2,
    hint: '2 files — .exe and .apk',
    accept: '.exe,.apk',
    extensions: ['.exe', '.apk'],
    maxSizeMb: 100,
  },
];

export function getCategoryMeta(category: DownloadCategory): CategoryMeta {
  return DOWNLOAD_CATEGORIES.find((c) => c.id === category) ?? DOWNLOAD_CATEGORIES[0];
}

export function isAllowedExtension(category: DownloadCategory, fileName: string): boolean {
  const meta = getCategoryMeta(category);
  const lower = fileName.toLowerCase();
  return meta.extensions.some((ext) => lower.endsWith(ext));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
