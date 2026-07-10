import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function runDev(targetDir = '.') {
  const entry = join(targetDir, 'src', 'main.ts');
  const fallback = join(targetDir, 'src', 'main.js');

  if (existsSync(entry)) {
    return {
      exitCode: 0,
      output: `Starting dev server for ${targetDir} using ${entry}`,
    };
  }

  if (existsSync(fallback)) {
    return {
      exitCode: 0,
      output: `Starting dev server for ${targetDir} using ${fallback}`,
    };
  }

  return {
    exitCode: 0,
    output: `No app entry found in ${targetDir}; ready to start a new Yawn app`,
  };
}
