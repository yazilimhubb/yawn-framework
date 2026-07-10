import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from './app/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';

function loadCss(): string {
  const cssPath = join(__dirname, 'styles', 'main.css');
  return existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : '';
}

function buildHtml(body: string): string {
  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Yawn Framework Demo</title>
    <style>${loadCss()}</style>
  </head>
  <body>
    ${body}
  </body>
</html>`;
}

function listenWithFallback(tryPort: number): void {
  const server = createServer((req, res) => {
    const pathname = new URL(req.url ?? '/', `http://${host}:${tryPort}`).pathname;

    if (pathname === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      const body = renderPage(pathname);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(buildHtml(body));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE' && tryPort < 3010) {
      listenWithFallback(tryPort + 1);
      return;
    }
    throw error;
  });

  server.listen(tryPort, host, () => {
    console.log(`\n  ⚡ Yawn site-demo  →  http://${host}:${tryPort}\n`);
    console.log('  Routes:');
    console.log('    /          → Home');
    console.log('    /about     → Hakkımızda');
    console.log('    /contact   → İletişim\n');
  });
}

listenWithFallback(port);
