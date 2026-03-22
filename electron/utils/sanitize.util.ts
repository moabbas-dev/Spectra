const INVALID = /[<>:"/\\|?*\u0000-\u001f]/g;

/** Single path segment safe for folder/file names (no separators, no ..). */
export function sanitizePathSegment(raw: string): string {
  const t = raw.trim().replace(INVALID, '-').replace(/^\.+/, '');
  if (t === '' || t === '.' || t === '..') {
    throw new Error('Invalid name');
  }
  return t;
}
