import type { ComponentDefinition } from './component.js';
import { renderToHtml } from './render.js';
import type { AppModule } from './modules/index.js';

export interface AppInstance {
  mount(container: HTMLElement | { innerHTML: string }): void;
  update(): void;
  unmount(): void;
}

export interface AppOptions {
  modules?: AppModule[];
}

export function createApp(rootComponent: ComponentDefinition, options: AppOptions = {}): AppInstance {
  const modules = options.modules ?? [];
  let mountedContainer: HTMLElement | { innerHTML: string } | null = null;
  let isMounted = false;

  function runModuleSetup() {
    for (const module of modules) {
      module.setup?.({ modules, use: (m) => modules.push(m) });
      module.onInit?.({ modules });
    }
  }

  function runRender(container: HTMLElement | { innerHTML: string }) {
    let html = renderToHtml(rootComponent);
    for (const module of modules) {
      if (module.onBeforeRender) {
        const result = module.onBeforeRender(html);
        if (typeof result === 'string') html = result;
      }
    }
    container.innerHTML = html;
  }

  const instance: AppInstance = {
    mount(container) {
      if (!isMounted) runModuleSetup();
      mountedContainer = container;
      runRender(container);
      isMounted = true;
      for (const module of modules) module.onMount?.();
    },
    update() {
      if (mountedContainer) runRender(mountedContainer);
    },
    unmount() {
      if (mountedContainer) (mountedContainer as { innerHTML: string }).innerHTML = '';
      mountedContainer = null;
      isMounted = false;
      for (const module of modules) module.onUnmount?.();
    },
  };

  return instance;
}

export function createReactiveApp(
  rootComponent: ComponentDefinition,
  effectFn: (fn: () => void) => { stop(): void },
  options: AppOptions = {},
): AppInstance & { stop(): void } {
  const app = createApp(rootComponent, options);
  let stopEffect: (() => void) | null = null;
  const originalMount = app.mount.bind(app);

  return {
    ...app,
    mount(container) {
      originalMount(container);
      const handle = effectFn(() => app.update());
      stopEffect = handle.stop.bind(handle);
    },
    stop() {
      stopEffect?.();
      app.unmount();
    },
  };
}

export function renderWithModules(rootComponent: ComponentDefinition, modules: AppModule[] = []): string {
  let html = renderToHtml(rootComponent);
  for (const module of modules) {
    if (module.onBeforeRender) {
      const result = module.onBeforeRender(html);
      if (typeof result === 'string') html = result;
    }
  }
  return html;
}
