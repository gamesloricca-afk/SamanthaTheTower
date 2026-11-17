<script lang="ts">
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import { mcpJson } from '$lib/content';
	import { href } from '$lib/paths';
</script>

<h1 class="text-3xl font-semibold">MCP &amp; AI</h1>
<p class="mt-3 text-muted">
	The package ships an MCP server, so there is nothing extra to install. Register it and your
	editor's assistant gains thirty-seven tools: it can run the shipped calculators and get real
	numbers back, work in an instrumented sandbox, decode a save, pull wiki pages, and trace and
	validate what it produced — rather than writing game maths from memory and hoping.
</p>

<h2 class="mt-10 text-xl font-semibold">Register It</h2>
<p class="mt-3 text-muted">
	You need <code>thetowersdk</code> installed in the project first — the server runs from inside it,
	which is why the path is under <code>node_modules</code>. Run this from the project root.
</p>

<h3 class="mt-6 text-lg font-medium">Claude Code</h3>
<p class="mt-2 text-sm text-muted">One command, from your project directory:</p>
<div class="mt-3">
	<CodeBlock code="claude mcp add thetowersdk -- node ./node_modules/thetowersdk/mcp/server.mjs" />
</div>

<h3 class="mt-6 text-lg font-medium">Cursor, Copilot, and anything else</h3>
<p class="mt-2 text-sm text-muted">
	Add the server to the editor's MCP config file — <code>.cursor/mcp.json</code> in the project for Cursor,
	or the MCP section of your editor's settings. Restart the MCP session after saving, since most editors
	read this once at startup.
</p>
<div class="mt-3">
	<CodeBlock code={mcpJson} />
</div>
<p class="mt-3 text-sm text-muted">
	Ask the assistant to list the tools it has once it reconnects. If <code>list_exports</code> is among
	them, the server is registered.
</p>

<h2 class="mt-10 text-xl font-semibold">Thirty-Seven Tools</h2>
<p class="mt-3 text-muted">
	Enough that an assistant can compute, run and check its work rather than only look things up. The
	groups below are what it gets.
</p>

<h3 class="mt-8 text-lg font-medium">Run The Calculators Directly</h3>
<p class="mt-2 text-muted">
	The assistant does not have to derive game maths, or write it and hope. It can call the shipped
	formula and get the number the SDK itself returns.
</p>
<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
	<li>
		<code>calc_list</code> — every declared calculator, with what each reads and produces. The first call
		to make before writing any maths, so an established formula is used rather than a second one invented
		alongside it
	</li>
	<li>
		<code>calc_describe</code> — one calculator in full: parameters with their units, the invariants its
		output must satisfy, and where its source lives
	</li>
	<li>
		<code>calc_run</code> — run it on real arguments and get the shipped function's answer. An unknown
		handle, a missing parameter or a wrong type is refused rather than answered with a plausible number
	</li>
	<li>
		<code>calc_chart</code> — which formula produces a given chart's numbers. An empty list is a real
		answer: that chart is a measured table nothing computes
	</li>
	<li>
		<code>calc_graph</code> — which calculators call which, and which produce values others read. Answers
		"what feeds this number?" without opening the source
	</li>
</ul>

<h3 class="mt-8 text-lg font-medium">A Sandbox To Work In</h3>
<p class="mt-2 text-muted">
	<code>sdk_sandbox_run</code> is a scratchpad: an instrumented space where the assistant can load the
	kernel, decode a fixture save, evaluate a citation, or dry-run a repair and see what happens — without
	touching your project. It never applies an inventive fix; it shows you the result and leaves the decision
	with you.
</p>

<h3 class="mt-8 text-lg font-medium">Read The Package And A Save</h3>
<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
	<li>
		<code>list_exports</code> / <code>get_export</code> — what exists, one table previewed rather than
		dumped
	</li>
	<li>
		<code>describe_schema</code> — a table's declared shape, not one guessed from a sample row
	</li>
	<li>
		<code>decode_save</code> / <code>run_extractor</code> — what is in a <code>tool_export.json</code>
	</li>
	<li><code>define_term</code> — what an acronym means, and whether it is ambiguous</li>
	<li><code>plan_effective_path</code> — a path, with the candidates it excluded and why</li>
	<li>
		<code>wiki_search</code> / <code>wiki_page</code> — how a mechanic behaves, in the community's own
		words
	</li>
</ul>

<h3 class="mt-8 text-lg font-medium">Check Its Own Work</h3>
<p class="mt-2 text-muted">
	The part that makes the rest trustworthy: the assistant can trace and validate its own output
	rather than declare itself finished.
