# @yawn/runtime

Browser runtime for Yawn framework — mounts and hydrates components in the DOM.

## Install

```bash
npm install @yawn/runtime
```

## Usage

```ts
import { mount } from '@yawn/runtime';
import App from './App.js';

mount(App);
// mounts into [data-yawn-root] or document.body by default
```

Custom target:

```ts
mount(App, { target: '#app' });
mount(App, { target: document.getElementById('app')! });
```

## Hydration

For server-rendered pages, use `hydrate()` instead of `mount()`. Currently performs a client-side re-render; incremental hydration (DOM diffing) is planned.

```ts
import { hydrate } from '@yawn/runtime';
hydrate(App);
```

Mark the SSR root in your HTML with `data-yawn-root`:

```html
<div data-yawn-root><!-- server rendered content --></div>
```

## API

| Function | Description |
|---|---|
| `mount(component, options?)` | Mount a component into the DOM |
| `hydrate(component, options?)` | Hydrate a server-rendered root |
