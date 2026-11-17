<script lang="ts">
	import { sdkFacts, spelled } from '$lib/sdk-facts';
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import { href } from '$lib/paths';
	import { LINKS } from '$lib/links';
</script>

<h1 class="text-3xl font-semibold">Any Language</h1>
<p class="mt-3 text-muted">
	The catalogs and the formulas are TypeScript, and TypeScript does not run in Python, Rust, Go, C#
	or Java. TheTowerSDK ships a WebAssembly build so it does not have to: one file, loaded into a
	runtime you already have, running <em>the same code</em> this project ships to JavaScript.
</p>
<p class="mt-3 text-muted">
	No port of the numbers, and no service to host. Every catalog, all {spelled(sdkFacts.builders)} builders,
	{sdkFacts.formulas}
	formulas and number formatting run inside your own process. Use official game JSON exports for account data.
</p>

<h2 class="mt-10 text-xl font-semibold">Get The Module</h2>
<p class="mt-3 text-muted">
	<code>thetowersdk.wasm</code> is attached to each
	<a href={`${LINKS.github}/releases`} rel="noreferrer">GitHub release</a>. It is not in the npm
	package: it is about 6.6 MB, and a JavaScript project has no use for it — you already have the
	library.
</p>
<div class="mt-4">
	<CodeBlock
		code="curl -LO https://github.com/TmRxJD/TheTowerSDK/releases/latest/download/thetowersdk.wasm"
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">The Protocol</h2>
<p class="mt-3 text-muted">
	One JSON object in on standard input, one JSON object out on standard output. That is the entire
	interface, chosen because every language already writes JSON and WASI's stdio is the one thing
	every runtime exposes identically.
</p>
<div class="mt-4">
	<CodeBlock
		code={`{"op": "calc.run", "id": "thorns.damage", "input": {"baseThorns": 120, "wallThorns": 12}}

{"ok": true, "id": "thorns.damage", "input": {…}, "result": {…}}`}
	/>
</div>
<p class="mt-3 text-muted">
	Failures come back as <code>{'{"ok": false, "error": "…"}'}</code>, never as a trap — a trap
	reaches a host language as an abort with no message, which in Python or Go is close to unreadable.
	Ask <code>{'{"op": "ops"}'}</code> and the module lists what it carries, so discovery is part of the
	protocol rather than documentation that can fall out of date.
</p>

<h2 class="mt-10 text-xl font-semibold">Python</h2>
<p class="mt-3 text-muted">
	<code>pip install wasmtime</code>, then instantiate the module and write to its stdin. Compile
	once and instantiate per call: the guest runs a main and exits, and compilation is the only slow
	part.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import json, tempfile
from pathlib import Path
from wasmtime import Engine, Linker, Module, Store, WasiConfig

engine = Engine()
module = Module.from_file(engine, "thetowersdk.wasm")
linker = Linker(engine)
linker.define_wasi()

def call(**request):
    with tempfile.TemporaryDirectory() as directory:
        work = Path(directory)
        (work / "in.json").write_text(json.dumps(request), encoding="utf-8")
        (work / "out.json").touch()

        config = WasiConfig()
        config.stdin_file = str(work / "in.json")
        config.stdout_file = str(work / "out.json")

        store = Store(engine)
        store.set_wasi(config)
        linker.instantiate(store, module).exports(store)["_start"](store)
        return json.loads((work / "out.json").read_text(encoding="utf-8"))

print(call(op="version"))
# {'ok': True, 'formulas': ${sdkFacts.formulas}, 'calculators': ${sdkFacts.builders}, 'chartDatasets': ${sdkFacts.chartDatasets}}

