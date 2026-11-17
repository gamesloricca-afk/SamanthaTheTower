#!/usr/bin/env node
/**
 * beforeShellExecution gate for TheTowerSDK-site.
 *
 * Root failure mode (repeated): agent mutates node_modules / kills Vite while
 * the durable HMR supervisor holds native addon locks (lightningcss, etc.).
 * Prose rules were not enough — deny at the shell hook.
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const PORT = 4173;

function reply(obj, code = 0) {
	try {
		fs.writeSync(1, JSON.stringify(obj) + '\n');
	} catch {
		/* ignore */
	}
	try {
		if (typeof process.stdin.destroy === 'function') process.stdin.destroy();
	} catch {
		/* ignore */
	}
	process.exit(code);
}

function readStdin(ms = 200) {
	return new Promise((resolve) => {
		const chunks = [];
		let done = false;
		const finish = () => {
			if (done) return;
			done = true;
			clearTimeout(t);
			const raw = Buffer.concat(chunks).toString('utf8').trim();
			resolve(raw);
		};
		const t = setTimeout(finish, ms);
		process.stdin.on('data', (c) => chunks.push(c));
		process.stdin.on('end', finish);
		process.stdin.on('error', finish);
	});
}

function portListening() {
	try {
		if (process.platform === 'win32') {
			const out = execSync(
				`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess"`,
				{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
			).trim();
			return /^\d+$/.test(out);
		}
		execSync(`lsof -t -iTCP:${PORT} -sTCP:LISTEN`, { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

function deny(agentMessage, userMessage = agentMessage) {
	reply({
		permission: 'deny',
		agentMessage,
		userMessage
	});
}

try {
	const raw = await readStdin(250);
	let payload = {};
	try {
		payload = raw ? JSON.parse(raw) : {};
	} catch {
		payload = {};
	}
	const cmd = String(payload.command ?? payload.cmd ?? '');
	const up = portListening();

	// Explicit process / port kills
	if (/\b(kill-port|Stop-Process|taskkill)\b/i.test(cmd) && new RegExp(String(PORT)).test(cmd)) {
		deny(`FORBIDDEN: never kill port ${PORT} / Vite HMR.`);
	}
	if (
		/hmr-supervisor|dev-supervisor|hmr-vite/i.test(cmd) &&
		/\b(kill|Stop-Process|taskkill)\b/i.test(cmd)
	) {
		deny('FORBIDDEN: never kill the HMR supervisor.');
	}

	// Second / alternate preview servers
	if (/\bvite\s+preview\b/i.test(cmd) || /\bnpm\s+run\s+preview\b/i.test(cmd)) {
		deny('FORBIDDEN: use durable HMR on :4173 (npm run serve). Do not run vite preview locally.');
	}
	if (/\bvite\s+dev\b/i.test(cmd) && !/dev-supervisor|ensure-preview|serve-status/i.test(cmd)) {
		deny('FORBIDDEN: do not start a raw vite dev — use npm run serve only if DOWN.');
	}

	// Package tree mutations while HMR holds native .node locks (THE repeated root cause)
	const mutatesPackages =
		/\bnpm\s+ci\b/i.test(cmd) ||
		/\bnpm\s+install\b/i.test(cmd) ||
		/\bnpm\s+i\b/i.test(cmd) ||
		/\bnpm\s+uninstall\b/i.test(cmd) ||
		/\bpnpm\s+(i|install|ci)\b/i.test(cmd) ||
		/\byarn\s+(install|add)\b/i.test(cmd) ||
		/Remove-Item[^\n]*node_modules/i.test(cmd) ||
		/rm\s+(-rf|--recursive)[^\n]*node_modules/i.test(cmd) ||
		/Remove-Item[^\n]*\.svelte-kit/i.test(cmd) ||
		/rm\s+(-rf|--recursive)[^\n]*\.svelte-kit/i.test(cmd) ||
		(/node_modules[\\/]\.vite/i.test(cmd) && /(Remove-Item|rm\s|rimraf|unlink)/i.test(cmd));

	if (mutatesPackages) {
		deny(
			up
				? `FORBIDDEN while HMR is UP on :${PORT}: do not npm ci/install or wipe node_modules/.svelte-kit/.vite. That unlocks native addons and crashes Vite. Verify production builds in GitHub Actions only.`
				: `FORBIDDEN: do not npm ci/install or wipe node_modules from the agent shell. Ask the user, or rely on CI. If preview is DOWN, only npm run serve.`
		);
	}

	// Allowed: serve / serve:status / overlay / build (build does not rewrite node_modules)
	reply({ permission: 'allow' });
} catch (err) {
	reply({
		permission: 'deny',
		agentMessage: String(err?.message || err),
		userMessage: 'TheTowerSDK-site preview hook crashed (fail-closed).'
	});
}
