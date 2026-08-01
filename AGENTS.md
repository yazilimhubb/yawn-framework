# Yawn Framework — AI Agent Reference

This document is the complete reference for the Yawn Framework.
It is intended for AI assistants to understand how to write, generate, and reason about Yawn code.

---

## What is Yawn?

Yawn is a TypeScript-first, HTML-based web framework for building fast, simple web sites and apps.
The primary authoring format is `.yawn` — a single-file component (SFC) format similar to Vue SFCs.

Key principles:
- HTML-first: developers write HTML, not JSX or virtual DOM objects
- Zero config: Tailwind CSS is auto-included via CDN, no bundler needed
- Reactive: `{{ binding }}`, `@click`, `:if`, `:each` work out of the box
- SSR + hydration: pages are server-rendered to HTML, then hydrated on the client
- File-based routing: `src/pages/index.yawn` → `/`, `src/pages/about.yawn` → `/about`

---

## .yawn Single File Component Format

A `.yawn` file has three blocks:

```html
<template>
  <!-- HTML markup with directives -->
</template>

<script>
  // Variable declarations only. No imports, no functions needed.
  let count = 0;
  let name = "World";
  let items = ["Apple", "Banana", "Cherry"];
</script>

<style>
  /* Optional scoped CSS */
  .hero { padding: 2rem; }
</style>
```

### Template Directives

| Directive | Description | Example |
|---|---|---|
| `{{ expr }}` | Reactive text binding | `{{ count }}`, `{{ name.toUpperCase() }}` |
| `@click="expr"` | Click handler | `@click="count++"` |
| `@input="expr"` | Input handler | `@input="name = event.target.value"` |
| `@submit="expr"` | Submit handler | `@submit="handleSubmit()"` |
| `:if="expr"` | Conditional render | `:if="count > 0"` |
| `:else` | Else branch (sibling of `:if` element) | `<p :else>No items</p>` |
| `:each="x in xs"` | Loop over array | `:each="item in items"` (supports `$index`) |
| `:bind:attr="expr"` | Dynamic attribute | `:bind:src="imageUrl"` |
| `:class="expr"` | Dynamic class binding | `:class="active ? 'text-green-400' : ''"` |
| `:style="expr"` | Dynamic style binding | `:style="{ color: textColor }"` |
| `:model="varName"` | Two-way input binding | `:model="name"` (shorthand for `@input`) |
| `@submit="expr"` | Submit handler | `@submit="handleSubmit()"` |
| `:if="expr"` | Conditional render | `:if="count > 0"` |
| `:each="x in xs"` | Loop over array | `:each="item in items"` |

### Script Rules

- Only use `let` or `const` declarations
- No imports, no exports, no function definitions (keep it simple)
- Variables declared here become reactive state automatically
- Arrays must be JSON-parseable: `let items = ["a","b","c"]`

### Tailwind CSS

Tailwind CSS CDN is automatically injected. Use Tailwind utility classes directly in the template.

```html
<template>
  <div class="min-h-screen bg-slate-900 text-white flex items-center justify-center">
    <h1 class="text-5xl font-black">Hello!</h1>
  </div>
</template>
```

---

## Complete .yawn Examples

### Counter

```html
<template>
  <div class="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-6">
    <h1 class="text-6xl font-black">{{ count }}</h1>
    <div class="flex gap-4">
      <button @click="count--" class="bg-white/10 hover:bg-white/20 w-14 h-14 rounded-2xl text-2xl font-bold transition">−</button>
      <button @click="count = 0" class="bg-white/10 hover:bg-white/20 px-6 h-14 rounded-2xl font-bold transition">Reset</button>
      <button @click="count++" class="bg-indigo-500 hover:bg-indigo-400 w-14 h-14 rounded-2xl text-2xl font-bold transition">+</button>
    </div>
    <p :if="count > 9" class="text-green-400 font-semibold">You passed 10!</p>
    <p :if="count < 0" class="text-red-400 font-semibold">Going negative!</p>
  </div>
</template>

<script>
  let count = 0;
</script>
```

### Todo List

```html
<template>
  <div class="max-w-md mx-auto mt-16 p-6 bg-white rounded-2xl shadow-xl">
    <h1 class="text-2xl font-black mb-6">Todo List</h1>
    
    <div class="flex gap-2 mb-6">
      <input @input="newTodo = event.target.value"
             class="flex-1 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-400"
             placeholder="Add a task..." />
      <button @click="todos = todos + ',' + newTodo; newTodo = ''"
              class="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl font-bold transition">
        Add
      </button>
    </div>

    <ul class="space-y-2">
      <li :each="todo in todos"
          class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
        ✓ {{ todo }}
      </li>
    </ul>

    <p :if="count > 0" class="mt-4 text-gray-400 text-sm text-center">{{ count }} tasks</p>
  </div>
</template>

<script>
  let todos = "Buy groceries,Walk the dog,Read a book";
  let newTodo = "";
  let count = 3;
</script>
```

