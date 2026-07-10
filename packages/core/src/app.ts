import type { ComponentDefinition } from './component.js';
import { renderToContainer } from './render.js';
import type { AppModule } from './modules/index.js';

export interface AppInstance {
  mount(container: HTMLElement | { innerHTML: string }): void;
}

export interface AppOptions {
  modules?: AppModule[];
}

export function createApp(rootComponent: ComponentDefinition, options: AppOptions = {}): AppInstance {
  const modules = options.modules ?? [];

  return {
    mount(container: HTMLElement | { innerHTML: string }) {
      for (const module of modules) {
        module.setup?.({ use: (m) => modules.push(m) });
        module.onInit?.({ modules });
      }

      renderToContainer(rootComponent, container);

      for (const module of modules) {
        module.onMount?.();
      }
    },
  };
}

export function renderWithModules(rootComponent: ComponentDefinition, modules: AppModule[] = []): string {
  let html = '';
  // reuse renderToContainer logic by rendering to a fake container
  const container: { innerHTML: string } = { innerHTML: '' };
  renderToContainer(rootComponent, container);
  html = container.innerHTML;

  for (const module of modules) {
    if (module.onBeforeRender) {
      const res = module.onBeforeRender(html);
      if (typeof res === 'string') html = res;
    }
  }

  return html;
}
