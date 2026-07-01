import type { DownloadCategory } from '@prisma/client';
import type { TranslationKey } from '@/lib/i18n/translations';

export type CategoryMeta = {
  id: DownloadCategory;
  icon: string;
  maxFiles: number | null;
  accept: string;
  extensions: string[];
  maxSizeMb: number;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  hintKey: TranslationKey;
};

export const DOWNLOAD_CATEGORIES: CategoryMeta[] = [
  {
    id: 'SETUP',
    labelKey: 'uploadCatSetup',
    descriptionKey: 'uploadCatSetupDesc',
    hintKey: 'uploadCatSetupHint',
    icon: '💻',
    maxFiles: 1,
    accept: '.exe',
    extensions: ['.exe'],
    maxSizeMb: 250,
  },
  {
    id: 'NODE',
    labelKey: 'uploadCatNode',
    descriptionKey: 'uploadCatNodeDesc',
    hintKey: 'uploadCatNodeHint',
    icon: '🟢',
    maxFiles: 1,
    accept: '.exe,.msi',
    extensions: ['.exe', '.msi'],
    maxSizeMb: 150,
  },
  {
    id: 'APK_CARTELA',
    labelKey: 'uploadCatApk',
    descriptionKey: 'uploadCatApkDesc',
    hintKey: 'uploadCatApkHint',
    icon: '📱',
    maxFiles: null,
    accept: '.apk',
    extensions: ['.apk'],
    maxSizeMb: 100,
  },
  {
    id: 'PNG_CARTELA',
    labelKey: 'uploadCatPng',
    descriptionKey: 'uploadCatPngDesc',
    hintKey: 'uploadCatPngHint',
    icon: '🖼️',
    maxFiles: null,
    accept: '.zip',
    extensions: ['.zip'],
    maxSizeMb: 100,
  },
  {
    id: 'CARTELA_SYSTEM',
    labelKey: 'uploadCatSystem',
    descriptionKey: 'uploadCatSystemDesc',
    hintKey: 'uploadCatSystemHint',
    icon: '📊',
    maxFiles: null,
    accept: '.xlsx,.xls,.json',
    extensions: ['.xlsx', '.xls', '.json'],
    maxSizeMb: 50,
  },
  {
    id: 'ANYDESK',
    labelKey: 'uploadCatAnydesk',
    descriptionKey: 'uploadCatAnydeskDesc',
    hintKey: 'uploadCatAnydeskHint',
    icon: '🛰️',
    maxFiles: 2,
    accept: '.exe,.apk',
    extensions: ['.exe', '.apk'],
    maxSizeMb: 100,
  },
];

export function getCategoryMeta(category: DownloadCategory): CategoryMeta {
  return DOWNLOAD_CATEGORIES.find((c) => c.id === category) ?? DOWNLOAD_CATEGORIES[0];
}

export function getLocalizedCategory(
  category: DownloadCategory,
  tr: (key: TranslationKey) => string,
) {
  const meta = getCategoryMeta(category);
  return {
    ...meta,
    label: tr(meta.labelKey),
    description: tr(meta.descriptionKey),
    hint: tr(meta.hintKey),
  };
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
