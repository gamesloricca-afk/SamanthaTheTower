#!/usr/bin/env node
/** @deprecated use `npm run serve` (ensure-preview). Kept as an alias. */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ensure = join(dirname(fileURLToPath(import.meta.url)), 'ensure-preview.mjs');
const child = spawn(process.execPath, [ensure, ...process.argv.slice(2)], {
	stdio: 'inherit'
});
child.on('exit', (code) => process.exit(code ?? 0));
