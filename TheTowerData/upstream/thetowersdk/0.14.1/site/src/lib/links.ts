/*
 * The SDK's own manifest, not the copy in node_modules.
 *
 * The site sits inside the SDK repository, so `../../../package.json` is the version being
 * released — it is current the moment the version is bumped, with no install step in between.
 * Reading the installed copy instead meant the site advertised whatever `site/package.json`
 * happened to pin, which is one more thing to remember on every release.
 *
 * Named import, not a default import of the whole manifest: Vite's JSON plugin emits each
 * top-level key as its own export, so this ships the version string alone. A default import
 * inlined the entire package.json — scripts, devDependencies and all — into the client bundle.
 */
import { version as sdkVersion } from '../../../package.json';

export const LINKS = {
	npm: 'https://www.npmjs.com/package/thetowersdk',
	github: 'https://github.com/TmRxJD/TheTowerSDK',
	/*
	 * The site lives inside the SDK repository now — TheTowerSDK-site was folded in, which is what
	 * removed the trailing `-site` from the published URL. The old repo still exists but its Pages
	 * are disabled, so linking there would send a reader somewhere that no longer serves anything.
	 */
	siteRepo: 'https://github.com/TmRxJD/TheTowerSDK',
	agsSite: 'https://tmrxjd.github.io/agent-governance-system-site/',
	agsRepo: 'https://github.com/TmRxJD/agent-governance-system-site',
	adbBridge: 'https://github.com/TmRxJD/adb-bridge',
	adbBridgeNpm: 'https://www.npmjs.com/package/adb-bridge',
	towerai: 'https://github.com/TmRxJD/TowerAI',
	towerAiNpm: 'https://www.npmjs.com/package/towerai',
	wiki: 'https://the-tower-idle-tower-defense.fandom.com',
	effectivePaths:
		'https://docs.google.com/spreadsheets/d/1YwZtKP6B4WYhRba5T6APJ1YxKNdfnIGQnprgnxmO7zc/edit',
	tracker: 'https://the-tower-run-tracker.com'
} as const;

/*
 * Where the published site is served from, without the base path. Link previews — Discord, Slack,
 * social cards — ignore a relative image URL, so the social tags are built from this plus `asset()`.
 */
export const SITE_ORIGIN = 'https://tmrxjd.github.io';

export const PACKAGE_NAME = 'thetowersdk';
export const INSTALL_CMD = `npm install thetowersdk@${sdkVersion} --save-exact`;

/*
 * Read from the installed package rather than restated here.
 *
 * This was a hand-maintained constant with a “keep in sync on every bump” comment, and it drifted
 * twice — the site advertised 0.5.2 while depending on 0.5.4 and documenting exports that only
 * exist in 0.5.4. Nothing reported it, because a stale version number renders perfectly.
 */
export const SDK_VERSION: string = sdkVersion;
