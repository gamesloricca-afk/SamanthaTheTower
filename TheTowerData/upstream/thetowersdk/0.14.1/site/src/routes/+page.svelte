<script lang="ts">
	import {
		adbBridgeSnippet,
		chartSnippet,
		features,
		homeExamples,
		sheetBuildSnippet,
		sheetFormulaSnippet,
		runTrackerSnippet,
		askDemoSnippet,
		SHOW_GOVERNANCE
	} from '$lib/content';
	import { INSTALL_CMD, LINKS } from '$lib/links';
	import { asset, href } from '$lib/paths';
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import GithubButton from '$lib/ui/GithubButton.svelte';
	import HeroCarousel from '$lib/ui/HeroCarousel.svelte';
	import GlassPanel from '$lib/ui/GlassPanel.svelte';
	import InstallCmd from '$lib/ui/InstallCmd.svelte';
	import LabsDemo from '$lib/demos/LabsDemo.svelte';
	import SyncUptimeDemo from '$lib/demos/SyncUptimeDemo.svelte';
	import WaveDemo from '$lib/demos/WaveDemo.svelte';
	import SaveDemo from '$lib/demos/SaveDemo.svelte';
	import CostTableDemo from '$lib/demos/CostTableDemo.svelte';
	import AskDemo from '$lib/demos/AskDemo.svelte';
	import RunTrackerDemo from '$lib/demos/RunTrackerDemo.svelte';

	let { data } = $props();

	/**
	 * Generated artwork behind the hero.
	 *
	 * Produced by `scripts/prepare-art.mjs`, which crops the generator's "Made with AI" badge
	 * out of the source and re-encodes to WebP — 1029 KB PNG down to 43 KB. The badge is removed
	 * from the pixels rather than hidden by the crop, because `object-fit: cover` trims the top at
	 * wide viewports but the sides at narrow ones, so a CSS-only fix would have shown it on phones
	 * and nowhere else.
	 *
	 * This replaced a gameplay screenshot that was the wrong source twice over: portrait, so cover
	 * only ever showed a band through its middle, and busy enough that its own UI text stayed
	 * legible behind the headline.
	 *
	 * The `onerror` handler drops the element if the file is ever missing, so the hero falls back to
	 * its gradient stage instead of showing a broken image.
	 */
	const HERO_IMAGE = '/hero-art.webp';

	/**
	 * How many `feature-N.webp` tiles `scripts/prepare-art.mjs` writes.
	 *
	 * The script prints this number when it finishes; it must match, or the cycle points at a tile
	 * that does not exist and those sections lose their backdrop with nothing to indicate why.
	 */
	const ART_TILE_COUNT = 8;

	/**
	 * The backdrop for one section, as a custom property for `.section-art`.
	 *
	 * The page has more sections than there are tiles, so the set repeats down the page — which is
	 * the intent, not a shortfall: the art is a continuous backdrop, and a reader scrolling past
	 * section nine is nowhere near section three when it comes round again.
	 *
	 * Numbered by hand at each call site rather than counted automatically, because the sections are
	 * written out individually and a `{#each}` over them would flatten prose that is deliberately
	 * not uniform. Sequence gaps are harmless: any integer maps onto a tile.
	 */
	const sectionArt = (n: number) =>
		`--section-art: url(${asset(`/feature-${(n % ART_TILE_COUNT) + 1}.webp`)})`;

	const demos = [
		{ title: homeExamples[0].title, blurb: homeExamples[0].blurb, Demo: LabsDemo, panel: 'Live' },
		{
			title: homeExamples[1].title,
			blurb: homeExamples[1].blurb,
			Demo: SyncUptimeDemo,
			panel: 'Live'
		},
		{ title: homeExamples[2].title, blurb: homeExamples[2].blurb, Demo: WaveDemo, panel: 'Live' }
		// "Read a save" lives in the Save files section below, not here.
	] as const;

	/**
	 * Everything installable that pairs with the SDK, in the order you'd reach for it.
	 *
	 * `action` exists because the commands are not the same shape: two are
	 * libraries you add as dependencies, one registers a server that already
	 * ships in the package, and adb-bridge is a program the player runs rather
	 * than a dependency of your project.
	 */
	const installables = [
		{
			title: 'TheTowerSDK',
			role: 'Required',
			action: 'Add to your project',
			body: 'Game catalogs, save reading, formulas, charts, and wiki ingestion for Node and browsers. Catalogs and formulas run locally; account imports accept only official game JSON exports. Wiki integrations use network access.',
			command: INSTALL_CMD,
			docsHref: href('/docs/install/'),
			docsLabel: 'Install Docs'
		},
		{
			title: 'TowerAI',
			role: 'Optional',
			action: 'Add to your project',
			// Says up front that it needs a model key, which is the part a reader hits after installing.
			body: 'The assistant core: fill its knowledge base with the mechanics you care about and it answers from your curation. You supply a model to generate the wording — Groq has a free tier, and the docs walk through getting a key.',
			command: 'npm install towerai',
			docsHref: href('/docs/towerai/'),
			docsLabel: 'TowerAI Docs'
		},
		{
			title: 'MCP Server',
			role: 'Ships with the SDK',
			/*
			 * The command is Claude Code's. Cursor and Copilot register the same server through a
			 * JSON config file instead, so the action says which tool this line is for and the docs
			 * link carries the config for the others — a reader on Cursor otherwise copies a command
			 * their editor does not have.
			 */
			action: 'Register once — Claude Code',
			body: 'Already inside the package, so there is nothing extra to install. Once registered, your assistant gains thirty-seven tools — running the shipped calculators for real numbers, an instrumented sandbox to work in, save decoding, wiki lookup, and tracing to check its own output. Using Cursor or Copilot? The MCP docs have the JSON config.',
			command: 'claude mcp add thetowersdk -- node ./node_modules/thetowersdk/mcp/server.mjs',
			docsHref: href('/docs/mcp/'),
			docsLabel: 'MCP Docs'
		},
		{
			title: 'adb-bridge',
			role: 'Optional',
			action: 'Run on the player’s machine',
			body: 'A standalone program, not a dependency, so it runs straight from npx. Pulls a real save from an Android device, an emulator, or the native Mac build and serves it locally.',
			command: 'npx adb-bridge',
			docsHref: href('/docs/save/'),
			docsLabel: 'Save File Docs'
		}
	] as const;
