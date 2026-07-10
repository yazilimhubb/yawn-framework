import { parse } from './parser.js';
import { transform, type TransformOptions, type TNode } from './transform.js';

export type { TNode, TransformOptions };

export interface CompileOptions extends TransformOptions {
  title?: string;
}

const VOID_TAGS = new Set([
  'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr',
]);

export function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function serializeNode(node: TNode | string): string {
  if (typeof node === 'string') return escapeHtml(node);
  const attrStr = Object.entries(node.attrs ?? {})
    .map(([k, v]) => v === '' ? ` ${k}` : ` ${k}="${escapeHtml(v)}"`)
    .join('');
  if (VOID_TAGS.has(node.tag.toLowerCase())) return `<${node.tag}${attrStr} />`;
  return `<${node.tag}${attrStr}>${(node.children ?? []).map(serializeNode).join('')}</${node.tag}>`;
}

export function compile(source: string, options: CompileOptions = {}): TNode {
  const resolveAndTransform = (src: string, props: Record<string, string>): TNode =>
    compile(src, { ...options, props });
  return transform(parse(source), { ...options, _resolveAndTransform: resolveAndTransform });
}

export function compileToFragment(source: string, options: CompileOptions = {}): string {
  return serializeNode(compile(source, options));
}

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
