// Launcher `pnpm dev:api`: checks for a usable PHP binary before starting
// `php artisan serve`, so a missing PHP prints actionable guidance instead of
// a raw "'php' is not recognized" crash. Override with PHP_BIN env var.
// Usage: node scripts/dev-api.mjs [--host=.. --port=.. -- extra artisan args]
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const API_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'api');
const DEFAULT_ARGS = ['artisan', 'serve', '--host=localhost', '--port=8000'];

function resolvePhp() {
  if (process.env.PHP_BIN) {
    return process.env.PHP_BIN;
  }
  const probe = process.platform === 'win32' ? 'where' : 'command';
  const probeArgs = process.platform === 'win32' ? ['php'] : ['-v', 'php'];
  const found = spawnSync(probe, probeArgs, { stdio: 'ignore' });
  return found.status === 0 ? 'php' : null;
}

function printGuidance(requested) {
  const lines = [
    `[dev:api] PHP binary not found${requested ? ` (PHP_BIN=${requested})` : ''}.`,
    '[dev:api] Laravel needs PHP 8.3+. Options:',
    '[dev:api]   1. Add PHP to PATH, e.g. Laragon: C:\\laragon\\bin\\php\\php-8.3.33-Win32-vs16-x64',
    '[dev:api]   2. Or point PHP_BIN at php.exe, e.g.:',
    '[dev:api]      PowerShell: $env:PHP_BIN="C:\\laragon\\bin\\php\\php-8.3.33-Win32-vs16-x64\\php.exe"; pnpm dev:api',
    '[dev:api]      cmd.exe:    set PHP_BIN=C:\\laragon\\bin\\php\\php-8.3.33-Win32-vs16-x64\\php.exe && pnpm dev:api',
  ];
  console.error(lines.join('\n'));
}

const php = resolvePhp();
if (!php) {
  printGuidance(process.env.PHP_BIN);
  process.exit(1);
}

const child = spawn(php, [...DEFAULT_ARGS, ...process.argv.slice(2)], {
  cwd: API_DIR,
  stdio: 'inherit',
  shell: false,
});
child.on('error', (err) => {
  if (err.code === 'ENOENT') {
    printGuidance(php);
    process.exit(1);
  }
  console.error(`[dev:api] failed to start PHP: ${err.message}`);
  process.exit(1);
});
child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code ?? 1));
});