print(call(op="calc.run", id="thorns.damage",
           input={"baseThorns": 120, "wallThorns": 12, "tier": 14})["result"]["atWallThorns"])`}
	/>
</div>
<p class="mt-3 text-muted">
	A fuller wrapper, with the convenience methods, is in the repository under
	<code>wasm/examples/python/</code>.
</p>

<h2 class="mt-10 text-xl font-semibold">Other Languages</h2>
<p class="mt-3 text-muted">
	The three steps are the same everywhere: instantiate with WASI, point stdin at your request, read
	stdout.
</p>
<div class="mt-6 overflow-x-auto rounded-lg border border-line/70">
	<table class="w-full min-w-[32rem] text-left text-sm">
		<thead class="border-b border-line/70 text-xs tracking-wide text-muted uppercase">
			<tr>
				<th class="px-4 py-2 font-medium">Language</th>
				<th class="px-4 py-2 font-medium">Runtime</th>
			</tr>
		</thead>
		<tbody class="[&_td]:px-4 [&_td]:py-2 [&_tr]:border-b [&_tr]:border-line/50">
			<tr><td>Python</td><td class="text-muted"><code>wasmtime</code> (pip)</td></tr>
			<tr><td>Rust</td><td class="text-muted"><code>wasmtime</code> or <code>wasmer</code></td></tr>
			<tr><td>Go</td><td class="text-muted"><code>wazero</code> — pure Go, no cgo</td></tr>
			<tr><td>C# / .NET</td><td class="text-muted"><code>Wasmtime.Dotnet</code></td></tr>
			<tr
				><td>Java / Kotlin</td><td class="text-muted"
					><code>chicory</code> or <code>wasmtime-java</code></td
				></tr
			>
			<tr><td>PHP</td><td class="text-muted"><code>wasm</code> extension</td></tr>
			<tr
				><td>Command line</td><td class="text-muted"
					><code>wasmtime thetowersdk.wasm &lt; request.json</code></td
				></tr
			>
		</tbody>
	</table>
</div>

<h2 class="mt-10 text-xl font-semibold">What It Can Do</h2>
<div class="mt-4">
	<CodeBlock
		code={`{"op": "ops"}                       # everything below, from the module itself
{"op": "version"}                   # counts, read from the package

{"op": "data.list"}                 # every catalog
{"op": "data.get", "name": "LAB_CATALOG", "offset": 0, "limit": 100}
{"op": "data.find", "name": "LAB_CATALOG", "where": {"category": "Attack"}}

{"op": "calc.list"}                 # the builders
{"op": "calc.describe", "id": "module.cost"}
{"op": "calc.run", "id": "module.cost", "input": {"currentLevel": 1, "targetLevel": 20}}

{"op": "mechanics.list", "match": "thorn"}
{"op": "mechanics.call", "name": "thornDamageOnHit", "args": [{…}]}

{"op": "format", "value": 4770477147914}   # -> "4.77T"
{"op": "format", "value": "4.77T"}          # -> 4770000000000

{"op": "charts.list"}
{"op": "charts.rows", "id": "…"}

{"op": "contributions"}`}
	/>
</div>
<p class="mt-3 text-muted">
	Lists are paged, and <code>total</code> is always the real count — so reading 100 rows never looks
	like reading all of them. <code>calc.run</code> returns the normalised input beside the result, because
	a value quietly replaced by a default is the difference between an answer to your question and an answer
	to a different one.
</p>

<h2 class="mt-10 text-xl font-semibold">Game Exports</h2>
<p class="mt-3 text-muted">Use the Node or browser SDK to read the official <code>tool_export.json</code> file. First tap your Player ID five times to create your first export and reveal the export controls. Then use Settings → Toggles → External Tools Export → Manual Export for subsequent exports. Private save files and decryption are unsupported. Attempting to bypass save-file encryption violates The Tower Terms of Service. See <a href={href('/docs/save/')}>Game Exports</a>.</p>

<h2 class="mt-10 text-xl font-semibold">Does It Agree With The Library?</h2>
<p class="mt-3 text-muted">
	It is tested to. A build that quietly disagrees with the TypeScript would be the exact failure
	this exists to prevent — the reason to ship a module at all is that re-implementing the numbers in
	another language guarantees two versions that drift.
</p>
<p class="mt-3 text-muted">The suite compares catalog rows, calculator results and number formatting across both builds. Account-file imports use the browser or Node official-export reader.</p>

<p class="mt-8 text-sm">
	<a href={href('/docs/builders/')}>Calculators →</a>
	·
	<a href={href('/docs/save/')}>Save Files →</a>
	·
	<a href={href('/docs/data/')}>Game Data →</a>
</p>
