import type { ChildNode, ElementNode, TextNode } from './parser.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TransformOptions {
  /**
   * Resolve a component name to raw .yawn source.
   * Return null/undefined to leave the tag as a plain HTML element.
   */
  resolveComponent?: (name: string) => string | null | undefined;
  /** Props injected into {{placeholder}} slots. */
  props?: Record<string, string>;
}

export interface TNode {
  tag: string;
  attrs?: Record<string, string>;
  children?: Array<TNode | string>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function interpolate(text: string, props: Record<string, string>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_m, key: string) => props[key.trim()] ?? '');
}

function interpolateAttrs(
  attrs: Record<string, string>,
  props: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    out[k] = interpolate(v, props);
  }
  return out;
}

function isComponent(tag: string): boolean {
  return tag.startsWith('con:') || /^[A-Z]/.test(tag);
}

function componentName(tag: string): string {
  return tag.startsWith('con:') ? tag.slice(4) : tag;
}

// ─── Transform ────────────────────────────────────────────────────────────────

/**
 * Lazily import parse to avoid circular dependency at module initialisation.
 * compile() calls transform() which calls parse() — so we need late binding.
 */
let _parse: ((src: string) => ChildNode[]) | undefined;

async function getParser() {
  if (!_parse) {
    const mod = await import('./parser.js');
    _parse = mod.parse;
  }
  return _parse;
}

function transformNodeSync(
  node: ChildNode,
  options: TransformOptions,
  resolveAndTransform: (src: string, childProps: Record<string, string>) => TNode,
  depth = 0,
): TNode | string | null {
  if (depth > 64) return null;

  if (node.type === 'text') {
    const text = interpolate((node as TextNode).value, options.props ?? {});
    return text.trim() ? text : null;
  }

  const el = node as ElementNode;

  if (isComponent(el.tag)) {
    const name = componentName(el.tag);
    const resolved = options.resolveComponent?.(name);

    if (resolved != null) {
      const childProps: Record<string, string> = {
        ...(options.props ?? {}),
        ...interpolateAttrs(el.attrs, options.props ?? {}),
      };
      return resolveAndTransform(resolved, childProps);
    }
  }

  const attrs = interpolateAttrs(el.attrs, options.props ?? {});
  const children: Array<TNode | string> = [];

  for (const child of el.children) {
    const t = transformNodeSync(child, options, resolveAndTransform, depth + 1);
    if (t !== null) children.push(t);
  }

  const result: TNode = { tag: el.tag };
  if (Object.keys(attrs).length) result.attrs = attrs;
  if (children.length) result.children = children;
  return result;
}

export function transform(nodes: ChildNode[], options: TransformOptions = {}): TNode {
  // resolveAndTransform is injected by compiler.ts to avoid circular deps
  const resolveAndTransform = options._resolveAndTransform as
    | ((src: string, props: Record<string, string>) => TNode)
    | undefined;

  const children: Array<TNode | string> = [];

  for (const node of nodes) {
    const t = transformNodeSync(
      node,
      options,
      resolveAndTransform ?? (() => ({ tag: 'div' })),
    );
    if (t !== null) children.push(t);
  }

  if (children.length === 1 && typeof children[0] !== 'string') {
    return children[0] as TNode;
  }

  return { tag: 'div', children };
}

// augment TransformOptions to carry internal resolver without exposing in public API
declare module './transform.js' {
  interface TransformOptions {
    /** @internal injected by compiler.ts */
    _resolveAndTransform?: (src: string, props: Record<string, string>) => TNode;
  }
}
