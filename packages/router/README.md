# @yawn/router

Client-side router for the Yawn framework. Supports dynamic route params, navigation guards, `popstate` and a `RouterLink` component.

## Install

```bash
npm install @yawn/router
```

## Basic usage

```ts
import { createRouter, createRoute } from '@yawn/router';
import { createApp, defineComponent } from 'yawn-framework';

const Home = defineComponent({ setup: () => ({ tag: 'h1', children: ['Home'] }) });
const About = defineComponent({ setup: () => ({ tag: 'h1', children: ['About'] }) });

const router = createRouter({
  routes: [
    createRoute('/', Home),
    createRoute('/about', About),
  ],
});

// install() wires up <a> click interception and browser back/forward
router.install();

const app = createApp(
  defineComponent({
    setup() {
      return () => router.render();
    },
  }),
);

app.mount(document.body);

// re-render on navigation
router.onNavigate(() => app.mount(document.body));
```

## Dynamic params

```ts
const User = defineComponent({
  setup() {
    // params are available on the router instance
    const { id } = router.params;
    return { tag: 'p', children: [`User: ${id}`] };
  },
});

createRoute('/users/:id', User);
```

## Navigation guard

```ts
const router = createRouter({
  routes: [...],
  async beforeEach(to, from) {
    if (to === '/admin' && !isLoggedIn()) {
      await router.navigate('/login');
      return false; // cancel original navigation
    }
    return true;
  },
});
```

## Custom 404

```ts
const NotFound = defineComponent({
  setup: () => ({ tag: 'h2', children: ['404 — Page not found'] }),
});

createRouter({ routes: [...], notFound: NotFound });
```

## RouterLink

```ts
import { RouterLink } from '@yawn/router';

// inside a component setup():
return {
  tag: 'nav',
  children: [
    RouterLink({ href: '/', children: ['Home'] }),
    RouterLink({ href: '/about', children: ['About'], class: 'nav-link' }),
  ],
};
```

## API

| Function | Description |
|---|---|
| `createRouter(options)` | Create a router instance |
| `createRoute(path, component)` | Create a route definition |
| `RouterLink(props)` | Render an `<a>` tag that integrates with the router |
| `router.navigate(path)` | Programmatic navigation (async) |
| `router.render()` | Render the current route's component |
| `router.params` | Current dynamic route params |
| `router.onNavigate(fn)` | Subscribe to navigation events |
| `router.install()` | Wire up browser events (call once) |
