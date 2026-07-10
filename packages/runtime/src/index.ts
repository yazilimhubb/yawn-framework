import { HYDRATION_ATTR } from '../../shared/src/constants.js';
import type { ComponentDefinition } from '../../core/src/component.js';
import { renderToContainer } from '../../core/src/render.js';

export interface MountOptions {
  /**
   * CSS selector or HTMLElement for the mount target.
   * Defaults to the element with [data-yawn-root] attribute, then document.body.
   */
  target?: string | HTMLElement;
}

/**
 * Mounts a component into the DOM.
 * Call this once in your browser entry point.
 *
 * @example
 * import { mount } from '@yh-framework/runtime';
 * import App from './App.js';
 *
 * mount(App);
 */
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

  renderToContainer(root, container);
}

/**
 * Hydrates server-rendered HTML.
 * Currently performs a client-side re-render into the target.
 * Future versions will diff against existing DOM.
 */
export function hydrate(root: ComponentDefinition, options: MountOptions = {}): void {
  // For now hydrate = mount (full re-render).
  // TODO: incremental hydration with DOM diffing.
  mount(root, options);
}
