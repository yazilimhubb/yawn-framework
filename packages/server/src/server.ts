import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

export interface ServerOptions {
  port?: number;
  host?: string;
  rootDir?: string;
}

function createHtmlDocument(title: string, body: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      :root { color-scheme: light; font-family: Inter, system-ui, Arial, sans-serif; }
      body { margin: 0; background: linear-gradient(135deg, #eff6ff, #f8fafc); color: #0f172a; }
      .page { max-width: 760px; margin: 3rem auto; padding: 2rem; border-radius: 20px; background: white; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08); }
      h1 { margin-top: 0; }
      .pill { display: inline-block; padding: 0.35rem 0.7rem; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-weight: 700; }
    </style>
  </head>
  <body>
    <main class="page">
      ${body}
    </main>
  </body>
</html>`;
}

export function startServer(options: ServerOptions = {}) {
  const port = options.port ?? 3000;
  const host = options.host ?? '127.0.0.1';
  const rootDir = options.rootDir ?? process.cwd();

  const html = createHtmlDocument(
    'YH Framework Demo',
    '<span class="pill">YH Framework</span><h1>Hello World</h1><p>Bu sayfa localhost üzerinde çalışan bir demo sunucudan gelmektedir.</p><p>YH Framework ile web sitesi kurma akışı çalışıyor.</p>',
  );

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const pathname = new URL(req.url ?? '/', `http://${host}:${port}`).pathname;
    const filePath = pathname === '/' ? '/index.html' : pathname;

    if (filePath === '/index.html' || filePath === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use. Please stop the existing server and try again.`);
      return;
    }
    throw error;
  });

  server.listen(port, host, () => {
    console.log(`YH dev server running at http://${host}:${port}`);
  });

  return server;
}
