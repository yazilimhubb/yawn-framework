import type { Signal } from '../../reactivity/src/signal.js';

// ─── Dev-only utilities ───────────────────────────────────────────────────────

const IS_DEV = typeof process !== 'undefined'
  ? process.env['NODE_ENV'] !== 'production'
  : true;

/**
 * Logs signal value changes to the console during development.
 * No-op in production.
 *
 * @example
 * const count = signal(0);
 * inspectSignal(count, 'count');
 */
export function inspectSignal<T>(sig: Signal<T>, name = 'signal'): () => void {
  if (!IS_DEV) return () => {};

  console.log(`[yawn/devtools] ${name}:`, sig.get());
  return sig.subscribe((/* value tracked via get */) => {
    // subscriber fires after set — re-read for new value
    console.log(`[yawn/devtools] ${name} changed:`, sig.get());
  });
}

/**
 * Prints a simple tree of a TNode to the console.
 */
export function printTree(node: unknown, indent = 0): void {
  if (!IS_DEV) return;

  const pad = '  '.repeat(indent);

  if (typeof node === 'string') {
    console.log(`${pad}"${node}"`);
    return;
  }

  if (typeof node !== 'object' || node === null) return;

  const n = node as { tag?: string; attrs?: Record<string, string>; children?: unknown[] };
  const attrStr = Object.entries(n.attrs ?? {})
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

  console.log(`${pad}<${n.tag ?? '?'}${attrStr ? ' ' + attrStr : ''}>`);

  for (const child of n.children ?? []) {
    printTree(child, indent + 1);
  }
}

/**
 * Simple performance measurement helper.
 *
 * @example
 * const end = measure('compile');
 * compile(source);
 * end(); // logs: [yawn/devtools] compile took 1.23ms
 */
export function measure(label: string): () => void {
  if (!IS_DEV) return () => {};
  const start = performance.now();
  return () => {
    const ms = (performance.now() - start).toFixed(2);
    console.log(`[yawn/devtools] ${label} took ${ms}ms`);
  };
}
