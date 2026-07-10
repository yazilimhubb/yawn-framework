import type { ComponentDefinition, ComponentNode, ComponentRenderResult } from '../../core/src/index.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Route {
  /** Path pattern. Supports dynamic segments: /users/:id */
  path: string;
  component: ComponentDefinition;
}

export interface RouteMatch {
  route: Route;
  /** Extracted dynamic params, e.g. { id: '42' } */
  params: Record<string, string>;
}

export interface NavigationGuard {
  (to: string, from: string): boolean | Promise<boolean>;
}

export interface RouterOptions {
  routes: Route[];
  /** Called before each navigation. Return false to cancel. */
  beforeEach?: NavigationGuard;
  /** Component rendered when no route matches. Defaults to a simple 404. */
  notFound?: ComponentDefinition;
}

export interface RouterInstance {
  readonly currentPath: string;
  readonly params: Record<string, string>;
  navigate(path: string): Promise<void>;
  render(): ComponentRenderResult;
  /** Subscribe to route changes. Returns an unsubscribe fn. */
  onNavigate(listener: (path: string) => void): () => void;
  /** Call this once in a browser to wire up <a> clicks and popstate. */
  install(): void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts a route pattern like /users/:id/posts/:slug
 * into a RegExp and an ordered list of param names.
 */
function compilePath(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const regexStr = pattern
    .replace(/\//g, '\\/')
    .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, name: string) => {
      paramNames.push(name);
      return '([^/]+)';
    });
  return { regex: new RegExp(`^${regexStr}$`), paramNames };
}

function matchRoute(routes: Route[], pathname: string): RouteMatch | null {
  for (const route of routes) {
    const { regex, paramNames } = compilePath(route.path);
    const m = pathname.match(regex);
    if (m) {
      const params: Record<string, string> = {};
      paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(m[i + 1] ?? '');
      });
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
      children: [
        { tag: 'h2', children: ['404'] },
        { tag: 'p', children: ['Page not found.'] },
      ],
    };
  },
};

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createRoute(path: string, component: ComponentDefinition): Route {
  return { path, component };
}

export function createRouter(options: RouterOptions): RouterInstance {
  let currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  let currentParams: Record<string, string> = {};
  const listeners = new Set<(path: string) => void>();
  const notFound = options.notFound ?? DEFAULT_NOT_FOUND;

  function getMatch(): RouteMatch | null {
    return matchRoute(options.routes, currentPath);
  }

  async function navigate(path: string): Promise<void> {
    const from = currentPath;

    if (options.beforeEach) {
      const allowed = await options.beforeEach(path, from);
      if (!allowed) return;
    }

    currentPath = path;
    const match = getMatch();
    currentParams = match?.params ?? {};

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }

    for (const listener of listeners) {
      listener(currentPath);
    }
  }

  function render(): ComponentRenderResult {
    const match = getMatch();
    if (!match) return notFound.setup();
    return match.route.component.setup();
  }

  function install(): void {
    if (typeof window === 'undefined') return;

    // intercept same-origin <a> clicks
    window.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('//')) return;
      e.preventDefault();
      navigate(href);
    });

    // handle browser back/forward
    window.addEventListener('popstate', () => {
      void navigate(window.location.pathname);
    });
  }

  // initialise params for the starting path
  const initialMatch = getMatch();
  currentParams = initialMatch?.params ?? {};

  return {
    get currentPath() {
      return currentPath;
    },
    get params() {
      return { ...currentParams };
    },
    navigate,
    render,
    onNavigate(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    install,
  };
}

// ─── RouterLink component ─────────────────────────────────────────────────────

export interface RouterLinkProps {
  href: string;
  children?: ComponentRenderResult[];
  /** Extra CSS classes */
  class?: string;
}

/**
 * Renders an <a> tag that integrates with the router.
 * The router's `install()` method intercepts the click.
 */
export function RouterLink(props: RouterLinkProps): ComponentNode {
  return {
    tag: 'a',
    attrs: {
      href: props.href,
      class: props.class,
    },
    children: props.children ?? [],
  };
}
