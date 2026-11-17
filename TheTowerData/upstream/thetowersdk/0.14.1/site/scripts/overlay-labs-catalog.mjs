/**
 * Overlay labs-catalog identity fixes from the local monorepo SDK onto the
 * published `thetowersdk` install (slug + display-name split).
 *
 * Do not copy the whole monorepo mechanics/index — unpublished modules
 * (governance/doctor) break the site SSR.
 *
 * Card gem costs ship in thetowersdk@0.4.1+; no barrel patch needed for those.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..');
const fromDist = resolve(siteRoot, '../TrackerWebsite/the-tower-run-tracker/packages/sdk/dist');
const toDist = join(siteRoot, 'node_modules/thetowersdk/dist');

/** Relative paths under dist/ that consume or define LAB_CATALOG identity. */
const RELATIVE_FILES = [
	'data/labs-catalog.js',
	'data/labs-catalog.d.ts',
	'data/labs-categories.js',
	'data/labs-categories.d.ts',
	'data/labs-display-overrides.js',
	'data/labs-display-overrides.d.ts',
	'data/labs-research.js',
	'data/labs-research.d.ts',
	'data/labs.js',
	'data/labs.d.ts',
	'data/schemas.js',
	'data/schemas.d.ts',
	'mechanics/effective-paths-aliases.js',
	'mechanics/effective-paths-aliases.d.ts',
	'mechanics/effective-paths-currencies.js',
	'mechanics/effective-paths-currencies.d.ts',
	'mechanics/effective-paths-eecon-discount.js',
	'mechanics/effective-paths-eecon-discount.d.ts',
	'mechanics/effective-paths-lab-costs.js',
	'mechanics/effective-paths-lab-costs.d.ts',
	'save/lab-remaining.js',
	'save/lab-remaining.d.ts'
];

if (!existsSync(fromDist)) {
	console.error(`Missing ${fromDist} — build packages/sdk first.`);
	process.exit(1);
}
if (!existsSync(toDist)) {
	console.error(`Missing ${toDist} — npm install thetowersdk first.`);
	process.exit(1);
}

let copied = 0;
for (const rel of RELATIVE_FILES) {
	const from = join(fromDist, rel);
	const to = join(toDist, rel);
	if (!existsSync(from)) {
		console.error(`Missing source ${from}`);
		process.exit(1);
	}
	if (!existsSync(dirname(to))) {
		console.error(`Missing target dir for ${to}`);
		process.exit(1);
	}
	copyFileSync(from, to);
	copied += 1;
}
console.log(`overlaid ${copied} thetowersdk dist files from local SDK (labs catalog)`);
