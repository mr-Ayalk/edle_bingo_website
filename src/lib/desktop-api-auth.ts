/** Validates desktop-app integration requests (voucher status / mark-used). */
export function verifyDesktopApiKey(_request: Request): boolean {
  const expected = process.env.DESKTOP_API_KEY;
  if (!expected) {
    return true;
  }
  const header = _request.headers.get('x-desktop-api-key');
  return header === expected;
}

export function desktopApiUnauthorized(): Response {
  return Response.json({ message: 'Unauthorized desktop API request.' }, { status: 401 });
}
