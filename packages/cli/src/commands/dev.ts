import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

export function runDev(targetDir = '.') {
  const abs = resolve(targetDir);

  const candidates = [
    join(abs, 'src', 'server.ts'),
    join(abs, 'src', 'main.ts'),
    join(abs, 'src', 'server.js'),
    join(abs, 'src', 'main.js'),
  ];

  const entryFile = candidates.find(existsSync) ?? null;

  if (!entryFile) {
    return {
      exitCode: 1,
      output: [
        `No entry file found in ${abs}/src.`,
        'Create src/server.ts or src/main.ts to get started.',
      ].join('\n'),
    };
  }

  console.log(`\n  🟢 Starting dev server → ${entryFile}\n`);

  // Use spawn (non-blocking) so the CLI process stays alive with the server
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', entryFile],
    {
      stdio: 'inherit',
      cwd: abs,
      env: { ...process.env, NODE_ENV: 'development' },
    },
  );

  child.on('error', (err) => {
    console.error(`[yawn/dev] Failed to start: ${err.message}`);
    console.error('Make sure tsx is installed: npm install -D tsx');
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  // block the CLI process until child exits
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));

  // Return a sentinel — the process stays alive via the child
  return { exitCode: 0, output: '' };
}
