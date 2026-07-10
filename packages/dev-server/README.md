# @yawn/dev-server

Development server with hot reload (SSE-based live reload) for Yawn framework projects.

## Install

```bash
npm install @yawn/dev-server
```

## Usage

```ts
import { startDevServer } from '@yawn/dev-server';
import { compileToFragment } from '@yawn/compiler';
import { readFileSync } from 'node:fs';

startDevServer({
  port: 3000,
  rootDir: 'src',
  handler(pathname) {
    if (pathname === '/') {
      return compileToFragment(readFileSync('src/page.yawn', 'utf8'));
    }
    return null;
  },
});
```

The dev server automatically:
- Watches `rootDir` for file changes (`.ts`, `.js`, `.yawn`, `.css`, `.html`)
- Injects a live-reload script into every HTML response
- Sends a `reload` SSE event to all connected browsers on file change

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `port` | `number` | `3000` | Port to listen on |
| `host` | `string` | `'127.0.0.1'` | Host to bind |
| `rootDir` | `string` | `process.cwd()` | Directory to watch and serve |
| `handler` | `(pathname) => string \| null` | — | Custom handler; return HTML or `null` to fall through |
| `watchExtensions` | `string[]` | `['.ts','.js','.yawn','.css','.html']` | Extensions that trigger a reload |

## Programmatic reload

```ts
const dev = startDevServer({ port: 3000 });
dev.reload(); // trigger all connected clients to reload
dev.close();  // shut down the server
```
