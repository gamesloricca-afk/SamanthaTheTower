import { LINKS, SDK_VERSION, SITE_ORIGIN } from './links';

/** One page index for search metadata, link previews, and the generated sitemap. */
export const PAGE_METADATA = {
	'/': [
		'TheTowerSDK — TypeScript SDK for The Tower',
		'Build tools for The Tower with typed game catalogs, calculators, save readers, charts and an MCP server. Open-source TypeScript for Node.js and browsers.'
	],
	'/start/': [
		'Get Started · TheTowerSDK',
		'Install TheTowerSDK, read your first game catalog, and connect the MCP server. Start building a Tower calculator or save-file tool.'
	],
	'/tools/': [
		'Build Tower Calculators and Tools · TheTowerSDK',
		'Explore calculators, save-file tools, charts, spreadsheets and Discord bots you can build with TheTowerSDK.'
	],
	'/playground/': [
		'Live SDK Examples · TheTowerSDK',
		'Try lab costs, enemy stats, module upgrades and Effective Paths. Change inputs and copy working TypeScript examples.'
	],
	'/contributions/': [
		'Contributions · TheTowerSDK',
		'Meet the Effective Paths team, save-format contributors, TowerToolkit authors and wiki editors whose work supports TheTowerSDK.'
	],
	'/docs/': [
		'SDK Documentation · TheTowerSDK',
		'TheTowerSDK API guides for game data, formulas, save files, calculator builders, charts and integrations.'
	],
	'/docs/install/': [
		'Install the SDK · TheTowerSDK',
		'Install TheTowerSDK from npm and choose the right TypeScript entry point for Node.js, browsers and your build system.'
	],
	'/docs/data/': [
		'Game Data and Catalogs · TheTowerSDK',
		'Read typed Tower catalogs for labs, modules, cards, ultimate weapons, bots, relics and workshop upgrades.'
	],
	'/docs/save/': [
		'Read Tower Save Files · TheTowerSDK',
		'Read official game JSON exports for typed account data including labs, modules, cards and battle reports.'
	],
	'/docs/mechanics/': [
		'Game Formulas and Calculators · TheTowerSDK',
		'Use TheTowerSDK formulas for lab costs, enemy stats, modules, uptime, damage and Effective Paths planning.'
	],
	'/docs/builders/': [
		'Calculator Builders · TheTowerSDK',
		'Build calculator forms and commands from declared inputs, units, limits, normalization and typed results.'
	],
	'/docs/knowledge/': [
		'Mechanics Knowledge Graph · TheTowerSDK',
		'Explore Tower mechanic meanings, units, relationships, sources and unresolved disagreements in the SDK knowledge graph.'
	],
	'/docs/charts/': [
		'Chart Datasets · TheTowerSDK',
		'Build Tower charts and tables from SDK datasets for labs, cards, workshop upgrades, modules and ultimate weapons.'
	],
	'/docs/formatting/': [
		'Numbers and Duration Formatting · TheTowerSDK',
		'Format Tower number notation and durations, parse values, and keep display strings separate from calculations.'
	],
	'/docs/wasm/': [
		'WebAssembly API · TheTowerSDK',
		'Call TheTowerSDK formulas and catalogs through its WebAssembly interface from languages beyond JavaScript.'
	],
	'/docs/sheets/': [
		'Spreadsheet Integration · TheTowerSDK',
		'Read and write spreadsheet data and connect Tower calculations to community workflows with TheTowerSDK.'
	],
	'/docs/wiki/': [
		'Wiki Integration · TheTowerSDK',
		'Fetch Tower wiki pages as Markdown and use public mechanic references alongside typed SDK catalogs.'
	],
	'/docs/bots/': [
		'Discord Bot Integration · TheTowerSDK',
		'Expose Tower calculator builders as Discord commands with shared inputs, units and validation.'
	],
	'/docs/mcp/': [
		'MCP Server and AI Tools · TheTowerSDK',
		'Connect an assistant to TheTowerSDK MCP server to discover exports, inspect game catalogs and use calculator tools.'
	],
	'/docs/towerai/': [
		'TowerAI Integration · TheTowerSDK',
		'Learn how TowerAI uses the SDK and connect Tower tools to your own assistant or application.'
	],
	'/docs/desktop-and-mobile/': [
		'Desktop and Mobile Integration · TheTowerSDK',
		'Use TheTowerSDK in Electron and Capacitor applications, with clear boundaries between browser code and Node.js save decoding.'
	],
	'/docs/dependencies/': [
		'SDK Dependencies · TheTowerSDK',
		'Inspect TheTowerSDK runtime dependency and understand which functionality runs locally and which integrations use a network.'
	],
	'/docs/license/': [
		'MIT License · TheTowerSDK',
		'Read the MIT license and attribution requirements for TheTowerSDK and its community contributions.'
	],
	'/docs/patch-notes/': [
		'Tower Game Patch Notes · TheTowerSDK',
		'Browse official The Tower game patch notes and version history alongside SDK documentation.'
	]
} as const;

