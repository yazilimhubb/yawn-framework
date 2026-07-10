import { createApp, defineComponent, renderWithModules } from '../../../../packages/core/src/index.js';
import { createRouter, createRoute } from '../../../../packages/router/src/index.js';
import { Layout } from '../components/Layout.js';
import { HomePage } from '../pages/home.js';
import { AboutPage } from '../pages/about.js';
import { ContactPage } from '../pages/contact.js';

export const router = createRouter({
  routes: [
    createRoute('/', HomePage),
    createRoute('/about', AboutPage),
    createRoute('/contact', ContactPage),
  ],
});

const Root = defineComponent({
  setup() {
    return Layout.setup({ slot: router.render() });
  },
});

export function createSiteApp() {
  const app = createApp(Root);
  return app;
}

/** SSR: render the current route to a full HTML string */
export function renderPage(path = '/'): string {
  // update router path for SSR
  (router as unknown as { currentPath: string }).currentPath = path;
  return renderWithModules(Root);
}
