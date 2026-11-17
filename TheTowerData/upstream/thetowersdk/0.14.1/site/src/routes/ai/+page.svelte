<script lang="ts">
	import { adbBridgeSnippet, agentPrompts, mcpJson } from '$lib/content';
	import { INSTALL_CMD, LINKS } from '$lib/links';
	import { href } from '$lib/paths';
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import GlassPanel from '$lib/ui/GlassPanel.svelte';
</script>

<p class="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Assistants</p>
<h1 class="mt-2 text-3xl font-semibold">AI &amp; ACS</h1>
<p class="mt-2 max-w-2xl text-muted">
	Install TheTowerSDK, connect an AI coding assistant through MCP, and optionally add Agentic
	Cognition Substrate so the assistant stays structured while it builds.
</p>

<section class="mt-10">
	<h2 class="text-xl font-medium">1. Connect An AI To The Package</h2>
	<p class="mt-2 max-w-2xl text-sm text-muted">
		After <code>{INSTALL_CMD}</code>, register this MCP server. The assistant can list
		exports, read catalogs, decode saves, plan paths, and fetch wiki pages.
	</p>
	<div class="mt-4 max-w-3xl">
		<CodeBlock code={mcpJson} />
	</div>
	<p class="mt-3 text-sm text-muted">
		Claude Code:
		<code>claude mcp add thetowersdk -- node ./node_modules/thetowersdk/mcp/server.mjs</code>
	</p>
</section>

<section class="mt-10">
	<h2 class="text-xl font-medium">2. Give It The Oracles</h2>
	<p class="mt-2 max-w-2xl text-sm text-muted">
		Two knowledge sources the assistant can query for game mechanics.
	</p>

	<div class="mt-5 grid gap-4 lg:grid-cols-2">
		<GlassPanel>
			<h3 class="font-medium">The Tower Oracle</h3>
			<p class="mt-2 text-sm text-muted">
				A knowledge graph of how mechanics relate, and the specific ways each has been misread.
				<code>oracle_traps</code> returns those before you model a mechanic;
				<code>oracle_expand</code> resolves acronyms from a closed set.
			</p>
			<p class="mt-2 text-sm text-muted">
				<code>oracle_coverage</code> reports how well a compartment is covered, and
				<code>oracle_contradictions</code> lists claims that disagree, ranked by source authority.
			</p>
		</GlassPanel>
		<GlassPanel>
			<h3 class="font-medium">The Sheet Oracle</h3>
			<p class="mt-2 text-sm text-muted">
				Reads a live Google Sheet, so the assistant works from a spreadsheet's own calculations.
				<code>eval_formula</code> evaluates a formula in the sheet and returns what it computes.
			</p>
			<p class="mt-2 text-sm text-muted">
				Works on any sheet shared with a Google service account.
				<a href={href('/docs/mcp/')}>Registering a Service Account →</a>
			</p>
		</GlassPanel>
	</div>
</section>

<section class="mt-10">
	<h2 class="text-xl font-medium">3. Give It a Real Save</h2>
	<p class="mt-2 max-w-2xl text-sm text-muted">
		<a href={LINKS.adbBridge}>adb-bridge</a> pulls the current save from a phone or emulator and
		serves it locally, so an assistant builds and tests against a real account and sees it change as
		you play. <a href={href('/docs/save/')}>Save File Docs →</a>
	</p>
	<div class="mt-4">
		<CodeBlock code={adbBridgeSnippet} />
	</div>
</section>

<section class="mt-10">
	<h2 class="text-xl font-medium">4. Ask It To Design Tools</h2>
	<p class="mt-2 max-w-2xl text-sm text-muted">
		Sample asks below. With TheTowerSDK MCP and ACS, the agent researches the mechanic, confirms
		package exports, builds the tool, then checkpoints — wiki and catalogs first, UI second.
	</p>
	<div class="mt-6 grid gap-4">
		{#each agentPrompts as item (item.title)}
			<GlassPanel>
				<h3 class="font-medium">{item.title}</h3>
				<p class="mt-3 text-xs font-semibold tracking-wide text-accent uppercase">You ask</p>
				<div class="mt-2">
					<CodeBlock code={item.prompt} />
				</div>
				<p class="mt-4 text-xs font-semibold tracking-wide text-gold uppercase">
					What the agent does
				</p>
				<pre
					class="mt-2 overflow-x-auto rounded-md border border-line/70 bg-bg/40 p-3 font-mono text-xs whitespace-pre-wrap text-fg/90">{item.result}</pre>
			</GlassPanel>
		{/each}
	</div>
</section>

<section id="ags" class="mt-14 scroll-mt-24">
	<p class="text-xs font-semibold tracking-[0.18em] text-gold uppercase">ACS</p>
	<h2 class="mt-2 text-2xl font-semibold">Agentic Cognition Substrate</h2>
	<p class="mt-3 max-w-2xl text-muted">
		ACS sits next to the assistant and governs how it may change your repo — checkpoints, staging,
		clear status. TheTowerSDK supplies Tower knowledge; ACS supplies the workflow. Tower players can
		request personal access with a Player ID.
	</p>

	<div class="mt-6 grid gap-4 md:grid-cols-2">
		<GlassPanel>
			<h3 class="font-medium">TheTowerSDK</h3>
			<p class="mt-2 text-sm text-muted">
				Game data, save reading, formulas, wiki text, and the MCP server above.
			</p>
			<p class="mt-3 text-sm"><a href={LINKS.github}>Package on GitHub</a></p>
		</GlassPanel>
		<GlassPanel>
			<h3 class="font-medium">Agentic Cognition Substrate</h3>
			<p class="mt-2 text-sm text-muted">
				Rules and tooling for AI-driven edits. Full overview on the ACS site.
			</p>
			<p class="mt-3 text-sm"><a href={LINKS.agsSite}>Agentic Cognition Substrate</a></p>
		</GlassPanel>
	</div>

	<p class="mt-6 text-sm">
		<a href={href('/docs/ags/')}>Full ACS &amp; Licensing Docs →</a>
		·
		<a href={href('/license/')}>Request Personal ACS →</a>
	</p>
</section>