</p>
<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
	<li>
		<code>sdk_debug_trace</code>, <code>_snapshot</code>, <code>_watch</code>,
		<code>_validate</code> — run a mechanics export with instrumentation and get a structured trace back,
		so a wrong number can be followed to where it went wrong
	</li>
	<li>
		<code>trust_coverage_report</code> / <code>trust_drift_check</code> — what is covered, what is silently
		uncovered, and what has moved since it was last checked
	</li>
	<li><code>sdk_lsp_diagnostics</code> — kernel, doctor and save-graph diagnostics in one call</li>
</ul>

<h3 class="mt-8 text-lg font-medium">Work With The Mechanics Graph</h3>
<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
	<li>
		<code>sdk_graph_get</code> / <code>sdk_graph_context</code> — the graph, or just the neighbourhood
		around one mechanic
	</li>
	<li>
		<code>sdk_graph_mutate</code> / <code>sdk_graph_validate</code> — record what was learned, and have
		it checked before it lands
	</li>
	<li>
		<code>sdk_graph_render</code> — the graph as a <strong>Mermaid</strong> diagram, not an image
	</li>
	<li>
		<code>sdk_kernel_load</code>, <code>sdk_registry_get</code>, <code>sdk_save_graph_get</code>,
		<code>sdk_planner_compile</code>, <code>sdk_docs_generate</code> — the substrate underneath, for compiling
		a planner or regenerating the mechanics map
	</li>
</ul>

<h2 class="mt-10 text-xl font-medium">The Tower Oracle</h2>
<p class="mt-2 text-sm text-muted">
	A knowledge graph of game mechanics: nodes are mechanics, edges are the relationships between
	them, and every claim records its source. It answers how a mechanic behaves, what it interacts
	with, and the specific ways it has been misread before.
</p>
<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
	<li>
		<code>oracle_traps</code> — <strong>call first.</strong> Every known way this mechanic has been got
		wrong
	</li>
	<li>
		<code>oracle_expand</code> — what an acronym means, from a closed set (<code>GT+</code>,
		<code>CF</code>, <code>DW</code>)
	</li>
	<li>
		<code>oracle_brief</code> / <code>oracle_get</code> / <code>oracle_search</code> — orientation, one
		node, or find it by phrasing
	</li>
	<li><code>oracle_map</code> — how a mechanic connects to the rest of the game</li>
	<li>
		<code>oracle_footguns</code> / <code>oracle_coverage</code> / <code>oracle_contradictions</code>
	</li>
</ul>
<p class="mt-3 text-sm text-muted">
	Every claim carries a <code>claimType</code> of <code>objective</code> or <code>sentiment</code>,
	so measured values and community opinion stay distinguishable. <code>oracle_coverage</code>
	reports how well a compartment is covered, and <code>oracle_contradictions</code> surfaces claims that
	disagree, ranked by source authority.
</p>

<h2 class="mt-10 text-xl font-medium">The Sheet Oracle</h2>
<p class="mt-2 text-sm text-muted">
	Reads a live Google Sheet through MCP, so an assistant can work from a spreadsheet's own
	calculations. Point it at any sheet shared with your service account.
</p>
<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
	<li><code>sheet_info</code> — sheet id, version, writable flag. Call first</li>
	<li><code>eval_formula</code> — evaluate a formula in the sheet and return what it computes</li>
	<li><code>read_range</code> — values or formulas in A1 notation</li>
	<li><code>list_lambdas</code> — named functions and their parameter order</li>
	<li><code>inspect_tab_ui</code> — the live label and value control panel for a tab</li>
	<li><code>write_cells</code> — set inputs to a known state before reading a result</li>
</ul>

<h3 class="mt-6 text-lg font-medium">Registering a Service Account</h3>
<p class="mt-2 text-sm text-muted">
	The sheet tools reach a spreadsheet as a Google Cloud <strong>service account</strong>, the same
	identity the <code>thetowersdk/sheets</code> client uses. The walkthrough lives with the
	spreadsheet docs so there is one copy of it:
	<a href={href('/docs/sheets/#connecting-with-a-google-service-account')}
		>Connecting with a service account</a
	>.
</p>
<p class="mt-3 text-sm text-muted">
	One thing worth knowing before you debug anything else: an unshared sheet reads as an
	<em>empty range</em>, not a permissions error. Check the sharing first.
</p>

<p class="mt-8 text-sm">
	<a href={href('/docs/knowledge/')}>Knowledge Graph →</a>
	·
	<a href={href('/docs/towerai/')}>TowerAI →</a>
</p>

<h2 class="mt-10 text-xl font-semibold">Official Game Exports</h2>
<p class="mt-3 text-muted">Save tools accept only <code>tool_export.json</code> created by first tapping Player ID five times to create the initial export and reveal the controls, then using Settings → Toggles → External Tools Export → Manual Export. No decryption keys are accepted. Attempting to bypass save-file encryption violates The Tower Terms of Service. See <a href={href('/docs/save/')}>Game Exports</a>.</p>

