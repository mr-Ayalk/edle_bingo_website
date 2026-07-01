import path from 'path';

const STORAGE_ROOT = path.join(process.cwd(), 'storage');

/** Directory on disk for a download category (outside public/). */
export function downloadStorageDir(category: string): string {
  return path.join(STORAGE_ROOT, 'downloads', category.toLowerCase());
}

/** Value stored in DB for files kept in private storage. */
export function storageFilePath(category: string, storedName: string): string {
  return `storage:downloads/${category.toLowerCase()}/${storedName}`;
}

function assertInsideRoot(absPath: string, root: string): string {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(absPath);
  if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
    throw new Error('Invalid file path.');
  }
  return resolved;
}

/** Resolve a DB filePath to an absolute path (private storage or legacy public/). */
export function resolveAssetAbsPath(filePath: string): string {
  if (filePath.startsWith('storage:')) {
    const rel = filePath.slice('storage:'.length);
    return assertInsideRoot(
      path.join(STORAGE_ROOT, rel.split('/').join(path.sep)),
      STORAGE_ROOT,
    );
  }
  const publicRoot = path.join(process.cwd(), 'public');
  const normalized = filePath.replace(/^\//, '');
  return assertInsideRoot(path.join(publicRoot, normalized), publicRoot);
}

/** Remove a download asset file from disk (storage or legacy public). */
export async function removeAssetFile(filePath: string): Promise<void> {
  const { unlink } = await import('fs/promises');
  try {
    await unlink(resolveAssetAbsPath(filePath));
  } catch {
    // ignore missing files
  }
}
