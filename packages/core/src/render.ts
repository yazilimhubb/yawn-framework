import type { ComponentDefinition, ComponentNode, ComponentRenderResult } from './component.js';
import { isComponentNode } from './component.js';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const VOID_ELEMENTS = new Set([
  'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr',
]);

export function renderNode(node: ComponentRenderResult): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string') return escapeHtml(node);
  if (typeof node === 'number' || typeof node === 'boolean') return escapeHtml(String(node));

  const resolved = typeof node === 'function' ? node() : node;
  if (!isComponentNode(resolved)) return renderNode(resolved);

  const { tag, attrs = {}, children = [] } = resolved as ComponentNode;
  const attrStr = Object.entries(attrs)
    .filter(([, v]) => v !== false && v !== null && v !== undefined)
    .map(([name, value]) => value === true ? ` ${name}` : ` ${name}="${escapeHtml(String(value))}"`)
    .join('');

  if (VOID_ELEMENTS.has(tag.toLowerCase())) return `<${tag}${attrStr} />`;

  return `<${tag}${attrStr}>${children.map(renderNode).join('')}</${tag}>`;
}

export function renderToHtml(root: ComponentDefinition): string {
  return renderNode(root.setup(root.props ?? {}));
}

export function renderToContainer(root: ComponentDefinition, container: Pick<HTMLElement, 'innerHTML'>): void {
  container.innerHTML = renderToHtml(root);
}
