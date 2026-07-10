import { createApp, defineComponent } from '../../../../packages/core/src/index.js';
import { createRouter, createRoute } from '../../../../packages/router/src/index.js';
import { Layout } from './layout.js';
import { Page } from './page.js';

const router = createRouter({
  routes: [createRoute('/', Page)],
});

export function startApp(container: HTMLElement | { innerHTML: string }) {
  const app = createApp(
    defineComponent({
      setup() {
        return () => ({
          tag: 'div',
          attrs: { id: 'app' },
          children: [
            Layout.setup(),
            router.render(),
          ],
        });
      },
    }),
  );

  app.mount(container);
  return app;
}
