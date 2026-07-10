import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

export interface ServerOptions {
  port?: number;
  host?: string;
  rootDir?: string;
  handler?: (pathname: string, req: IncomingMessage) => string | null | undefined;
  title?: string;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

export function startServer(options: ServerOptions = {}) {
  const port = options.port ?? 3000;
  const host = options.host ?? '127.0.0.1';
  const rootDir = options.rootDir ?? process.cwd();
  const title = options.title ?? 'Yawn App';

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const pathname = new URL(req.url ?? '/', `http://${host}:${port}`).pathname;

    if (options.handler) {
      const result = options.handler(pathname, req);
      if (result != null) {
        res.writeHead(200, { 'Content-Type': result.trimStart().startsWith('<') ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8' });
        res.end(result);
        return;
      }
    }

    const filePath = pathname === '/' ? join(rootDir, 'index.html') : join(rootDir, pathname);
    if (existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
      res.end(readFileSync(filePath));
      return;
    }

    const indexPath = join(rootDir, 'index.html');
    if (existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(readFileSync(indexPath));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html><html><body><h1>404</h1><p>${title}</p></body></html>`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') { console.error(`[yawn/server] Port ${port} is already in use.`); return; }
    throw err;
  });

  server.listen(port, host, () => console.log(`[yawn/server] Running at http://${host}:${port}`));
  return server;
}
