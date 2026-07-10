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

function resolveRenderable(node: ComponentRenderResult): ComponentRenderResult {
  return typeof node === 'function' ? node() : node;
}

function renderNode(node: ComponentRenderResult): string {
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return escapeHtml(String(node));
  }

  if (node === null || node === undefined) {
    return '';
  }

  const resolved = resolveRenderable(node);

  if (isComponentNode(resolved)) {
    const parts: string[] = [];
    const attrs = Object.entries(resolved.attrs ?? {}).map(([name, value]) => {
      const safeValue = value == null ? '' : escapeHtml(String(value));
      return ` ${name}="${safeValue}"`;
    });

    parts.push(`<${resolved.tag}${attrs.join('')}>`);

    for (const child of resolved.children ?? []) {
      parts.push(renderNode(child));
    }

    parts.push(`</${resolved.tag}>`);
    return parts.join('');
  }

  return renderNode(resolved);
}

export function renderToHtml(root: ComponentDefinition): string {
  return renderNode(root.setup());
}

export function renderToContainer(root: ComponentDefinition, container: Pick<HTMLElement, 'innerHTML'>): void {
  container.innerHTML = renderToHtml(root);
}
