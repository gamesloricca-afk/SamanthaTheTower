#!/usr/bin/env node
/**
 * Long-lived Vite HMR for TheTowerSDK-site on the fixed port.
 * Launched via Start-Process / detached spawn so agent shells cannot kill it.
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { HOST, PORT, ORIGIN } from './port.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tempDir = join(root, 'temp');
const outLog = join(tempDir, 'preview-out.log');

function log(line) {
	const msg = `[${new Date().toISOString()}] ${line}\n`;
	try {
		mkdirSync(tempDir, { recursive: true });
		appendFileSync(outLog, msg);
	} catch {
		/* ignore */
	}
	console.log(line);
}

process.env.BASE_PATH = '';

const server = await createServer({
	configFile: join(root, 'vite.config.ts'),
	root,
	server: {
		host: HOST,
		port: PORT,
		strictPort: true
	}
});

await server.listen();
log(`TheTowerSDK-site HMR listening on ${ORIGIN}/ pid=${process.pid}`);
server.printUrls();

async function shutdown(signal) {
	log(`Shutting down HMR pid=${process.pid} (${signal})`);
	try {
		await server.close();
	} catch {
		/* ignore */
	}
	process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
