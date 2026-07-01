/** Shared JWT secret access for Edge middleware and Node auth routes. */
export function isJwtConfigured(): boolean {
  const secret = process.env.JWT_SECRET;
  return !!secret && secret.length >= 32;
}

export function getJwtSecretBytes(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set and at least 32 characters.');
    }
    return new TextEncoder().encode('development-fallback-secret-min-32-chars!!');
  }
  return new TextEncoder().encode(secret);
}
