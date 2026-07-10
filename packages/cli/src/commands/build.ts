import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function buildProject(targetDir = '.') {
  const entry = join(targetDir, 'src', 'main.ts');
  if (existsSync(entry)) {
    return {
      exitCode: 0,
      output: `Build ready for ${targetDir}`,
    };
  }

  return {
    exitCode: 1,
    output: `No app entry found in ${targetDir}`,
  };
}