const UNLISTED_PAGES: Record<string, readonly [string, string]> = {
	'/ai/': ['AI Integrations · TheTowerSDK', 'Optional assistant integrations.'],
	'/ags/': ['ACS · TheTowerSDK', 'Optional governance integration.'],
	'/docs/ags/': [
		'ACS Documentation · TheTowerSDK',
		'Optional governance integration documentation.'
	],
	'/license/': ['Player License · TheTowerSDK', 'Optional player licensing information.']
};

/** SvelteKit supplies the deployment base; query strings never become canonical URLs. */
export function pageMetadata(pathname: string, base = '') {
	pathname = pathname.split(/[?#]/, 1)[0];
	const relative =
		base && (pathname === base || pathname.startsWith(`${base}/`))
			? pathname.slice(base.length) || '/'
			: pathname;
	const path = relative.endsWith('/') ? relative : `${relative}/`;
	const listed = PAGE_METADATA[path as keyof typeof PAGE_METADATA];
	const entry = listed ??
		UNLISTED_PAGES[path] ?? [
			'Page Not Found · TheTowerSDK',
			'The requested SDK page was not found.'
		];
	return {
		title: entry[0],
		description: entry[1],
		shareDescription:
			path === '/'
				? 'Build tools for The Tower with typed game data, calculators, save readers and charts. Add AI assistants with TowerAI or connect your editor through the MCP server and query the SDK directly.'
				: entry[1],
		indexable: Boolean(listed),
		canonical: absolutePath(`${base}${path}`)
	};
}

export function sitemapUrls(base = ''): string[] {
	return Object.keys(PAGE_METADATA).map((path) => absolutePath(`${base}${path}`));
}

export function shareLogoUrl(base = ''): string {
	return absolutePath(`${base}/TheTowerSDK_logo.v5.png`);
}

function absolutePath(path: string): string {
	const url = new URL(SITE_ORIGIN);
	url.pathname = path;
	return url.href;
}

/** Describe the actual library; no ratings, search actions, or unsupported product claims. */
export function siteStructuredData(base = '') {
	const home = pageMetadata(`${base}/`, base);
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${home.canonical}#website`,
				name: 'TheTowerSDK',
				alternateName: 'The Tower SDK',
				url: home.canonical
			},
			{
				'@type': 'SoftwareSourceCode',
				'@id': `${home.canonical}#sdk`,
				name: 'TheTowerSDK',
				description: home.description,
				url: home.canonical,
				codeRepository: LINKS.github,
				programmingLanguage: 'TypeScript',
				runtimePlatform: ['Node.js', 'Web browsers'],
				version: SDK_VERSION,
				license: 'https://opensource.org/license/mit',
				image: shareLogoUrl(base)
			}
		]
	};
}

/** Keep JSON-LD data from terminating its containing HTML script element. */
export function serializeStructuredData(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function structuredDataMarkup(base = ''): string {
	return `<script type="application/ld+json">${serializeStructuredData(siteStructuredData(base))}</script>`;
}
