#!/usr/bin/env node
/**
 * Durable static file server for build/ on the fixed port.
 * No file watching — rebuilds are safe; refresh the browser.
 * Logs to temp/preview-out.log (self-owned; Start-Process must not redirect).
 */
import { createServer } from 'node:http';
import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';
import { HOST, PORT, ORIGIN } from './port.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = join(root, 'build');
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

if (!existsSync(join(buildDir, 'index.html'))) {
	console.error(`Missing ${buildDir}/index.html — run npm run build first`);
	process.exit(1);
}

const serve = sirv(buildDir, {
	dev: false,
	etag: true,
	ignores: false
});

const server = createServer((req, res) => {
	serve(req, res, () => {
		res.statusCode = 404;
		res.end('Not found');
	});
});

server.listen(PORT, HOST, () => {
	log(`TheTowerSDK-site listening on ${ORIGIN}/ (build/) pid=${process.pid}`);
});

function shutdown() {
	log(`Shutting down pid=${process.pid}`);
	server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
