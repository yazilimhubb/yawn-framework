import type { ComponentDefinition, ComponentNode, ComponentRenderResult } from '@yawn-framework/core';

export interface Route {
  path: string;
  component: ComponentDefinition;
}

export interface RouteMatch {
  route: Route;
  params: Record<string, string>;
}

export interface NavigationGuard {
  (to: string, from: string): boolean | Promise<boolean>;
}

export interface RouterOptions {
  routes: Route[];
  beforeEach?: NavigationGuard;
  notFound?: ComponentDefinition;
}

export interface RouterInstance {
  readonly currentPath: string;
  readonly params: Record<string, string>;
  navigate(path: string): Promise<void>;
  render(): ComponentRenderResult;
  onNavigate(listener: (path: string) => void): () => void;
  install(app?: { mount(c: HTMLElement | { innerHTML: string }): void }): void;
}

export interface RouterLinkProps {
  href: string;
  children?: ComponentRenderResult[];
  class?: string;
}

function compilePath(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const regexStr = pattern
    .replace(/\//g, '\\/')
    .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_m, name: string) => { paramNames.push(name); return '([^/]+)'; });
  return { regex: new RegExp(`^${regexStr}$`), paramNames };
}

function matchRoute(routes: Route[], pathname: string): RouteMatch | null {
  for (const route of routes) {
    const { regex, paramNames } = compilePath(route.path);
    const m = pathname.match(regex);
    if (m) {
      const params: Record<string, string> = {};
      paramNames.forEach((name, i) => { params[name] = decodeURIComponent(m[i + 1] ?? ''); });
      return { route, params };
    }
  }
  return null;
}

const DEFAULT_NOT_FOUND: ComponentDefinition = {
  setup() {
    return {
      tag: 'section',
      attrs: { style: 'padding:2rem;text-align:center' },
      children: [{ tag: 'h2', children: ['404'] }, { tag: 'p', children: ['Page not found.'] }],
    };
  },
};

export function createRoute(path: string, component: ComponentDefinition): Route {
  return { path, component };
}

export function createRouter(options: RouterOptions): RouterInstance {
  let currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  let currentParams: Record<string, string> = {};
  const listeners = new Set<(path: string) => void>();
  const notFound = options.notFound ?? DEFAULT_NOT_FOUND;

  function getMatch() { return matchRoute(options.routes, currentPath); }

  async function navigate(path: string): Promise<void> {
    const from = currentPath;
    if (options.beforeEach) {
      const allowed = await options.beforeEach(path, from);
      if (!allowed) return;
    }
    currentPath = path;
    currentParams = getMatch()?.params ?? {};
    if (typeof window !== 'undefined') window.history.pushState({}, '', path);
    for (const listener of listeners) listener(currentPath);
  }

  const initialMatch = getMatch();
  currentParams = initialMatch?.params ?? {};

  return {
    get currentPath() { return currentPath; },
    get params() { return { ...currentParams }; },
    navigate,
    render() {
      const match = getMatch();
      return match ? match.route.component.setup({}) : notFound.setup({});
    },
    onNavigate(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    install(app?) {
      if (typeof window === 'undefined') return;
      if (app) listeners.add(() => app.mount(document.body));
      window.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('a');
        if (!target) return;
        const href = target.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:')) return;
        e.preventDefault();
        void navigate(href);
      });
      window.addEventListener('popstate', () => void navigate(window.location.pathname));
    },
  };
}

export function RouterLink(props: RouterLinkProps): ComponentNode {
  return { tag: 'a', attrs: { href: props.href, class: props.class }, children: props.children ?? [] };
}
