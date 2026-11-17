#!/usr/bin/env node
/**
 * Ensure TheTowerSDK-site Vite HMR is up on port 4173.
 *
 * Starts `dev-supervisor.mjs` via Windows Start-Process (or POSIX detached
 * spawn) so Cursor aborting an agent shell cannot kill it. The supervisor
 * restarts Vite if it crashes — matching the durability of a long-lived IDE
 * `vite` terminal (what keeps AGS up).
 *
 * Rules (hard):
 * - One port only. Never fall back to 4174/4175.
 * - If HMR is already healthy → do nothing. Never restart a healthy server.
 * - Never kill a healthy HMR supervisor. Never spawn a second one.
 * - Agents: only `npm run serve` / `serve:status`. Do not delete `.svelte-kit`
 *   while HMR is up.
 */
import { execSync, spawn } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	writeFileSync,
	readFileSync,
	appendFileSync,
	openSync
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { PORT, ORIGIN, SITE_MARKER } from './port.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const tempDir = join(root, 'temp');
const supervisorPidFile = join(tempDir, 'hmr-supervisor.pid');
const outLog = join(tempDir, 'preview-out.log');
const errLog = join(tempDir, 'preview-err.log');
const serverScript = join(__dirname, 'dev-supervisor.mjs');
const launchPs1 = join(tempDir, 'launch-hmr-supervisor.ps1');

const args = new Set(process.argv.slice(2));
const replaceForeign = args.has('--replace-foreign');

async function probe() {
	try {
		const home = await fetch(`${ORIGIN}/`, { signal: AbortSignal.timeout(2500) });
		const html = await home.text();
		const isOurs = home.ok && html.includes(SITE_MARKER);
		if (!isOurs) {
			return { ok: home.ok, isOurs: false, healthy: false, hmr: false, status: home.status };
		}
		const viteClient = await fetch(`${ORIGIN}/@vite/client`, {
			signal: AbortSignal.timeout(2500)
		}).catch(() => null);
		const hmr = Boolean(viteClient?.ok);
		return { ok: true, isOurs: true, healthy: hmr, hmr, status: home.status };
	} catch {
		return { ok: false, isOurs: false, healthy: false, hmr: false, status: 0 };
	}
}

function listeningPids() {
	if (process.platform !== 'win32') {
		try {
			return execSync(`lsof -t -iTCP:${PORT} -sTCP:LISTEN`, { encoding: 'utf8' })
				.split(/\s+/)
				.map((s) => s.trim())
				.filter(Boolean);
		} catch {
			return [];
		}
	}
	try {
		const out = execSync(
			`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"`,
			{ encoding: 'utf8' }
		);
		return [
			...new Set(
				out
					.split(/\r?\n/)
					.map((s) => s.trim())
					.filter((s) => /^\d+$/.test(s))
			)
		];
	} catch {
		return [];
	}
}

function pidAlive(pid) {
	if (!pid || !/^\d+$/.test(String(pid))) return false;
	try {
		if (process.platform === 'win32') {
			execSync(
				`powershell -NoProfile -Command "Get-Process -Id ${pid} -ErrorAction Stop | Out-Null"`,
				{
					stdio: 'ignore'
				}
			);
			return true;
		}
		process.kill(Number(pid), 0);
		return true;
	} catch {
		return false;
	}
}

function readSupervisorPid() {
	try {
		return readFileSync(supervisorPidFile, 'utf8').trim();
	} catch {
		return '';
	}
}

function killPids(pids) {
	for (const pid of pids) {
		try {
			if (process.platform === 'win32') execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
			else execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
			console.log(`Stopped pid ${pid} on port ${PORT}`);
		} catch {
			/* ignore */
		}
	}
}

