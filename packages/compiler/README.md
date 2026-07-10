# @yawn/compiler

The `.yawn` template compiler. Parses HTML-like templates, resolves component references, interpolates props and serializes to HTML.

## Install

```bash
npm install @yawn/compiler
```

## The `.yawn` format

`.yawn` files are HTML-like templates with:

- Standard HTML tags and attributes
- `{{propName}}` placeholder interpolation
- PascalCase component references: `<Hero title="..." />`
- `con:` namespace shorthand: `<con:Hero title="..." />`
- Boolean attributes: `<input disabled />`
- Self-closing tags: `<img src="..." />`

```html
<!-- src/page.yawn -->
<main>
  <Hero title="Welcome to Yawn" subtitle="Fast HTML-based sites." cta="Get started" href="/start" />
  <section class="features">
    <p>Build fast. Ship faster.</p>
  </section>
</main>
```

```html
<!-- src/components/Hero.yawn -->
<section class="hero">
  <h1>{{title}}</h1>
  <p>{{subtitle}}</p>
  <a href="{{href}}" class="cta">{{cta}}</a>
</section>
```

## API

### `compile(source, options?)`

Parses and transforms a `.yawn` string into a `TNode` tree.

```ts
import { compile } from '@yawn/compiler';

const tree = compile('<h1>Hello {{name}}</h1>', {
  props: { name: 'World' },
});
// { tag: 'h1', children: ['Hello World'] }
```

### `compileToFragment(source, options?)`

Compiles directly to an HTML string fragment.

```ts
import { compileToFragment } from '@yawn/compiler';

const html = compileToFragment('<p>Hello {{name}}</p>', {
  props: { name: 'Yawn' },
});
// '<p>Hello Yawn</p>'
```

### `compileToHtml(source, options?)`

Wraps the compiled output in a full HTML document.

```ts
import { compileToHtml } from '@yawn/compiler';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const html = compileToHtml(source, {
  title: 'My Yawn Site',
  resolveComponent(name) {
    const p = join('src/components', `${name}.yawn`);
    return existsSync(p) ? readFileSync(p, 'utf8') : null;
  },
});
```

### Options

| Option | Type | Description |
|---|---|---|
| `props` | `Record<string, string>` | Props injected into `{{placeholder}}` slots |
| `resolveComponent` | `(name: string) => string \| null` | Resolve a component name to its `.yawn` source |
| `title` | `string` | Page title (used by `compileToHtml` only) |

### Low-level API

```ts
import { parse, transform } from '@yawn/compiler';

const ast = parse('<h1>Hello</h1>');   // ElementNode[]
const tree = transform(ast, options);   // TNode
```
