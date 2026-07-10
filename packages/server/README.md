# @yawn/server

Production Node.js HTTP server for Yawn framework apps. Handles static files, custom request handlers and SPA fallback routing.

## Install

```bash
npm install @yawn/server
```

## Usage

```ts
import { startServer } from '@yawn/server';
import { compileToHtml } from '@yawn/compiler';
import { readFileSync } from 'node:fs';

const html = compileToHtml(readFileSync('src/page.yawn', 'utf8'), {
  title: 'My Yawn Site',
});

startServer({
  port: 3000,
  handler(pathname) {
    if (pathname === '/') return html;
    return null; // fall through to static files
  },
});
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `port` | `number` | `3000` | Port to listen on |
| `host` | `string` | `'127.0.0.1'` | Host to bind |
| `rootDir` | `string` | `process.cwd()` | Directory for static file serving |
| `handler` | `(pathname, req) => string \| null` | — | Custom handler; return HTML/text or `null` to fall through |
| `title` | `string` | `'Yawn App'` | Default 404 page title |

## Static file serving

Files in `rootDir` are served automatically. Unknown paths fall back to `index.html` for SPA routing.
