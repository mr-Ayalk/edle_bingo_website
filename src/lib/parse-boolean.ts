/** Parse boolean values from JSON/form bodies (avoids Boolean("false") === true). */
export function parseBoolean(value: unknown, defaultValue = false): boolean {
  if (value === true || value === 'true' || value === '1' || value === 1) return true;
  if (value === false || value === 'false' || value === '0' || value === 0) return false;
  return defaultValue;
}
