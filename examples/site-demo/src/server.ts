import { createServer } from 'node:http';
import { startApp } from './app/index.ts';

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';

function listenWithFallback(port: number) {
  const server = createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>YH Framework Demo</title>
    <style>
      body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #0f172a; }
      .page { max-width: 780px; margin: 3rem auto; padding: 2rem; border-radius: 20px; background: white; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); }
      .pill { display: inline-block; padding: 0.35rem 0.7rem; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-weight: 700; }
      h1 { margin-top: 0.5rem; }
    </style>
  </head>
  <body>
    <main class="page">
      <span class="pill">YH Framework</span>
      <h1>Hello World</h1>
      <p>Bu sayfa yerel sunucudan gelmektedir.</p>
      <p>Framework çalışıyor.</p>
    </main>
  </body>
</html>`);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE' && port < 3010) {
      listenWithFallback(port + 1);
      return;
    }

    throw error;
  });

  server.listen(port, host, () => {
    console.log(`YH Framework demo running at http://${host}:${port}`);
  });

  return server;
}

listenWithFallback(port);
