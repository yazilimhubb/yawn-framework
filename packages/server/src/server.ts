import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

export interface ServerOptions {
  port?: number;
  host?: string;
  /** Directory to serve static files from. */
  rootDir?: string;
  /**
   * Custom request handler called before static file lookup.
   * Return an HTML/text string to respond, or null to fall through.
   */
  handler?: (pathname: string, req: IncomingMessage) => string | null | undefined;
  /** Page title used in the default fallback HTML. */
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

function wrap(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
    ${body}
  </body>
</html>`;
}

export function startServer(options: ServerOptions = {}) {
  const port = options.port ?? 3000;
  const host = options.host ?? '127.0.0.1';
  const rootDir = options.rootDir ?? process.cwd();
  const title = options.title ?? 'Yawn App';

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const pathname = new URL(req.url ?? '/', `http://${host}:${port}`).pathname;

    // 1. custom handler
    if (options.handler) {
      const result = options.handler(pathname, req);
      if (result != null) {
        const contentType = result.trimStart().startsWith('<')
          ? 'text/html; charset=utf-8'
          : 'text/plain; charset=utf-8';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(result);
        return;
      }
    }

    // 2. static files
    const filePath = pathname === '/' ? join(rootDir, 'index.html') : join(rootDir, pathname);
    if (existsSync(filePath)) {
      const ext = extname(filePath);
      const mime = MIME[ext] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      res.end(readFileSync(filePath));
      return;
    }

    // 3. SPA fallback — serve index.html for unknown paths
    const indexPath = join(rootDir, 'index.html');
    if (existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(readFileSync(indexPath));
      return;
    }

    // 4. default 404
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(wrap(title, '<h1>404 — Not Found</h1>'));
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[yawn/server] Port ${port} is already in use.`);
      return;
    }
    throw err;
  });

  server.listen(port, host, () => {
    console.log(`[yawn/server] Running at http://${host}:${port}`);
  });

  return server;
}
