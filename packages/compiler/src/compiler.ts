import { parse } from './parser.js';
import { transform, type TransformOptions, type TNode } from './transform.js';

export type { TNode, TransformOptions };

export interface CompileOptions extends TransformOptions {
  /**
   * Page title inserted into <title> by `compileToHtml`.
   * Defaults to "Yawn App".
   */
  title?: string;
}

// ─── HTML serialiser ──────────────────────────────────────────────────────────

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function serializeNode(node: TNode | string): string {
  if (typeof node === 'string') return escapeHtml(node);

  const attrStr = Object.entries(node.attrs ?? {})
    .map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${escapeHtml(v)}"`))
    .join('');

  if (VOID_TAGS.has(node.tag.toLowerCase())) {
    return `<${node.tag}${attrStr} />`;
  }

  const childStr = (node.children ?? []).map(serializeNode).join('');
  return `<${node.tag}${attrStr}>${childStr}</${node.tag}>`;
}

// ─── Core compile fn (sync) ───────────────────────────────────────────────────

/**
 * Parses and transforms a `.yawn` source string into a `TNode` tree.
 *
 * Component resolution is synchronous — provide `resolveComponent` to look up
 * component sources from disk or a virtual registry.
 *
 * @example
 * const tree = compile('<h1>Hello {{name}}</h1>', { props: { name: 'World' } });
 */
export function compile(source: string, options: CompileOptions = {}): TNode {
  // inject the recursive resolver so transform.ts can call back into compile()
  const resolveAndTransform = (src: string, props: Record<string, string>): TNode => {
    return compile(src, { ...options, props });
  };

  const ast = parse(source);
  return transform(ast, { ...options, _resolveAndTransform: resolveAndTransform });
}

/**
 * Compiles a `.yawn` source string to an HTML fragment string.
 *
 * @example
 * const html = compileToFragment('<p>Hello {{name}}</p>', { props: { name: 'Yawn' } });
 * // '<p>Hello Yawn</p>'
 */
export function compileToFragment(source: string, options: CompileOptions = {}): string {
  return serializeNode(compile(source, options));
}

/**
 * Wraps the compiled fragment in a full HTML document shell.
 *
 * @example
 * const html = compileToHtml(source, { title: 'My Site' });
 */
export function compileToHtml(source: string, options: CompileOptions = {}): string {
  const body = compileToFragment(source, options);
  const title = escapeHtml(options.title ?? 'Yawn App');
  return [
    '<!doctype html>',
    '<html lang="en">',
    '  <head>',
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `    <title>${title}</title>`,
    '  </head>',
    '  <body>',
    `    ${body}`,
    '  </body>',
    '</html>',
  ].join('\n');
}
