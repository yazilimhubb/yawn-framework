# yawn-framework

The core of the Yawn framework — component model, HTML renderer, app lifecycle and module system.

## Install

```bash
npm install yawn-framework
```

## Quick start

```ts
import { createApp, defineComponent } from 'yawn-framework';

const App = defineComponent({
  setup() {
    return {
      tag: 'main',
      children: [
        { tag: 'h1', children: ['Hello from Yawn ⚡'] },
        { tag: 'p', children: ['Your first Yawn app.'] },
      ],
    };
  },
});

createApp(App).mount(document.body);
```

## Reactive rendering

Wire up signals from `@yawn-framework/reactivity` for automatic re-renders:

```ts
import { createApp, defineComponent } from 'yawn-framework';
import { signal, effect } from '@yawn-framework/reactivity';

const count = signal(0);

const Counter = defineComponent({
  setup() {
    return {
      tag: 'div',
      children: [
        { tag: 'p', children: [`Count: ${count.get()}`] },
        { tag: 'button', attrs: { id: 'inc', type: 'button' }, children: ['+'] },
      ],
    };
  },
});

const app = createApp(Counter);
app.mount(document.body);

// re-render on signal change
effect(() => { count.get(); app.update(); });

document.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).id === 'inc') count.set(count.get() + 1);
});
```

Or use `createReactiveApp` for automatic wiring:

```ts
import { createReactiveApp } from 'yawn-framework';
import { effect } from '@yawn-framework/reactivity';

const app = createReactiveApp(Counter, effect);
app.mount(document.body);
app.stop(); // stop the reactive loop
```

## API

### `defineComponent(definition)`

Define a typed component. The `setup` function receives props and returns a node tree.

```ts
const Button = defineComponent({
  setup(props: { label: string; disabled?: boolean }) {
    return {
      tag: 'button',
      attrs: { type: 'button', disabled: props.disabled ?? false },
      children: [props.label],
    };
  },
});
```

### `h(component, props, ...children)`

Instantiate a component — equivalent to JSX.

```ts
import { h } from 'yawn-framework';
h(Button, { label: 'Click me' })
```

### `el(tag, attrs, ...children)`

Create a plain HTML element node — shorthand for object literals.

```ts
import { el } from 'yawn-framework';
el('div', { class: 'card' }, el('p', {}, 'Hello'))
```

### `createApp(root, options?)`

Create an app instance.

| Method | Description |
|---|---|
| `.mount(container)` | Render into a DOM element or `{ innerHTML }` |
| `.update()` | Re-render into the already-mounted container |
| `.unmount()` | Clear the container and clean up |

### `renderToHtml(root)`

Render a component to an HTML string (SSR).

```ts
import { renderToHtml } from 'yawn-framework';
const html = renderToHtml(MyPage);
```

### Modules

```ts
import { defineModule, createApp } from 'yawn-framework';

const LogModule = defineModule({
  name: 'logger',
  onMount() { console.log('mounted'); },
  onUnmount() { console.log('unmounted'); },
  onBeforeRender(html) { return html; }, // transform HTML before it's set
});

createApp(Root, { modules: [LogModule] }).mount(document.body);
```

### `.yawn` templates

```ts
import { compileYawnTemplate } from 'yawn-framework';
const tree = compileYawnTemplate('<h1>Hello {{name}}</h1>');
```

Use `@yawn-framework/compiler` for the full template pipeline with component resolution.
