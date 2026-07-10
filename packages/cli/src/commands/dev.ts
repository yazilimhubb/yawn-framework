import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export function runDev(targetDir = '.') {
  const abs = resolve(targetDir);
  const entry = join(abs, 'src', 'server.ts') || join(abs, 'src', 'main.ts');
  const fallback = join(abs, 'src', 'server.js') || join(abs, 'src', 'main.js');

  let entryFile: string | null = null;
  for (const f of [
    join(abs, 'src', 'server.ts'),
    join(abs, 'src', 'main.ts'),
    join(abs, 'src', 'server.js'),
    join(abs, 'src', 'main.js'),
  ]) {
    if (existsSync(f)) {
      entryFile = f;
      break;
    }
  }

  if (!entryFile) {
    return {
      exitCode: 1,
      output: `No entry file found in ${abs}/src.\nCreate src/server.ts or src/main.ts to get started.`,
    };
  }

  console.log(`\n  🟢 Starting dev server → ${entryFile}\n`);

  // spawn tsx so TypeScript files run directly
  const res = spawnSync(
    process.execPath,
    ['--import', 'tsx', entryFile],
    {
      stdio: 'inherit',
      cwd: abs,
      env: { ...process.env, NODE_ENV: 'development' },
    },
  );

  return {
    exitCode: res.status ?? 0,
    output: '',
  };
}
