import type { ComponentDefinition } from '@yawn-framework/core';

export interface MountOptions {
  target?: string | HTMLElement;
}

const HYDRATION_ATTR = 'data-yawn-root';

export function mount(root: ComponentDefinition, options: MountOptions = {}): void {
  if (typeof document === 'undefined') {
    throw new Error('[yawn/runtime] mount() can only be called in a browser environment.');
  }

  let container: HTMLElement | null = null;

  if (typeof options.target === 'string') {
    container = document.querySelector<HTMLElement>(options.target);
  } else if (options.target instanceof HTMLElement) {
    container = options.target;
  } else {
    container =
      document.querySelector<HTMLElement>(`[${HYDRATION_ATTR}]`) ??
      document.body;
  }

  if (!container) {
    throw new Error(`[yawn/runtime] Mount target not found: ${options.target}`);
  }

  // Inline render to avoid cross-package relative import
  container.innerHTML = (root.setup as (p: Record<string, unknown>) => unknown)(root.props ?? {}) as string;
}

export function hydrate(root: ComponentDefinition, options: MountOptions = {}): void {
  mount(root, options);
}
