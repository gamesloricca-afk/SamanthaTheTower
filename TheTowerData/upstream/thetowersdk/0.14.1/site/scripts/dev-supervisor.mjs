#!/usr/bin/env node
/**
 * Durable Vite HMR supervisor for TheTowerSDK-site.
 *
 * This process is started once via Start-Process (outside Cursor agent job
 * objects). It keeps `vite dev` alive on the fixed port: if Vite exits for any
 * reason, it is restarted. Agents must never kill this process.
 */
import { spawn } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOST, PORT, ORIGIN } from './port.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tempDir = join(root, 'temp');
const outLog = join(tempDir, 'preview-out.log');
const errLog = join(tempDir, 'preview-err.log');
const supervisorPidFile = join(tempDir, 'hmr-supervisor.pid');
const vitePidFile = join(tempDir, 'hmr-vite.pid');
const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');

mkdirSync(tempDir, { recursive: true });
writeFileSync(supervisorPidFile, String(process.pid), 'utf8');

let child = null;
let stopping = false;

function log(line) {
	const msg = `[${new Date().toISOString()}] ${line}\n`;
	try {
		appendFileSync(outLog, msg);
	} catch {
		/* ignore */
	}
	console.log(line.trimEnd());
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function clearPid(file) {
	try {
		unlinkSync(file);
	} catch {
		/* ignore */
	}
}

function runViteOnce() {
	return new Promise((resolve) => {
		if (!existsSync(viteBin)) {
			log(`FATAL missing ${viteBin}`);
			resolve({ code: 127, signal: null });
			return;
		}

		log(`starting vite HMR on ${ORIGIN}/ (supervisor pid=${process.pid})`);
		child = spawn(
			process.execPath,
			[viteBin, 'dev', '--host', HOST, '--port', String(PORT), '--strictPort'],
			{
				cwd: root,
				env: { ...process.env, BASE_PATH: '' },
				stdio: ['ignore', 'pipe', 'pipe'],
				windowsHide: true
			}
		);

		writeFileSync(vitePidFile, String(child.pid ?? ''), 'utf8');

		child.stdout?.on('data', (buf) => {
			try {
				appendFileSync(outLog, buf);
			} catch {
				/* ignore */
			}
		});
		child.stderr?.on('data', (buf) => {
			try {
				appendFileSync(errLog, buf);
				appendFileSync(outLog, buf);
			} catch {
				/* ignore */
			}
		});

		child.on('error', (err) => {
			log(`vite spawn error: ${err?.message ?? err}`);
		});

		child.on('exit', (code, signal) => {
			clearPid(vitePidFile);
			const c = child;
			child = null;
			log(`vite exited pid=${c?.pid} code=${code} signal=${signal}`);
			resolve({ code, signal });
		});
	});
}

async function shutdown(signal) {
	if (stopping) return;
	stopping = true;
	log(`supervisor shutting down (${signal})`);
	if (child && !child.killed) {
		try {
			child.kill('SIGTERM');
		} catch {
			/* ignore */
		}
		await sleep(1500);
		if (child && !child.killed) {
			try {
				child.kill('SIGKILL');
			} catch {
				/* ignore */
			}
		}
	}
	clearPid(vitePidFile);
	clearPid(supervisorPidFile);
	process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('uncaughtException', (err) => {
	log(`supervisor uncaughtException: ${err?.stack ?? err}`);
});
process.on('unhandledRejection', (err) => {
	log(`supervisor unhandledRejection: ${err?.stack ?? err}`);
});

log(`supervisor online pid=${process.pid}`);

while (!stopping) {
	const { code, signal } = await runViteOnce();
	if (stopping) break;
	// Port still held briefly after crash — wait before retry.
	const delay = code === 0 ? 500 : 1500;
	log(`restarting vite in ${delay}ms (last code=${code} signal=${signal})`);
	await sleep(delay);
}
