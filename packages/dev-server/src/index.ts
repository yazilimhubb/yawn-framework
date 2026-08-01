import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { watch, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';

export interface DevServerOptions {
  port?: number;
  host?: string;
  rootDir?: string;
  /** Manual route handler. Return HTML string or null to fall through. */
  handler?: (pathname: string) => string | null | undefined;
  watchExtensions?: string[];
  /** If true, auto-discover src/pages/*.yawn routes (requires compiler) */
  autoRoutes?: boolean;
  /** Directory containing .yawn pages for auto-routing */
  pagesDir?: string;
  /** Callback to resolve a page file path to HTML */
  renderPage?: (filePath: string, pageName: string) => string;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
};

const HMR_SCRIPT = `<script>(function(){
  var es = new EventSource('/__yawn_hmr');
  es.addEventListener('reload', function() { window.location.reload(); });
  es.onerror = function() { setTimeout(function(){ window.location.reload(); }, 1500); };
})();</script>`;

const ERROR_OVERLAY_STYLE = `<style>
#__yawn_error{position:fixed;inset:0;z-index:99999;background:rgba(10,10,20,.95);color:#fff;
  font-family:monospace;padding:2rem;overflow:auto;display:flex;flex-direction:column;gap:1rem;}
#__yawn_error h2{color:#f87171;font-size:1.2rem;margin:0;}
#__yawn_error pre{background:#1e1e2e;padding:1rem;border-radius:.5rem;font-size:.85rem;
  white-space:pre-wrap;word-break:break-word;color:#cdd6f4;}
#__yawn_error button{align-self:flex-start;background:#374151;color:#fff;border:none;
  padding:.4rem .9rem;border-radius:.4rem;cursor:pointer;font-size:.85rem;}
</style>`;

function wrapWithHmr(html: string): string {
  return html.includes('</body>')
    ? html.replace('</body>', `${HMR_SCRIPT}\n</body>`)
    : html + HMR_SCRIPT;
}

function errorPage(err: unknown, path: string): string {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? (err.stack ?? '') : '';
  return `<!doctype html><html><head><meta charset="utf-8">
<title>Error — ${path}</title>${ERROR_OVERLAY_STYLE}</head><body>
<div id="__yawn_error">
  <h2>⚠ Yawn Render Error — ${path}</h2>
  <pre>${msg}\n\n${stack}</pre>
  <button onclick="window.location.reload()">Retry</button>
</div>
${HMR_SCRIPT}</body></html>`;
}

/** Scan pagesDir for .yawn files and build pathname → filePath map */
function discoverRoutes(pagesDir: string): Record<string, string> {
  const routes: Record<string, string> = {};
  if (!existsSync(pagesDir)) return routes;

  function scan(dir: string, prefix = '') {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(full, prefix + '/' + entry.name);
      } else if (extname(entry.name) === '.yawn') {
        const base = basename(entry.name, '.yawn');
        const route = base === 'index' ? (prefix || '/') : prefix + '/' + base;
        routes[route] = full;
      }
    }
  }
  scan(pagesDir);
  return routes;
}

export function startDevServer(options: DevServerOptions = {}) {
  const port = options.port ?? 3000;
  const host = options.host ?? '127.0.0.1';
  const rootDir = options.rootDir ?? process.cwd();
  const watchExts = new Set(options.watchExtensions ?? ['.ts', '.js', '.yawn', '.css', '.html']);
  const clients = new Set<ServerResponse>();

  function broadcast(event: string, data = '') {
    const msg = `event: ${event}\ndata: ${data}\n\n`;
    for (const res of clients) {
      try { res.write(msg); } catch { clients.delete(res); }
    }
  }

  // Watch project root (one level up from rootDir which may be /public)
  const watchDir = dirname(rootDir).endsWith('public') ? dirname(rootDir) : rootDir;
  if (existsSync(watchDir)) {
    watch(watchDir, { recursive: true }, (_e, filename) => {
      if (filename && watchExts.has(extname(filename))) broadcast('reload');
    });
  }

  // Also watch one level up if rootDir is inside src/
  const projectRoot = rootDir.replace(/[/\\]src[/\\]?$/, '').replace(/[/\\]public[/\\]?$/, '');
  if (projectRoot !== rootDir && existsSync(projectRoot)) {
    try {
      watch(projectRoot, { recursive: true }, (_e, filename) => {
        if (filename && watchExts.has(extname(filename))) broadcast('reload');
      });
    } catch { /* ignore */ }
  }

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const pathname = new URL(req.url ?? '/', `http://${host}:${port}`).pathname;

    // ── HMR SSE endpoint ──────────────────────────────────────────────────
    if (pathname === '/__yawn_hmr') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(':\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }

    // ── Custom handler ────────────────────────────────────────────────────
    if (options.handler) {
      try {
        const result = options.handler(pathname);
        if (result != null) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(wrapWithHmr(result));
          return;
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(errorPage(err, pathname));
        return;
      }
    }

    // ── Auto-routes (pagesDir scan) ───────────────────────────────────────
    if (options.autoRoutes && options.pagesDir && options.renderPage) {
      const routes = discoverRoutes(options.pagesDir);
      const pagePath = routes[pathname];
      if (pagePath) {
        try {
          const pageName = basename(pagePath, '.yawn');
          const html = options.renderPage(pagePath, pageName);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(wrapWithHmr(html));
          return;
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(errorPage(err, pathname));
          return;
        }
      }
    }

    // ── Static files ──────────────────────────────────────────────────────
    const filePath = pathname === '/' ? join(rootDir, 'index.html') : join(rootDir, pathname);
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const ext = extname(filePath);
      let content: Buffer | string = readFileSync(filePath);
      if (ext === '.html') content = (content as Buffer).toString().replace('</body>', `${HMR_SCRIPT}\n</body>`);
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
      res.end(content);
      return;
    }

    // ── 404 ───────────────────────────────────────────────────────────────
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html><html><body style="font-family:system-ui;padding:2rem;text-align:center">
<h1 style="font-size:4rem;margin:0">404</h1>
<p style="color:#666">${pathname} not found</p>
<a href="/">← Home</a>
${HMR_SCRIPT}</body></html>`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n  ❌  Port ${port} is already in use. Try a different port.\n`);
      return;
    }
    throw err;
  });

  server.listen(port, host, () => {
    console.log(`\n  ⚡ Yawn dev server  →  http://${host}:${port}\n`);
  });

  return {
    server,
    reload() { broadcast('reload'); },
    close() { server.close(); },
    discoverRoutes: (pagesDir: string) => discoverRoutes(pagesDir),
  };
}
