#!/usr/bin/env node
import { buildProject } from './commands/build.ts';
import { initProject } from './commands/init.ts';
import { runDev } from './commands/dev.ts';
import { createResource } from './commands/create.ts';
import { insertComponent } from './commands/insert.ts';

export interface CliResult {
  exitCode: number;
  output: string;
}

export function runCli(args: string[] = []): CliResult {
  const [command, ...rest] = args;

  if (!command || command === 'help') {
    return {
      exitCode: 0,
      output: 'Usage: yh <command>\n\nCommands:\n  help\n  init [dir]\n  dev [dir]\n  build [dir]',
    };
  }

  if (command === 'init') {
    return initProject(rest[0] ?? '.');
  }

  if (command === 'dev') {
    return runDev(rest[0] ?? '.');
  }

  if (command === 'build') {
    return buildProject(rest[0] ?? '.');
  }

  if (command === 'create') {
    const type = rest[0];
    const name = rest[1];
    const dir = rest[2] ?? '.';
    return createResource(type, name, dir);
  }

  if (command === 'insert') {
    const file = rest[0];
    const comp = rest[1];
    const props = rest.slice(2);
    return insertComponent(file, comp, props);
  }

  return {
    exitCode: 1,
    output: `Unknown command: ${command}`,
  };
}
