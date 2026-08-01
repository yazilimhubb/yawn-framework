#!/usr/bin/env node
import { spawn } from 'child_process';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = dirname(fileURLToPath(import.meta.url));
const version = 'v0.3.0';

function getPlatformBinary() {
  const platform = process.platform;
  const arch = process.arch;
  if (arch !== 'x64') {
    console.error('Only x64 architecture is supported.');
    process.exit(1);
  }
  if (platform === 'win32') return `yawn-windows-amd64.exe`;
  if (platform === 'linux') return `yawn-linux-amd64`;
  if (platform === 'darwin') return `yawn-macos-amd64`;
  console.error(`Unsupported platform: ${platform}`);
  process.exit(1);
}

async function downloadBinary(binaryName, destPath) {
  const url = `https://github.com/yazilimhubb/yawn-framework/releases/download/${version}/${binaryName}`;
  const writer = createWriteStream(destPath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function main() {
  const binDir = join(__dirname, '..', 'bin_native');
  if (!existsSync(binDir)) {
    mkdirSync(binDir, { recursive: true });
  }

  const binaryName = getPlatformBinary();
  const binaryPath = join(binDir, binaryName);

  if (!existsSync(binaryPath)) {
    console.log(`Downloading yawn binary version ${version}...`);
    try {
      await downloadBinary(binaryName, binaryPath);
      if (process.platform !== 'win32') {
        const chmod = spawn('chmod', ['+x', binaryPath]);
        await new Promise((resolve) => chmod.on('close', resolve));
      }
    } catch (err) {
      console.error('Failed to download yawn compiler binary:', err.message);
      process.exit(1);
    }
  }

  const args = process.argv.slice(2);
  const proc = spawn(binaryPath, args, { stdio: 'inherit' });
  proc.on('close', (code) => {
    process.exit(code);
  });
}

main();
