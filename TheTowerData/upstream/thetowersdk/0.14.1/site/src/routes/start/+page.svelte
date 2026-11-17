<script lang="ts">
	import { mcpJson, SHOW_GOVERNANCE } from '$lib/content';
	import { INSTALL_CMD, LINKS } from '$lib/links';
	import { href } from '$lib/paths';
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import GlassPanel from '$lib/ui/GlassPanel.svelte';
</script>

<p class="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Start</p>
<h1 class="mt-2 text-3xl font-semibold">Get Started</h1>
<p class="mt-2 max-w-2xl text-muted">
	Install the package, point your assistant at the MCP server, and start from a working example.
	Catalogs and formulas work without keys or an account. Official game exports are parsed locally; optional integrations may use network access.
</p>

<div class="mt-8 max-w-3xl space-y-10">
	<section>
		<h2 class="text-xl font-medium">1. Install TheTowerSDK</h2>
		<p class="mt-2 text-sm text-muted">Use the official game export for account imports. See the <a href={href('/docs/install/')}>installation guide</a>.</p>
		<p class="mt-2 text-sm text-muted">
			Add the package to your app or tool repo. Pin a version when you want frozen game numbers.
		</p>
		<div class="mt-3">
			<CodeBlock code={INSTALL_CMD} />
		</div>
		<p class="mt-2 text-sm text-muted">
			Package:
			<a href={LINKS.npm}>npmjs.com/package/thetowersdk</a>
			· source:
			<a href={LINKS.github}>GitHub</a>
		</p>
	</section>

	<section>
		<h2 class="text-xl font-medium">2. Register The MCP Server</h2>
		<p class="mt-2 text-sm text-muted">
			Point Cursor, Claude Code, or Copilot at the package MCP server. Your assistant can then list
			exports, read catalogs, decode saves, plan Effective Paths, and pull wiki pages while it
			works.
		</p>
		<div class="mt-3">
			<CodeBlock code={mcpJson} />
		</div>
		<p class="mt-2 text-sm text-muted">
			Put that under your editor’s MCP config (for example Cursor
			<code>.mcp.json</code>
			or the IDE MCP settings). Restart the IDE MCP session after saving. Docs:
			<a href={href('/docs/mcp/')}>MCP &amp; AI</a>.
		</p>
	</section>

	{#if SHOW_GOVERNANCE}
		<section>
			<!-- Unnumbered: the numbered steps must stay 1–5 whether or not this section renders. -->
			<h2 class="text-xl font-medium">Optional — Agentic Cognition Substrate (ACS)</h2>
			<p class="mt-2 text-sm text-muted">
				ACS governs how an AI may change your repo (commits, staging, status). Use it when you want
				structured AI development on Tower tools. TheTowerSDK is the game layer; ACS is the workflow
				layer.
			</p>
			<ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
				<li>
					Overview:
					<a href={LINKS.agsSite}>Agentic Cognition Substrate site</a>
				</li>
				<li>
					How it fits with this package:
					<a href={href('/docs/ags/')}>ACS docs</a>
					·
					<a href={href('/ai/')}>AI &amp; ACS</a>
				</li>
				<li>
					Tower players can request a personal grant with an in-game Player ID:
					<a href={href('/license/')}>Player license</a>
				</li>
			</ul>
		</section>
	{/if}

	<section>
		<h2 class="text-xl font-medium">3. Explore The Examples</h2>
		<p class="mt-2 text-sm text-muted">
			Every example on this site runs against the installed package. Open one, copy it, and change
			the inputs — the numbers move because they come from the catalogs, not from a fixture.
		</p>
		<ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
			<li><a href={href('/playground/')}>Examples</a> — runnable snippets, grouped by task</li>
			<li>
				<a href={href('/tools/')}>What You Can Build</a> — finished tool shapes, each linked to its docs
			</li>
			<li><a href={href('/docs/')}>Docs</a> — the full reference, one page per area</li>
		</ul>
	</section>

	<section>
		<h2 class="text-xl font-medium">4. Official Exports From a Device (optional)</h2>
		<p class="mt-2 text-sm text-muted">
			First tap your Player ID five times in the game to create your first export and reveal the export controls. For subsequent exports, use Settings → Toggles → External Tools Export → Manual Export or enable Auto Export for External Tools. Android path:
			<code>Android/data/com.TechTreeGames.TheTower/files/tool_export.json</code>.
			<a href={LINKS.adbBridge}>adb-bridge</a>
			can copy it from a device or emulator. Decode with
			<code>thetowersdk/node</code>, then extractors in
			<code>thetowersdk/save</code>.
		</p>
	</section>

	<section>
		<h2 class="text-xl font-medium">5. What You Can Add Alongside It</h2>
		<p class="mt-2 text-sm text-muted">
			None of these are dependencies. Catalogs and formulas work offline without keys; account imports use the official game JSON export. Each of
			these adds one capability it deliberately does not carry itself.
		</p>

		<div class="mt-4 space-y-4">
			<GlassPanel>
				<h3 class="font-medium">TowerAI — an assistant that answers from a knowledge base</h3>
				<p class="mt-2 text-sm text-muted">
					<code>npm install towerai</code>. The SDK holds the numbers; TowerAI does retrieval over a
					knowledge base you curate and prompts a model with what it found, so answers cite
					something instead of being invented. You bring the model key — a free one from
					<a href="https://console.groq.com" rel="noreferrer">console.groq.com</a>
					is enough to run it.
				</p>
				<p class="mt-3 text-sm">
					<a href={href('/docs/towerai/')}>TowerAI docs →</a>
					·
					<a href={LINKS.towerai}>GitHub</a>
					·
					<a href={LINKS.towerAiNpm}>npm</a>
				</p>
			</GlassPanel>

			<GlassPanel>
				<h3 class="font-medium">adb-bridge — read a save off a phone or emulator</h3>
				<p class="mt-2 text-sm text-muted">
					<code>npx adb-bridge</code>. The SDK decodes save bytes; getting those bytes off an
					Android device is a separate job, and this is it. Your users run it on their own machine —
					it is not a dependency of your project, and nothing about it ships to them through you.
				</p>
				<p class="mt-3 text-sm">
					<a href={href('/docs/save/')}>Save docs →</a>
					·
					<a href={LINKS.adbBridge}>GitHub</a>
					·
					<a href={LINKS.adbBridgeNpm}>npm</a>
				</p>
			</GlassPanel>

			<GlassPanel>
				<h3 class="font-medium">discord.js — every calculator as a slash command</h3>
				<p class="mt-2 text-sm text-muted">
					<code>thetowersdk/bot</code> turns the builders into commands and replies and never
					touches a Discord client, so it is transport-agnostic. Add
					<code>discord.js</code> when you want those commands on a server.
				</p>
				<p class="mt-3 text-sm"><a href={href('/docs/bots/')}>Discord bot docs →</a></p>
			</GlassPanel>

			<GlassPanel>
				<h3 class="font-medium">google-auth-library — read and write spreadsheets</h3>
				<p class="mt-2 text-sm text-muted">
					<code>thetowersdk/sheets</code> takes a transport you supply and imports no Google library itself,
					so nothing about your auth is assumed. For an unattended tool, a service account is the identity
					to use.
				</p>
				<p class="mt-3 text-sm"><a href={href('/docs/sheets/')}>Spreadsheet docs →</a></p>
			</GlassPanel>
		</div>
	</section>

	<section>
		<h2 class="text-xl font-medium">6. Ready To Build</h2>
		<div class="mt-3 grid gap-4 sm:grid-cols-2">
			<GlassPanel>
				<h3 class="font-medium">Examples</h3>
				<p class="mt-2 text-sm text-muted">Interactive demos and sample imports.</p>
				<p class="mt-3 text-sm"><a href={href('/playground/')}>Open Examples →</a></p>
			</GlassPanel>
			<GlassPanel>
				<h3 class="font-medium">Example Product</h3>
				<p class="mt-2 text-sm text-muted">
					<a href={LINKS.tracker}>The Tower Run Tracker</a>
					ships calculators and trackers on this package.
				</p>
				<p class="mt-3 text-sm"><a href={href('/tools/')}>What You Can Build →</a></p>
			</GlassPanel>
		</div>
	</section>
</div>
