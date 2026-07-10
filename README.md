# Yawn Framework ⚡

A TypeScript-first, HTML-based web framework for building fast, simple web sites and apps.

- **`.yawn` templates** — HTML-like file format with component composition and `{{prop}}` interpolation
- **Component model** — plain JavaScript objects, no magic, fully typed
- **Reactivity** — signals, computed values, effects and watchers
- **Router** — client-side routing with dynamic params and navigation guards
- **SSR** — render to HTML string for server-side rendering
- **CLI** — scaffold projects, create components, start dev server

## Packages

| Package | npm | Description |
|---|---|---|
| [`yawn-framework`](packages/core) | core | Component model, renderer, app lifecycle |
| [`@yawn/reactivity`](packages/reactivity) | reactivity | Signals, computed, effect, watch |
| [`@yawn/router`](packages/router) | router | Client-side router |
| [`@yawn/compiler`](packages/compiler) | compiler | `.yawn` template parser & compiler |
| [`@yawn/server`](packages/server) | server | Production HTTP server |
| [`@yawn/dev-server`](packages/dev-server) | dev-server | Dev server with hot reload |
| [`@yawn/runtime`](packages/runtime) | runtime | Browser mount & hydration |
| [`@yawn/shared`](packages/shared) | shared | Shared types & utilities |
| [`@yawn/devtools`](packages/devtools) | devtools | Dev-only debug tools |
| [`@yawn/cli`](packages/cli) | cli | CLI (`yh` command) |

## Quick start

```bash
npx yawn-framework init my-site
cd my-site
npm install
npm run dev
```

## Example

**`src/page.yawn`**
```html
<main>
  <Hero title="Welcome to Yawn" subtitle="Build fast, simple sites." cta="Get started" href="/start" />
</main>
```

**`src/components/Hero.yawn`**
```html
<section class="hero">
  <h1>{{title}}</h1>
  <p>{{subtitle}}</p>
  <a href="{{href}}">{{cta}}</a>
</section>
```

**`src/server.ts`**
```ts
import { startDevServer } from '@yawn/dev-server';
import { loadTemplate } from './load-template.js';

startDevServer({
  port: 3000,
  handler: (path) => path === '/' ? loadTemplate('page.yawn') : null,
});
```

**`src/main.ts`** (browser)
```ts
import { createApp, defineComponent } from 'yawn-framework';
import { signal, effect } from '@yawn/reactivity';

const count = signal(0);

const App = defineComponent({
  setup() {
    return () => ({
      tag: 'div',
      children: [
        { tag: 'p', children: [`Count: ${count.get()}`] },
        { tag: 'button', attrs: { type: 'button' }, children: ['Increment'] },
      ],
    });
  },
});

const app = createApp(App);
app.mount(document.body);

effect(() => {
  const btn = document.querySelector('button');
  btn?.addEventListener('click', () => {
    count.set(count.get() + 1);
    app.mount(document.body);
  });
});
```

## License

MIT
