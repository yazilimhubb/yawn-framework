import { startServer } from '../../server/src/server.ts';

export function startDevServer(port = 3000) {
  return startServer({ port, host: '127.0.0.1' });
}
