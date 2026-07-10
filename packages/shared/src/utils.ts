/**
 * Escapes HTML special characters in a string.
 * This is the single canonical implementation — import from here
 * instead of duplicating across packages.
 */
export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Clamps a number between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Returns true if the value is a plain object (not array, not null).
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep-merges two plain objects. Arrays are replaced, not merged.
 */
export function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result = { ...base };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const b = base[key];
    const o = override[key];
    if (isPlainObject(b) && isPlainObject(o)) {
      result[key] = deepMerge(b, o as Partial<typeof b>) as T[keyof T];
    } else if (o !== undefined) {
      result[key] = o as T[keyof T];
    }
  }
  return result;
}

/**
 * Generates a short random ID (not cryptographically secure).
 */
export function nanoid(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
