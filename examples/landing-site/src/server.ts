import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { loadTemplate } from './load-template.ts';

const renderedTemplate = loadTemplate('page.yawn');
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';

function startServerAt(portToTry: number) {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE' && portToTry < 3010) {
      startServerAt(portToTry + 1);
      return;
    }
    throw error;
  });

  server.listen(portToTry, host, () => {
    console.log(`Yawn landing site running at http://${host}:${portToTry}`);
  });
}

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Yawn Landing</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ctext y='48' font-size='48'%3E⚡%3C/text%3E%3C/svg%3E" />
    <style>
      body { margin: 0; font-family: Inter, system-ui, sans-serif; background: linear-gradient(135deg, #f8fafc, #eef2ff); color: #111827; }
      .page { max-width: 960px; margin: 0 auto; padding: 2rem; }
      .hero { background: white; border-radius: 24px; padding: 2rem; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08); }
      h1 { font-size: 2.4rem; margin-bottom: 0.8rem; }
      p { font-size: 1.05rem; line-height: 1.7; color: #475569; }
      button { border: 0; border-radius: 999px; padding: 0.85rem 1.2rem; background: #4f46e5; color: white; font-weight: 700; cursor: pointer; }
      .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-top: 1.2rem; }
      .card { background: #f8fafc; padding: 1rem; border-radius: 16px; }
    </style>
  </head>
  <body>
    <main class="page">
      ${renderedTemplate}
    </main>
  </body>
</html>`;

startServerAt(port);