### Landing Page Hero

```html
<template>
  <section class="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 text-white flex items-center">
    <div class="max-w-4xl mx-auto px-8 text-center">
      <div class="inline-block bg-indigo-500/20 text-indigo-300 text-xs font-bold px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest">
        New — v1.0
      </div>
      <h1 class="text-6xl font-black tracking-tighter mb-6">
        {{ headline }}
      </h1>
      <p class="text-xl text-white/60 max-w-2xl mx-auto mb-10">{{ subtext }}</p>
      <a href="/start" class="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-8 py-4 rounded-2xl transition inline-block">
        Get started →
      </a>
    </div>
  </section>
</template>

<script>
  let headline = "Build sites fast.";
  let subtext = "The simplest way to build modern websites.";
</script>
```

---

## Server Setup (src/server.ts)

Every Yawn project has a `src/server.ts` that wires up the dev server with automatic page routing and layout support:

```ts
import { startDevServer } from 'yawn-framework/dev-server';
import { compileSFC } from 'yawn-framework/compiler';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesDir   = join(__dirname, 'pages');
const layoutFile = join(__dirname, '_layout.yawn');
const compsDir   = join(__dirname, 'components');

function resolveComponent(name: string): string | null {
  const p = join(compsDir, name + '.yawn');
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

function renderPage(pagePath: string, title = 'Yawn App'): string {
  const pageSource = readFileSync(pagePath, 'utf8');
  const pageName   = basename(pagePath, '.yawn');

  if (existsSync(layoutFile)) {
    // Render page as fragment, inject into layout
    const { html: fragment } = compileSFC(pageSource, pageName, { fullPage: false, tailwind: false });
    const layoutSource = readFileSync(layoutFile, 'utf8');
    const { html } = compileSFC(layoutSource, '_layout', { tailwind: true, title });
    return html.replace(/\{\{\s*slot\s*\}\}/g, fragment);
  }
  const { html } = compileSFC(pageSource, pageName, { tailwind: true, title });
  return html;
}

function buildRoutes() {
  const routes: Record<string, { file: string; title: string }> = {};
  if (!existsSync(pagesDir)) return routes;
  for (const e of readdirSync(pagesDir, { withFileTypes: true })) {
    if (!e.isFile() || extname(e.name) !== '.yawn' || e.name.startsWith('_')) continue;
    const name = basename(e.name, '.yawn');
    routes[name === 'index' ? '/' : '/' + name] = {
      file: join(pagesDir, e.name),
      title: name.charAt(0).toUpperCase() + name.slice(1) + ' — Yawn App',
    };
  }
  return routes;
}

startDevServer({
  port: 3000,
  rootDir: join(__dirname, '..', 'public'),
  handler(pathname) {
    const routes = buildRoutes();
    const route = routes[pathname];
    if (!route) return null;
    return renderPage(route.file, route.title);
  },
});
```

---

## compileSFC API

The main compiler function for `.yawn` SFC files:

```ts
import { compileSFC } from '@yawn-framework/compiler';

const { html } = compileSFC(source, name, options);
```

| Parameter | Type | Description |
|---|---|---|
| `source` | `string` | Raw `.yawn` file content |
| `name` | `string` | Component name (used as scope ID) |
| `options.tailwind` | `boolean` | Include Tailwind CDN (default: `true`) |
| `options.title` | `string` | Page `<title>` (default: `'Yawn App'`) |
| `options.fullPage` | `boolean` | Output full HTML document (default: `true`) |

---

## TypeScript Component API (advanced)

For programmatic component creation without `.yawn` files:

```ts
import { createApp, defineComponent, h, el } from 'yawn-framework';
import { signal, computed, effect, watch } from '@yawn-framework/reactivity';
import { createRouter, createRoute, RouterLink } from '@yawn-framework/router';

// Signals
const count = signal(0);
const doubled = computed(() => count.get() * 2);

effect(() => {
  console.log('count changed:', count.get());
});

watch(count, (newVal, oldVal) => {
  console.log(`${oldVal} → ${newVal}`);
});

// Components
const Button = defineComponent({
  setup(props: { label: string; id?: string }) {
    return el('button', { id: props.id, type: 'button', class: 'btn' }, props.label);
  },
});

const App = defineComponent({
  setup() {
    return el('div', { id: 'app' },
      el('p', {}, `Count: ${count.get()}`),
      h(Button, { label: '+', id: 'inc' }),
    );
  },
});

// App
const app = createApp(App);
app.mount(document.body);

// Reactive re-render
effect(() => { count.get(); app.update(); });

document.addEventListener('click', e => {
  if ((e.target as HTMLElement).id === 'inc') count.set(count.get() + 1);
});

// Router
const router = createRouter({
  routes: [
    createRoute('/', HomePage),
    createRoute('/about', AboutPage),
    createRoute('/users/:id', UserPage),
  ],
  beforeEach(to, from) {
    if (to === '/admin' && !isLoggedIn) return false;
    return true;
  },
});

router.install(app); // auto re-mounts on navigation
```