</script>

<!--
	The hero is a full-bleed stage, not a block in the content column.

	Every previous attempt at "make this pop" adjusted colour inside the same narrow centered column,
	which is why none of them changed the impression the page makes. The first screen now belongs to
	the hero: it runs edge to edge, stands nearly a full viewport tall, and rotates through several
	answers to what the package is for.

	`HERO_IMAGE` is the one piece that is not authored here — see the note on the constant.
-->
<!--
	`-mt-10` cancels the `py-10` on `<main>` in the layout.

	`full-bleed` only escapes the horizontal gutter, so the hero still sat below main's top padding —
	a 43px band of page colour between the header and the artwork. Measuring the backdrop against its
	own section says nothing about this; the section itself was the thing being pushed down.
-->
<section class="hero-stage-section full-bleed -mt-10">
	{#if HERO_IMAGE}
		<img
			src={asset(HERO_IMAGE)}
			alt=""
			class="hero-backdrop"
			onerror={(event) => event.currentTarget.remove()}
		/>
	{/if}
	<div class="hero-scrim"></div>

	<div class="relative mx-auto flex max-w-3xl flex-col px-4 pt-14 pb-16 text-center sm:pt-20">
		<!--
			The brand lockup: the mark, with the wordmark riding up over its lower edge.

			The overlap is the point — a logo with a caption underneath reads as two separate things,
			while an overlap reads as one mark. It is done with a negative margin rather than absolute
			positioning so the pair still occupies its own height and the carousel below cannot
			collide with it at any viewport.
		-->
		<div class="hero-lockup">
			<img
				src={asset('/TheTowerSDK_logo.v5.png')}
				alt=""
				class="mx-auto h-24 w-24 object-contain drop-shadow-[0_0_34px_rgba(61,155,253,0.45)] sm:h-32 sm:w-32"
				width="128"
				height="128"
			/>
			<p class="hero-wordmark">TheTowerSDK</p>
		</div>

		<!--
			Buttons and install command are passed into the carousel rather than placed after it, so
			its arrows and dots render beneath the whole hero instead of between the headline and its
			call to action.
		-->
		<div class="mt-6">
			<HeroCarousel>
				<div class="mt-2 flex flex-wrap justify-center gap-3">
					<a href={href('/start/')} class="btn-primary rounded-md px-4 py-2 font-semibold">
						Get Started
					</a>
					<!-- Same order as the header nav: Examples before Docs. -->
					<a href={href('/playground/')} class="btn-secondary rounded-md px-4 py-2 font-medium">
						Examples
					</a>
					<a href={href('/docs/')} class="btn-secondary rounded-md px-4 py-2 font-medium">Docs</a>
					<GithubButton href={LINKS.github} />
				</div>

				<div class="mt-6 flex justify-center">
					<InstallCmd />
				</div>
			</HeroCarousel>
		</div>
	</div>
</section>

<!--
	The counts get a full-width band rather than another entry in the column.

	They are the page's one piece of hard evidence — the reader's first question is "how much is
	actually in here", and the answer deserves to interrupt the layout instead of scrolling past as
	a fourth identical section. It also breaks the long single column, which is what made the page
	read as flat.
-->
<!--
	No top margin: this band sits directly against the hero.

	Two full-bleed bands with a margin between them leave a strip of page colour showing through,
	which reads as a gap under the hero artwork rather than as spacing. Both bands run edge to edge,
	so they should meet edge to edge; the breathing room comes from their own padding.
-->
<section class="stat-band section-art full-bleed border-b border-line" style={sectionArt(10)}>
	<div class="mx-auto max-w-6xl px-4 py-14">
		<h2 class="text-center text-2xl font-semibold">What's In The Package</h2>
		<p class="mx-auto mt-2 max-w-2xl text-center text-muted">
			Counts from the installed package — including the detailed pieces inside each system.
		</p>
		<div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
			{#each data.packageContents as item (item.label)}
				<div class="stat-tile lift rounded-lg border border-line/80 px-4 py-5 text-center">
					<p class="font-mono text-3xl font-semibold text-gold">{item.value}</p>
					<p class="mt-1 text-sm text-muted">{item.label}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="section-rule section-art mt-16" style={sectionArt(0)}>
	<h2 class="text-2xl font-semibold">What You Get</h2>
	<div class="mt-6 grid gap-4 md:grid-cols-2">
		<!-- Whole card is the link, same as the cards on What You Can Build. -->
		{#each features as feature (feature.title)}
			<a href={href(feature.docs)} class="tool-card lift">
				<h3 class="text-lg font-medium">{feature.title}</h3>
				<p class="mt-2 text-muted">{feature.body}</p>
			</a>
		{/each}
	</div>
</section>

<section class="section-rule section-art mt-16" style={sectionArt(1)}>
	<h2 class="text-2xl font-semibold">Examples</h2>
	<div class="mt-6 space-y-8">
		{#each demos as demo, i (demo.title)}
			{@const example = homeExamples[i]}
			{@const Demo = demo.Demo}
			<div>
				<h3 class="text-lg font-medium">{demo.title}</h3>
				<p class="mt-1 mb-4 text-sm text-muted">{demo.blurb}</p>
				<div class="grid gap-4 lg:grid-cols-2">
					<GlassPanel>
						<p class="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">
							{demo.panel}
						</p>
						<svelte:boundary>
							{#snippet failed(error)}
								<p class="text-sm text-muted">
									Demo failed to load
									{#if error instanceof Error}
										({error.message})
									{/if}
									.
								</p>
							{/snippet}
							<Demo />
						</svelte:boundary>
					</GlassPanel>
					<GlassPanel>
						<p class="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">Code</p>
						{#if example}
							<CodeBlock code={example.code} />
						{/if}
					</GlassPanel>
				</div>
			</div>
		{/each}
	</div>
	<p class="mt-4 text-sm"><a href={href('/playground/')}>More Examples →</a></p>
</section>

<section class="section-rule section-art mt-16" style={sectionArt(2)}>
	<h2 class="text-2xl font-semibold">Tracking Runs</h2>
	<p class="mt-2 max-w-2xl text-muted">
		The game stores a battle report for every completed run.
		<code>listImportableBattleRuns</code> hands back those entries as they were recorded — tier, wave,
		duration, coins, timestamp, damage breakdowns, what killed you — so a run tracker is a table over
		them plus whatever totals matter to you. Coins per hour falls out of duration and coins, which is
		why most trackers start there.
	</p>
	<div class="mt-6 grid gap-4 lg:grid-cols-2">
		<GlassPanel>
			<p class="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">Sample</p>
			<svelte:boundary>
				{#snippet failed(error)}
					<p class="text-sm text-muted">
						Demo failed to load{#if error instanceof Error}
							({error.message}){/if}.
					</p>
				{/snippet}
				<RunTrackerDemo />
			</svelte:boundary>
		</GlassPanel>
		<GlassPanel>
			<p class="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">Code</p>
			<CodeBlock code={runTrackerSnippet} />
		</GlassPanel>
	</div>
	<p class="mt-4 text-sm"><a href={href('/docs/save/')}>Save File Docs →</a></p>
</section>

<section class="section-rule section-art mt-16" style={sectionArt(3)}>
	<h2 class="text-2xl font-semibold">Reading Save Files</h2>
	<p class="mt-2 max-w-2xl text-muted">
		<code>tool_export.json</code> holds a player's whole account: research, modules, cards, ultimate weapons,
		vault, and every run the game kept. Decode it once, then run as many extractors over the result as
		you like — each returns typed values you can drop straight into a tracker. The decoded object stays
		available too, so any field is reachable.
	</p>
	<div class="mt-6 grid gap-4 lg:grid-cols-2">
		<GlassPanel>
			<p class="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">Sample</p>
			<svelte:boundary>
				{#snippet failed(error)}
					<p class="text-sm text-muted">
						Demo failed to load{#if error instanceof Error}
							({error.message}){/if}.
					</p>
				{/snippet}
				<SaveDemo />
			</svelte:boundary>
		</GlassPanel>
		<GlassPanel>
			<p class="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">Code</p>
			<CodeBlock code={homeExamples[3].code} />
		</GlassPanel>
	</div>
	<p class="mt-4 text-sm"><a href={href('/docs/save/')}>Save File Docs →</a></p>
</section>

<section class="section-rule section-art mt-16" style={sectionArt(4)}>
	<h2 class="text-2xl font-semibold">Pulling Saves Automatically</h2>
	<p class="mt-2 max-w-2xl text-muted">
		Getting the file off the device is a separate job from reading it.
		<a href={LINKS.adbBridge}>adb-bridge</a> locates the save and serves it to your page over a local
		WebSocket — from an Android phone or emulator over ADB, or from the native Mac App Store build straight
		out of its app container. Ask it to watch and it re-sends on every write, so a tracker updates while
		the player plays.
	</p>
	<div class="mt-6 grid gap-4 lg:grid-cols-2">
		<GlassPanel>
			<h3 class="text-lg font-medium">How It Works</h3>
			<ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
				<li>
					The player runs <code>npx adb-bridge</code>. On Android it installs Google's
					platform-tools on first run if <code>adb</code> is missing.
				</li>
				<li>
					It finds the save: a connected device or emulator over ADB, or on macOS the local app
					container under <code>~/Library/Containers</code> — no device and no ADB needed.
				</li>
				<li>
					Your page connects to <code>127.0.0.1</code> and receives the bytes — no upload, no file picker.
				</li>
				<li>You decode those bytes exactly as you would a file read from disk.</li>
			</ol>
			<p class="mt-3 text-sm text-muted">
				Reads only, no root, and one install covers multiple games.
			</p>
		</GlassPanel>
		<GlassPanel>
			<p class="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">Code</p>
			<CodeBlock code={adbBridgeSnippet} />
		</GlassPanel>
	</div>
	<div class="mt-4">
		<InstallCmd command="npx adb-bridge" showVersion={false} />
	</div>
	<p class="mt-4 text-sm">
		<a href={href('/docs/save/')}>Save File Docs →</a>
		·
		<a href={LINKS.adbBridge}>adb-bridge →</a>
	</p>
</section>

<!--
	Charts sits after the data sections, not between them.

	Runs, saves and pulling saves are all "where the numbers come from"; charts, spreadsheets and
	bots are all "what you do with them once you have them". Charts used to split the first group
	in half, which made the page read as a list of features rather than a path through one.
-->
<section class="section-rule section-art mt-16" style={sectionArt(5)}>
	<h2 class="text-2xl font-semibold">Charts</h2>
	<p class="mt-2 max-w-2xl text-muted">
		Every catalog entry with a level progression is a series, which covers
		<span class="font-mono text-gold">{data.chartableSeries}</span> of them across labs, workshop, cards,
		ultimate weapons, bots and guardians. Add rows to the data and every view regenerates — no image to
		redraw by hand. Below, that generator renders a cost table as an image.
	</p>
	<div class="mt-6 grid gap-4 lg:grid-cols-2">
		<GlassPanel>
			<p class="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">Live</p>
			<svelte:boundary>
				{#snippet failed(error)}
					<p class="text-sm text-muted">
						Demo failed to load{#if error instanceof Error}
							({error.message}){/if}.
					</p>
				{/snippet}
				<CostTableDemo />
			</svelte:boundary>
		</GlassPanel>
		<GlassPanel>
			<p class="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">Code</p>
			<CodeBlock code={chartSnippet} />
		</GlassPanel>
	</div>
	<p class="mt-4 text-sm"><a href={href('/docs/charts/')}>Charts Docs →</a></p>
</section>

<section class="section-rule section-art mt-16" style={sectionArt(6)}>
	<h2 class="text-2xl font-semibold">Building Spreadsheets</h2>
	<p class="mt-2 max-w-2xl text-muted">
		The catalogs are already rows and columns, so a planning sheet can be generated rather than
		maintained by hand — every lab, level and cost written into the grid and rebuilt when the game
		changes.
	</p>
	<div class="mt-6 grid gap-4 lg:grid-cols-2">
		<GlassPanel>
			<h3 class="text-lg font-medium">Generate The Data</h3>
			<p class="mt-2 text-sm text-muted">
				Flatten a catalog into rows and write them to CSV, xlsx, or the Google Sheets API.
			</p>
			<div class="mt-3">
				<CodeBlock code={sheetBuildSnippet} />
			</div>
		</GlassPanel>
		<GlassPanel>
			<h3 class="text-lg font-medium">Generate The Formulas</h3>
			<p class="mt-2 text-sm text-muted">
				Write real spreadsheet formulas into the cells, so the sheet keeps calculating as its reader
				changes inputs. The sheet oracle evaluates any formula in place and returns what it
				computes.
			</p>
			<div class="mt-3">
				<CodeBlock code={sheetFormulaSnippet} />
			</div>
			<p class="mt-3 text-sm">
				<a href={href('/docs/mcp/')}>Sheet Oracle Setup →</a>
			</p>
		</GlassPanel>
	</div>
</section>

<section class="section-rule section-art mt-16" style={sectionArt(7)}>
	<h2 class="text-2xl font-semibold">Building Bots</h2>
	<p class="mt-2 max-w-2xl text-muted">
		The package is framework-agnostic, so a bot imports the same catalogs and formulas a website
		does. The Run Tracker ships three Discord bots built this way.
	</p>
	<div class="mt-6 grid gap-4 lg:grid-cols-2">
		<GlassPanel>
			<h3 class="text-lg font-medium">One Calculation Layer</h3>
			<p class="mt-2 text-sm text-muted">
				Parsing, cost math and run shapes live in the package; embeds, components and modals stay in
				the bot. A command answers with the same number the site shows, because it is the same
				function.
			</p>
		</GlassPanel>
		<GlassPanel>
			<h3 class="text-lg font-medium">Interaction Conventions</h3>
			<p class="mt-2 text-sm text-muted">
				One router, a single owner for component ids, ownership filtered by user as well as id, and
				token guards before state is touched.
			</p>
			<p class="mt-3 text-sm">
				<a href={href('/docs/bots/')}>Building A Bot →</a>
			</p>
		</GlassPanel>
	</div>
</section>

{#snippet assistantTooling()}
	<!--
		Full-bleed via `full-bleed`, not `w-screen`: `100vw` counts the scrollbar gutter, so on any
		platform that reserves one the band ran ~15px wider than the viewport and the page scrolled
		sideways. The utility measures the container instead.
	-->
	<!--
		The assistant band gets artwork like every other section.

		It was the one section left on flat panel colour, which made it read as a hole in the run of
		backdrops rather than as a deliberate change of surface. `bg-panel/70` is dropped in favour of
		the band's own tint so the art is not sitting behind an opaque fill.
	-->
	<section
		class="section-art full-bleed mt-16 border-y border-line bg-sunken"
		style={sectionArt(9)}
	>
		<div class="mx-auto max-w-6xl px-4 py-14">
			<p class="text-xs font-semibold tracking-[0.18em] text-gold uppercase">Optional</p>
			<h2 class="mt-2 text-3xl font-semibold">Build With An Assistant</h2>
			<p class="mt-4 max-w-3xl text-muted">
				Register the MCP server and your editor's assistant can query the catalogs, decode a save,
				look up a mechanic on the wiki, and read a live community spreadsheet while it writes your
				tool.
			</p>
			<div class="mt-8 grid gap-4 md:grid-cols-2">
				<GlassPanel>
					<h3 class="text-lg font-medium">MCP Server</h3>
					<p class="mt-2 text-sm text-muted">
						Thirty-seven tools for Cursor, Claude or Copilot. It can run the shipped calculators and
						get the real number, work in an instrumented sandbox, and trace what it produced.
						<code>list_exports</code> and <code>describe_schema</code> for the API,
						<code>decode_save</code> for a real account, <code>wiki_page</code> for mechanics, and
						<code>sdk_graph_render</code> for a Mermaid diagram.
					</p>
				</GlassPanel>
				<GlassPanel>
					<h3 class="text-lg font-medium">The Tower Oracle</h3>
					<p class="mt-2 text-sm text-muted">
						A knowledge graph of game mechanics and how they interact.
						<code>oracle_traps</code> returns the known ways a mechanic has been misread,
						<code>oracle_expand</code> resolves acronyms from a closed set, and
						<code>oracle_contradictions</code> lists disagreeing claims ranked by source authority.
					</p>
				</GlassPanel>
				<GlassPanel>
					<h3 class="text-lg font-medium">The Sheet Oracle</h3>
					<p class="mt-2 text-sm text-muted">
						Reads a live community spreadsheet through MCP. <code>eval_formula</code> evaluates a
						formula in the sheet and returns what it computes; <code>list_lambdas</code> gives the named
						functions and their parameter order.
					</p>
				</GlassPanel>
				<!--
					The fourth card is another source the assistant can reach, matching the three beside it:
					the MCP server is the transport, the two oracles are curated knowledge, and this is the
					community's own writing. An earlier version put a save-decoder card here purely to even
					the grid, which only repeated `decode_save` and `describe_schema` from the MCP card.
				-->
				<GlassPanel>
					<h3 class="text-lg font-medium">The Wiki</h3>
					<p class="mt-2 text-sm text-muted">
						<code>wiki_search</code> finds the page for a mechanic and <code>wiki_page</code> returns
						it as Markdown, so an assistant can read how something behaves in the community's own words
						while it writes against the catalogs.
					</p>
				</GlassPanel>
				{#if SHOW_GOVERNANCE}
					<GlassPanel>
						<h3 class="text-lg font-medium">ACS</h3>
						<p class="mt-2 text-sm text-muted">
							Agentic Cognition Substrate directs how an assistant works on your project: research
							before code, a checkpoint per slice, and a status that reaches “done” only when you
							say so.
						</p>
					</GlassPanel>
				{/if}
			</div>

			<h3 class="mt-12 text-2xl font-semibold">Build Your Own TowerAI</h3>
			<p class="mt-3 max-w-3xl text-muted">
				<code>towerai</code> is the TowerAI assistant core, published alongside this package. Install
				it, fill its knowledge base with the mechanics you care about, and it answers from your curation.
				Chunks hold prose for meaning while catalogs supply the numbers, so costs never go stale inside
				a sentence.
			</p>
			<div class="mt-6 grid gap-4 lg:grid-cols-2">
				<GlassPanel>
					<p class="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">Live</p>
					<svelte:boundary>
						{#snippet failed(error)}
							<p class="text-sm text-muted">
								Demo failed to load{#if error instanceof Error}
									({error.message}){/if}.
							</p>
						{/snippet}
						<AskDemo />
					</svelte:boundary>
				</GlassPanel>
				<GlassPanel>
					<p class="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">Code</p>
					<CodeBlock code={askDemoSnippet} />
				</GlassPanel>
			</div>
			<div class="mt-4">
				<InstallCmd command="npm install towerai" showVersion={false} />
			</div>

			<div class="mt-8 flex flex-wrap gap-3">
				<a href={href('/docs/mcp/')} class="btn-primary rounded-md px-4 py-2 font-semibold">
					MCP &amp; Oracles
				</a>
				<a href={href('/docs/towerai/')} class="btn-secondary rounded-md px-4 py-2 font-medium">
					TowerAI Docs
				</a>
				<a href={href('/docs/knowledge/')} class="btn-secondary rounded-md px-4 py-2 font-medium">
					Knowledge Graph
				</a>
				{#if SHOW_GOVERNANCE}
					<a href={href('/ai/')} class="btn-secondary rounded-md px-4 py-2 font-medium">
						AI &amp; ACS Guide
					</a>
					<a href={href('/docs/ags/')} class="btn-secondary rounded-md px-4 py-2 font-medium">
						ACS Docs
					</a>
				{/if}
			</div>
		</div>
	</section>
{/snippet}

<!--
	Assistant tooling comes after everything the package actually is.

	Everything above is the game's own numbers — catalogs, formulas, saves — which is what someone
	installs this for. The assistant layer is genuinely useful and genuinely the least objective
	thing here, so it reads as the bell and whistle it is rather than the headline.
-->
{@render assistantTooling()}

<section class="section-rule section-art mt-16" style={sectionArt(8)}>
	<h2 class="text-2xl font-semibold">Install</h2>
	<p class="mt-2 max-w-2xl text-muted">
		Everything on this page, and what each piece is for. Only the first is required.
	</p>
	<div class="mt-6 grid gap-4 md:grid-cols-2">
		{#each installables as item (item.command)}
			<GlassPanel>
				<div class="flex items-baseline justify-between gap-3">
					<h3 class="text-lg font-medium">{item.title}</h3>
					<span class="shrink-0 text-xs tracking-wide text-muted uppercase">{item.role}</span>
				</div>
				<p class="mt-2 text-sm text-muted">{item.body}</p>
				<p class="mt-3 text-xs font-semibold tracking-wide text-accent uppercase">{item.action}</p>
				<div class="mt-1.5">
					<InstallCmd command={item.command} showVersion={false} />
				</div>
				<p class="mt-3 text-sm"><a href={item.docsHref}>{item.docsLabel} →</a></p>
			</GlassPanel>
		{/each}
	</div>
</section>

<!-- The tracker closes the page: the last thing a reader sees is the SDK in production. -->
<!-- `-mb-10` cancels main's bottom padding, the same band as the hero's — see the note there. -->
<section class="closer full-bleed mt-16 -mb-10 border-t border-line">
	<div class="mx-auto max-w-6xl px-4 py-16 text-center">
		<p class="text-xs font-semibold tracking-[0.18em] text-gold uppercase">In Production</p>
		<h2 class="mt-2 text-3xl font-semibold">Flagship Demonstration</h2>
		<p class="mx-auto mt-3 max-w-2xl text-muted">
			<a href={LINKS.tracker}>The Tower Run Tracker</a> is a full suite of calculators and trackers built
			on TheTowerSDK — the same catalogs, formulas and save readers documented above, running against
			real accounts.
		</p>
		<div class="mt-7 flex flex-wrap justify-center gap-3">
			<a href={LINKS.tracker} class="btn-primary rounded-md px-4 py-2 font-semibold">
				Open The Tower Run Tracker
			</a>
			<a href={href('/tools/')} class="btn-secondary rounded-md px-4 py-2 font-medium">
				What You Can Build
			</a>
			<GithubButton href={LINKS.github} />
		</div>
	</div>
</section>
