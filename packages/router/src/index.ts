import type { ComponentDefinition, ComponentRenderResult } from '../../core/src/index.js';

export interface Route {
  path: string;
  component: ComponentDefinition;
}

export interface RouterInstance {
  currentPath: string;
  navigate(path: string): void;
  render(): ComponentRenderResult;
}

export function createRoute(path: string, component: ComponentDefinition): Route {
  return { path, component };
}

export function createRouter(options: { routes: Route[] }): RouterInstance {
  let currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  const navigate = (path: string) => {
    currentPath = path;
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
  };

  return {
    get currentPath() {
      return currentPath;
    },
    navigate,
    render() {
      const matchedRoute = options.routes.find((route) => route.path === currentPath);
      if (!matchedRoute) {
        return { tag: 'section', children: ['404'] };
      }
      return matchedRoute.component.setup();
    },
  };
}