function startWindowsIndependent() {
	mkdirSync(tempDir, { recursive: true });
	appendFileSync(outLog, `\n--- ensure supervisor start ${new Date().toISOString()} ---\n`);

	const nodePath = process.execPath;
	// Start-Process breaks out of Cursor/agent job objects. No RedirectStandard*
	// (that hangs PowerShell waiting on the child). Logs are written by the supervisor.
	const ps1 = [
		`$ErrorActionPreference = 'Stop'`,
		`$p = Start-Process -FilePath ${JSON.stringify(nodePath)} -ArgumentList @(${JSON.stringify(serverScript)}) -WorkingDirectory ${JSON.stringify(root)} -WindowStyle Hidden -PassThru`,
		`Set-Content -Path ${JSON.stringify(supervisorPidFile)} -Value $p.Id -NoNewline -Encoding ascii`,
		`Write-Output $p.Id`
	].join('\r\n');
	writeFileSync(launchPs1, ps1, 'utf8');

	const id = execSync(
		`powershell -NoProfile -ExecutionPolicy Bypass -File ${JSON.stringify(launchPs1)}`,
		{
			encoding: 'utf8',
			timeout: 15000
		}
	).trim();
	console.log(`Started HMR supervisor pid=${id} → ${ORIGIN}/`);
	console.log(`Logs: ${outLog}`);
}

function startPosixDetached() {
	mkdirSync(tempDir, { recursive: true });
	appendFileSync(outLog, `\n--- ensure supervisor start ${new Date().toISOString()} ---\n`);
	const outFd = openSync(outLog, 'a');
	const errFd = openSync(errLog, 'a');
	const child = spawn(process.execPath, [serverScript], {
		cwd: root,
		detached: true,
		stdio: ['ignore', outFd, errFd],
		env: { ...process.env, BASE_PATH: '' }
	});
	child.unref();
	writeFileSync(supervisorPidFile, String(child.pid ?? ''), 'utf8');
	console.log(`Started detached HMR supervisor pid=${child.pid} → ${ORIGIN}/`);
}

function startDetached() {
	if (process.platform === 'win32') startWindowsIndependent();
	else startPosixDetached();
}

async function waitUntilHealthy(attempts = 120) {
	for (let i = 0; i < attempts; i++) {
		const p = await probe();
		if (p.healthy && p.hmr) return true;
		await new Promise((r) => setTimeout(r, 500));
	}
	return false;
}

async function main() {
	const current = await probe();
	if (current.healthy && current.hmr) {
		console.log(`Already running (HMR): ${ORIGIN}/ (leave it alone)`);
		process.exit(0);
	}

	const existingSupervisor = readSupervisorPid();
	if (existingSupervisor && pidAlive(existingSupervisor) && !current.healthy) {
		console.log(
			`Supervisor pid ${existingSupervisor} is alive; waiting for Vite to become healthy…`
		);
		const ok = await waitUntilHealthy(40);
		if (ok) {
			console.log(`Ready (HMR): ${ORIGIN}/`);
			process.exit(0);
		}
		console.log(
			'Supervisor alive but HMR still down — leaving supervisor; check temp/preview-*.log'
		);
		process.exit(1);
	}

	const pids = listeningPids();
	if (pids.length > 0 && !current.isOurs) {
		if (!replaceForeign) {
			console.error(
				`Port ${PORT} is in use by another process (pids: ${pids.join(', ')}), not ${SITE_MARKER}.`
			);
			console.error(`Run: npm run serve -- --replace-foreign`);
			process.exit(1);
		}
		killPids(pids);
		await new Promise((r) => setTimeout(r, 1500));
	} else if (pids.length > 0 && current.isOurs && !current.healthy) {
		console.log(`Port ${PORT} has a broken listener — replacing once…`);
		killPids(pids);
		await new Promise((r) => setTimeout(r, 1500));
	}

	if (!existsSync(join(root, 'node_modules', 'vite'))) {
		console.error('Missing node_modules/vite — run npm install first.');
		process.exit(1);
	}

	startDetached();
	const ok = await waitUntilHealthy();
	if (!ok) {
		console.error(`Vite HMR did not become healthy on ${ORIGIN}/`);
		try {
			console.error(readFileSync(outLog, 'utf8').slice(-4000));
		} catch {
			/* ignore */
		}
		try {
			console.error(readFileSync(errLog, 'utf8').slice(-2000));
		} catch {
			/* ignore */
		}
		process.exit(1);
	}
	console.log(`Ready (HMR + supervisor): ${ORIGIN}/`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
