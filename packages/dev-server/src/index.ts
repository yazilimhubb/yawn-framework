import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { watch, existsSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

export interface DevServerOptions {
  port?: number;
  host?: string;
  rootDir?: string;
  handler?: (pathname: string) => string | null | undefined;
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

const HMR_SCRIPT = `<script>(function(){const es=new EventSource('/__yawn_hmr');es.addEventListener('reload',()=>window.location.reload());es.onerror=()=>setTimeout(()=>window.location.reload(),1000);})();</script>`;

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

  if (existsSync(rootDir)) {
    watch(rootDir, { recursive: true }, (_e, filename) => {
      if (filename && watchExts.has(extname(filename))) broadcast('reload');
    });
  }

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const pathname = new URL(req.url ?? '/', `http://${host}:${port}`).pathname;

    if (pathname === '/__yawn_hmr') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' });
      res.write(':\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }

    if (options.handler) {
      const result = options.handler(pathname);
      if (result != null) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(result.replace('</body>', `${HMR_SCRIPT}\n</body>`));
        return;
      }
    }

    const filePath = pathname === '/' ? join(rootDir, 'index.html') : join(rootDir, pathname);
    if (existsSync(filePath)) {
      const ext = extname(filePath);
      let content: Buffer | string = readFileSync(filePath);
      if (ext === '.html') content = content.toString().replace('</body>', `${HMR_SCRIPT}\n</body>`);
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
      res.end(content);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') { console.error(`[yawn/dev-server] Port ${port} is already in use.`); return; }
    throw err;
  });

  server.listen(port, host, () => console.log(`\n  🟢 Yawn dev server  →  http://${host}:${port}\n`));

  return {
    server,
    reload() { broadcast('reload'); },
    close() { server.close(); },
  };
}
