/** Validate PNG or JPEG file signatures. */
export function validateImageBuffer(buffer: Buffer): 'png' | 'jpeg' | null {
  if (buffer.length >= 8) {
    const png =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;
    if (png) return 'png';
  }

  if (buffer.length >= 3) {
    const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (jpeg) return 'jpeg';
  }

  return null;
}
