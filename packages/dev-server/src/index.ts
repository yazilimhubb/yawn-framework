import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { watch, existsSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

export interface DevServerOptions {
  port?: number;
  host?: string;
  /** Root directory to watch and serve static files from. */
  rootDir?: string;
  /**
   * Called on every request. Return an HTML string to serve it,
   * or null/undefined to fall through to static file serving.
   */
  handler?: (pathname: string) => string | null | undefined;
  /** File extensions to watch for hot reload. Default: ['.ts','.js','.yawn','.css'] */
  watchExtensions?: string[];
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

/** Injected into every HTML response to enable live-reload via SSE. */
const HMR_SCRIPT = `
<script>
(function () {
  const es = new EventSource('/__yawn_hmr');
  es.addEventListener('reload', () => window.location.reload());
  es.onerror = () => setTimeout(() => window.location.reload(), 1000);
})();
</script>`;

export function startDevServer(options: DevServerOptions = {}) {
  const port = options.port ?? 3000;
  const host = options.host ?? '127.0.0.1';
  const rootDir = options.rootDir ?? process.cwd();
  const watchExts = new Set(options.watchExtensions ?? ['.ts', '.js', '.yawn', '.css', '.html']);

  // ── SSE clients ───────────────────────────────────────────────────────────
  const clients = new Set<ServerResponse>();

  function broadcast(event: string, data = '') {
    const msg = `event: ${event}\ndata: ${data}\n\n`;
    for (const res of clients) {
      try {
        res.write(msg);
      } catch {
        clients.delete(res);
      }
    }
  }

  // ── File watcher ─────────────────────────────────────────────────────────
  if (existsSync(rootDir)) {
    watch(rootDir, { recursive: true }, (_event, filename) => {
      if (!filename) return;
      const ext = extname(filename);
      if (watchExts.has(ext)) {
        broadcast('reload');
      }
    });
  }

  // ── HTTP server ──────────────────────────────────────────────────────────
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const pathname = new URL(req.url ?? '/', `http://${host}:${port}`).pathname;

    // SSE endpoint
    if (pathname === '/__yawn_hmr') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(':\n\n'); // keep-alive comment
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }

    // custom handler
    if (options.handler) {
      const result = options.handler(pathname);
      if (result != null) {
        const withHmr = result.replace('</body>', `${HMR_SCRIPT}\n</body>`);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(withHmr);
        return;
      }
    }

    // static file serving
    const filePath = pathname === '/' ? join(rootDir, 'index.html') : join(rootDir, pathname);
    if (existsSync(filePath)) {
      const ext = extname(filePath);
      const mime = MIME[ext] ?? 'application/octet-stream';
      let content: Buffer | string = readFileSync(filePath);
      if (ext === '.html') {
        content = content.toString().replace('</body>', `${HMR_SCRIPT}\n</body>`);
      }
      res.writeHead(200, { 'Content-Type': mime });
      res.end(content);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[yawn/dev-server] Port ${port} is already in use.`);
      return;
    }
    throw err;
  });

  server.listen(port, host, () => {
    console.log(`\n  🟢 Yawn dev server  →  http://${host}:${port}\n`);
  });

  return {
    server,
    /** Trigger a reload on all connected clients manually. */
    reload() {
      broadcast('reload');
    },
    close() {
      server.close();
    },
  };
}
