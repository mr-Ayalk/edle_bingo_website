export async function parseJsonResponse<T extends { message?: string } = { message?: string }>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  if (!text) {
    return { message: res.statusText || 'Request failed.' } as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return { message: res.statusText || 'Request failed.' } as T;
  }
}
