<script lang="ts">
	import { href } from '$lib/paths';
	import { sdkFacts, grouped, spelled } from '$lib/sdk-facts';

	/**
	 * The docs index, grouped by what you are trying to do.
	 *
	 * Written out rather than generated from `docsNav`, because the sidebar's job is to list pages in
	 * a fixed order and this page's job is to help someone pick one. A reader arriving here knows
	 * their task, not the package's module layout.
	 */
	const sections = [
		{
			title: 'Start here',
			pages: [
				{
					href: '/docs/install/',
					label: 'Install',
					body: `One package, the ${spelled(sdkFacts.entryPoints)} entry points, pinning a version, and using it in the browser.`
				},
				{
					href: '/docs/data/',
					label: 'Game Data',
					body: 'Every catalog in the game — labs, workshop, modules, cards, ultimate weapons and the rest — and how to query them.'
				},
				{
					href: '/docs/mechanics/',
					label: 'Formulas',
					body: `The maths the game runs: enemy scaling, weapon timing, costs and planning, as ${sdkFacts.formulas} callable functions.`
				},
				{
					href: '/docs/formatting/',
					label: 'Formatting',
					body: 'Read and write numbers the way the game does — 18.759M, 4.77T — plus durations, multipliers and rates.'
				}
			]
		},
		{
			title: 'Build a tool',
			pages: [
				{
					href: '/docs/builders/',
					label: 'Builders',
					body: `${spelled(sdkFacts.builders).replace('f', 'F')} builders that describe their own inputs, so a form, a command and a test come from one place.`
				},
				{
					href: '/docs/save/',
					label: 'Save Files',
					body: "Decode tool_export.json and read a player's runs, research, cards, modules, bots and vault."
				},
				{
					href: '/docs/charts/',
					label: 'Charts',
					body: 'Forty-six ready-made datasets, each resolving to a finished table you can render any way you like.'
				}
			]
		},
		{
			title: 'Reach other surfaces',
			pages: [
				{
					href: '/docs/wasm/',
					label: 'Any Language',
					body: 'Run the package from Python, Rust, Go or C# through one WebAssembly file — the same code, no port and no server.'
				},
				{
					href: '/docs/sheets/',
					label: 'Spreadsheets',
					body: 'Read a Google Sheet and write catalogs into one, as values or as live formulas.'
				},
				{
					href: '/docs/bots/',
					label: 'Discord Bots',
					body: 'Every calculator as a slash command, with a complete discord.js integration.'
				},
				{
					href: '/docs/wiki/',
					label: 'Wiki',
					body: "Community wiki pages as Markdown, so a mechanic's description sits beside its numbers."
				}
			]
		},
		{
			title: 'Knowledge and assistants',
			pages: [
				{
					href: '/docs/knowledge/',
					label: 'Knowledge Graph',
					body: `${sdkFacts.graphNodes} mechanics, typed relationships, and ${grouped(sdkFacts.graphClaims)} claims that each name their source and date.`
				},
				{
					href: '/docs/patch-notes/',
					label: 'Patch Notes',
					body: 'Five years of developer announcements, searchable by text, version or date.'
				},
				{
					href: '/docs/mcp/',
					label: 'MCP & Oracles',
					body: 'Register the built-in server so your editor can query real exports, saves and mechanics.'
				},
				{
					href: '/docs/towerai/',
					label: 'TowerAI',
					body: 'Build an assistant that answers from a knowledge base you curate, including getting a model key.'
				}
			]
		}
	] as const;
</script>

<h1 class="text-3xl font-semibold">Documentation</h1>
<p class="mt-3 max-w-2xl text-muted">
	Every page is a walkthrough with runnable examples. If you are new, install the package and read
	Game Data — that pair is enough to build a calculator.
</p>

<div class="mt-10 space-y-10">
	{#each sections as section (section.title)}
		<section>
			<h2 class="text-xl font-semibold">{section.title}</h2>
			<div class="mt-4 grid gap-4 md:grid-cols-2">
				{#each section.pages as page (page.href)}
					<a href={href(page.href)} class="tool-card lift">
						<h3 class="text-lg font-medium">{page.label}</h3>
						<p class="mt-2 text-sm text-muted">{page.body}</p>
					</a>
				{/each}
			</div>
		</section>
	{/each}
</div>

<p class="mt-10 text-sm">
	<a href={href('/start/')}>Guided Get Started →</a>
	·
	<a href={href('/playground/')}>Runnable Examples →</a>
	·
	<a href={href('/tools/')}>What You Can Build →</a>
</p>
