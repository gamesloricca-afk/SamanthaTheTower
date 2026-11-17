<script lang="ts">
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import GlassPanel from '$lib/ui/GlassPanel.svelte';
	import { href } from '$lib/paths';

	/* A const rather than an inline literal: a mustache holding a bare string is a lint error. */
	const checkCommands = ['npm view thetowersdk dependencies', 'npm ls --omit=dev'].join('\n');
</script>

<h1 class="text-3xl font-semibold">Dependencies</h1>
<p class="mt-3 text-muted">
	One runtime dependency, and nothing else reaches your install. The game data, the formulas and the
	save reader are in the package. Only official JSON exports are supported; parsing run locally without a hosted service.
</p>

<h2 class="mt-10 text-xl font-semibold">The One Runtime Dependency</h2>
<div class="mt-4">
	<GlassPanel>
		<p class="text-xs tracking-wide text-muted uppercase">Runtime</p>
		<p class="mt-1 font-medium">
			<a href="https://github.com/colinhacks/zod" rel="noreferrer">zod</a> — MIT
		</p>
		<p class="mt-2 text-sm text-muted">
			By Colin McDonnell. Declares the shapes the data tables must satisfy, so a catalog can be
			checked against its documented form at runtime and not only at compile time. Types vanish when
			TypeScript compiles; a table that has drifted does not.
		</p>
	</GlassPanel>
</div>

<h2 class="mt-10 text-xl font-semibold">Required Or Bundled</h2>
<p class="mt-3 text-muted">
	The distinction decides whose license has to travel with what you ship, so it is worth stating
	plainly rather than leaving to inference.
</p>
<div class="mt-4 grid gap-4 md:grid-cols-2">
	<GlassPanel>
		<p class="text-xs tracking-wide text-muted uppercase">npm package</p>
		<p class="mt-1 font-medium">Requires zod</p>
		<p class="mt-2 text-sm text-muted">
			No zod source is inside the tarball. The build imports it and npm installs it alongside, the
			same as any other dependency in your tree.
		</p>
	</GlassPanel>
	<GlassPanel>
		<p class="text-xs tracking-wide text-gold uppercase">WebAssembly build</p>
		<p class="mt-1 font-medium">Bundles zod</p>
		<p class="mt-2 text-sm text-muted">
			The <code>.wasm</code> is compiled from one bundle, so zod's code is inside the artifact. Redistributing
			that file redistributes zod, and its MIT notice goes with it.
		</p>
	</GlassPanel>
</div>

<h2 class="mt-10 text-xl font-semibold">Build-Time Only</h2>
<p class="mt-3 text-muted">
	TypeScript, ESLint, Vitest, tsx and the Node type definitions build and check the package. None of
	them is installed by consumers, and none appears in the published tarball.
</p>

<h2 class="mt-10 text-xl font-semibold">Game Export Validation</h2>
<p class="mt-3 text-muted">The official JSON export is parsed locally and validated with Zod. Private binary save files and decryption keys are unsupported.</p>

<h2 class="mt-10 text-xl font-semibold">Checking For Yourself</h2>
<p class="mt-3 text-muted">The manifest is the authority, not this page.</p>
<div class="mt-4">
	<CodeBlock code={checkCommands} />
</div>

<h2 class="mt-10 text-xl font-semibold">Work This Package Builds On</h2>
<p class="mt-3 text-muted">
	Separate from software dependencies, parts of the game data and several formulas came from
	community work — the original toolkit, the Effective Paths spreadsheets, the wikis and the guides.
	Those are credited by name on <a href={href('/contributions/')}>Contributions</a>, and the
	licenses that apply are on <a href={href('/docs/license/')}>Licensing</a>.
</p>

<p class="mt-8 text-sm">
	<a href={href('/docs/license/')}>Licensing →</a>
	·
	<a href={href('/contributions/')}>Contributions →</a>
	·
	<a href={href('/docs/wasm/')}>Any Language →</a>
</p>