---

## Package List

```
yawn-framework              — core (required)
@yawn-framework/compiler    — .yawn template + SFC compiler
@yawn-framework/reactivity  — signal, computed, effect, watch
@yawn-framework/router      — client-side router
@yawn-framework/server      — production HTTP server
@yawn-framework/dev-server  — dev server with hot reload
@yawn-framework/runtime     — browser mount & hydration
@yawn-framework/shared      — shared types & utils
@yawn-framework/devtools    — dev-only debug tools
@yawn-framework/cli         — CLI (yh command)
```

---

## Project Structure

```
my-site/
├── src/
│   ├── _layout.yawn         # Shared layout (nav + footer wraps all pages)
│   ├── pages/
│   │   ├── index.yawn       # Route: /
│   │   ├── about.yawn       # Route: /about
│   │   └── contact.yawn     # Route: /contact
│   ├── components/
│   │   ├── Card.yawn
│   │   └── Hero.yawn
│   └── server.ts
├── public/                  # Static assets
├── tsconfig.json
└── package.json
```

---

## Layout System

Every project scaffolded by `yh init` or `npx create-yawn` includes a `src/_layout.yawn` file.
The layout wraps all pages automatically. Use `{{ slot }}` where page content should be injected.

```html
<!-- src/_layout.yawn -->
<template>
  <div class="min-h-screen flex flex-col">
    <header>...</header>
    <main class="flex-1">{{ slot }}</main>
    <footer>...</footer>
  </div>
</template>

<script>
  let slot = "";
  let siteName = "My Site";
</script>
```

In `src/server.ts`, the layout is automatically applied:

```ts
if (existsSync(layoutFile)) {
  const { html: fragment } = compileSFC(pageSource, pageName, { fullPage: false, tailwind: false });
  const { html } = compileSFC(layoutSource, '_layout', { tailwind: true, title });
  return html.replace(/\{\{\s*slot\s*\}\}/g, fragment);
}
```

---

## Page Meta Block

Pages can declare their own `<title>` and `<meta>` tags using an optional `<meta>` block:

```html
<meta>
title: Contact — My Site
description: Get in touch with us
og:title: Contact Page
og:description: Reach out to our team
</meta>

<template>
  <div>...</div>
</template>
```

The `compileSFC` function reads this block and injects the appropriate `<meta>` tags in `<head>`.

---

## CLI Reference

```bash
# Project setup
yh init [dir]                        # Scaffold new project (with layout, pages, server)
yh dev [dir]                         # Start dev server with hot reload + error overlay
yh build [dir]                       # Build to static HTML + run tsc

# Code generation
yh create page <Name> [dir]          # Create .yawn page (auto-adds route)
yh create component <Name> [dir]     # Create .yawn component
yh insert <file> <Name> [key=val]    # Insert component tag into .yawn file
yh help                              # Show help

# npx (no install required)
npx create-yawn@latest [dir]         # Interactive project scaffolder
npx create-yawn@latest my-site       # Scaffold directly to my-site/
```

---

## Rules for AI Code Generation

When generating Yawn code, follow these rules:

1. **Always use `.yawn` SFC format** for pages and components — `<template>`, `<script>`, `<style>`
2. **Use Tailwind classes** — Tailwind CDN is auto-included, no CSS file needed unless custom styles are required
3. **Keep `<script>` minimal** — only `let`/`const` declarations, no imports, no functions
4. **Use `@event` for all event bindings** — `@click`, `@input`, `@change`, `@submit`
5. **Use `:if` / `:else` for conditionals** — `:if="expr"` and `:else` on sibling elements
6. **Use `:each` for loops** — `:each="item in items"` supports `$index` and `:each="item, i in items"`
7. **Use `:model` for two-way input binding** — `:model="name"` instead of `@input="name = event.target.value"`
8. **Use `:bind:attr` for dynamic attributes** — `:bind:src="imageUrl"`, `:bind:disabled="loading"`
9. **Use `:class` / `:style` for dynamic styles** — `:class="active ? 'bg-indigo-500' : ''"` or `:class="{ active: isActive }"`
10. **File-based routing** — one `.yawn` file per route in `src/pages/` (files starting with `_` are skipped)
11. **Layout in `src/_layout.yawn`** — use `{{ slot }}` for page content injection
12. **Page meta in `<meta>` block** — `title:`, `description:`, `og:title:` etc.
13. **Components go in `src/components/`** — referenced by PascalCase tag in templates
14. **Server in `src/server.ts`** — always uses `startDevServer` + `compileSFC`
