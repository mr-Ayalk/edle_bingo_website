import path from 'path';

const MESSAGE_STORAGE_ROOT = path.join(process.cwd(), 'storage', 'messages');

const SAFE_FILENAME = /^[\w.-]+\.(png|jpg|jpeg)$/i;

export function messageStorageDir(): string {
  return MESSAGE_STORAGE_ROOT;
}

export function messageStoragePath(filename: string): string {
  if (!isSafeMessageFilename(filename)) {
    throw new Error('Invalid message image filename.');
  }
  return path.join(MESSAGE_STORAGE_ROOT, filename);
}

export function isSafeMessageFilename(filename: string): boolean {
  return SAFE_FILENAME.test(filename) && !filename.includes('..');
}

export function messageImageApiUrl(filename: string): string {
  return `/api/messages/image/${filename}`;
}

export function messageImageMime(filename: string): string {
  return filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
}
