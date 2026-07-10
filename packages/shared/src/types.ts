// ─── Shared framework-wide types ─────────────────────────────────────────────

/** Generic key-value record for attributes and props. */
export type Attrs = Record<string, string | number | boolean | null | undefined>;

/** Generic props object. */
export type Props = Record<string, unknown>;

/** A function that returns void or a cleanup function. */
export type CleanupFn = () => void;

/** Version string shape. */
export interface Version {
  major: number;
  minor: number;
  patch: number;
  toString(): string;
}

export function parseVersion(v: string): Version {
  const [major = 0, minor = 0, patch = 0] = v.split('.').map(Number);
  return { major, minor, patch, toString: () => `${major}.${minor}.${patch}` };
}
