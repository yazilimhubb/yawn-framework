# yawn-framework

The core of the Yawn framework — component model, HTML renderer, app lifecycle and module system.

## Install

```bash
npm install yawn-framework
```

## Quick start

```ts
import { createApp, defineComponent } from 'yawn-framework';

const app = createApp(
  defineComponent({
    setup() {
      return {
        tag: 'main',
        children: [
          { tag: 'h1', children: ['Hello from Yawn'] },
        ],
      };
    },
  }),
);

app.mount(document.body);
```

## API

### `defineComponent(definition)`

Wraps a component definition. Provides type safety with no runtime overhead.

```ts
const MyButton = defineComponent({
  setup() {
    return { tag: 'button', attrs: { type: 'button' }, children: ['Click me'] };
  },
});
```

### `createApp(root, options?)`

Creates an app instance. Call `.mount(container)` to render into a DOM element or `{ innerHTML: string }` (for SSR).

```ts
const app = createApp(Root, { modules: [myModule] });
app.mount(document.getElementById('app')!);
```

### `renderToHtml(root)`

Renders a component to an HTML string.

```ts
import { renderToHtml } from 'yawn-framework';
const html = renderToHtml(MyComponent);
```

### `renderWithModules(root, modules)`

SSR helper — renders to string and runs `onBeforeRender` module hooks.

### Modules

```ts
import { defineModule } from 'yawn-framework';

const LoggerModule = defineModule({
  name: 'logger',
  onMount() {
    console.log('App mounted');
  },
});
```

### `.yawn` templates

Use `compileYawnTemplate` (or the full `@yawn/compiler` package) to parse `.yawn` template files:

```ts
import { compileYawnTemplate } from 'yawn-framework';
const tree = compileYawnTemplate('<h1>Hello {{name}}</h1>');
```
