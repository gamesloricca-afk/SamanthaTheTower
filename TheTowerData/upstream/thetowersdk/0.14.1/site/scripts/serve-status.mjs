#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { ORIGIN, SITE_MARKER } from './port.mjs';

const tempDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'temp');
const supervisorPidFile = join(tempDir, 'hmr-supervisor.pid');
const vitePidFile = join(tempDir, 'hmr-vite.pid');

function pidAlive(pid) {
	if (!pid || !/^\d+$/.test(String(pid))) return false;
	try {
		if (process.platform === 'win32') {
			execSync(
				`powershell -NoProfile -Command "Get-Process -Id ${pid} -ErrorAction Stop | Out-Null"`,
				{ stdio: 'ignore' }
			);
			return true;
		}
		process.kill(Number(pid), 0);
		return true;
	} catch {
		return false;
	}
}

function readPid(file) {
	try {
		return readFileSync(file, 'utf8').trim();
	} catch {
		return '';
	}
}

const home = await fetch(`${ORIGIN}/`, { signal: AbortSignal.timeout(2500) }).catch(() => null);
const supervisorPid = readPid(supervisorPidFile);
const vitePid = readPid(vitePidFile);
const supervisor = supervisorPid && pidAlive(supervisorPid) ? supervisorPid : '';
const vite = vitePid && pidAlive(vitePid) ? vitePid : '';

if (!home) {
	console.log(`DOWN  ${ORIGIN}/  supervisor=${supervisor || 'no'} vite=${vite || 'no'}`);
	process.exit(1);
}

const html = await home.text();
const ours = home.ok && html.includes(SITE_MARKER);
if (!ours) {
	console.log(`OTHER ${ORIGIN}/  status=${home.status}`);
	process.exit(2);
}

const viteClient = await fetch(`${ORIGIN}/@vite/client`, {
	signal: AbortSignal.timeout(2500)
}).catch(() => null);
if (viteClient?.ok) {
	console.log(
		`UP    ${ORIGIN}/  status=${home.status} mode=hmr supervisor=${supervisor || '?'} vite=${vite || '?'}`
	);
	process.exit(0);
}

console.log(
	`BROKEN ${ORIGIN}/  HTML ok but /@vite/client failed  supervisor=${supervisor || 'no'} vite=${vite || 'no'}`
);
process.exit(3);
