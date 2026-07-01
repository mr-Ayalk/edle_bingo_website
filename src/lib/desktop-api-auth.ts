/** Validates desktop-app integration requests (voucher status / mark-used). */
export function verifyDesktopApiKey(request: Request): boolean {
  const expected = process.env.DESKTOP_API_KEY;
  if (!expected) {
    return process.env.ALLOW_INSECURE_DESKTOP_API === 'true';
  }
  const header = request.headers.get('x-desktop-api-key');
  return header === expected;
}

export function desktopApiUnauthorized(): Response {
  return Response.json({ message: 'Unauthorized desktop API request.' }, { status: 401 });
}
