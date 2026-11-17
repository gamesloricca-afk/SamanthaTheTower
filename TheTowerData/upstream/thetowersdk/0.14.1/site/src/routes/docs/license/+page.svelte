<script lang="ts">
	import { LINKS } from '$lib/links';
	import { href } from '$lib/paths';
	import GlassPanel from '$lib/ui/GlassPanel.svelte';
</script>

<h1 class="text-3xl font-semibold">Licensing</h1>
<p class="mt-3 text-muted">
	TheTowerSDK is MIT licensed — free to install and free to use, for anything.
</p>

<h2 class="mt-10 text-xl font-semibold">What You Can Do With It</h2>
<p class="mt-3 text-muted">
	Use it in personal projects, community tools, and commercial apps. Ship it inside a website, a
	Discord bot, a desktop app, a mobile app, or a spreadsheet add-on. Fork it, vendor it, modify it,
	and redistribute your version. The only condition is the one MIT always carries: keep the
	copyright notice with the code.
</p>

<h2 class="mt-10 text-xl font-semibold">Licenses Of Things It Carries</h2>
<p class="mt-3 text-muted">
	MIT covers this package's own code. Two other licenses travel with parts of it, and both are
	reproduced in full in <code>NOTICE</code> in the repository and the published tarball.
</p>
<div class="mt-4 grid gap-4 md:grid-cols-2">
	<GlassPanel>
		<p class="text-xs tracking-wide text-muted uppercase">Dependency</p>
		<p class="mt-1 font-medium">
			<a href="https://github.com/colinhacks/zod" rel="noreferrer">zod</a> — MIT
		</p>
		<p class="mt-2 text-sm text-muted">
			Copyright (c) 2025 Colin McDonnell. The npm package requires zod rather than containing it, so
			installing brings it in as its own package. The WebAssembly build compiles it into the
			<code>.wasm</code>, so redistributing that file redistributes zod and carries this notice with
			it.
		</p>
	</GlassPanel>
	<GlassPanel>
		<p class="text-xs tracking-wide text-muted uppercase">Derived code</p>
		<p class="mt-1 font-medium">tower-idle-toolkit — ISC</p>
		<p class="mt-2 text-sm text-muted">
			Copyright (c) 2023 skye. Several formulas here began as that project's work — the wave scaling
			structure, the damage and plus formulas, and duration formatting. Refitted and restructured
			since, but the approach and a number of constants are theirs.
		</p>
	</GlassPanel>
</div>
<p class="mt-4 text-sm text-muted">
	Game data compiled with the help of community spreadsheets is credited on
	<a href={href('/contributions/')}>Contributions</a>; see
	<a href={href('/docs/dependencies/')}>Dependencies</a> for what is required versus bundled.
</p>

<h2 class="mt-10 text-xl font-semibold">Attribution</h2>
<p class="mt-3 text-muted">
	Nothing beyond the license notice is required. If you would like to credit the project anyway, a
	link to <a href={LINKS.github}>the repository</a> is the most useful form — it points people at the
	same numbers you are using.
</p>

<h2 class="mt-10 text-xl font-semibold">Pinning A Version</h2>
<p class="mt-3 text-muted">
	Install a fixed version when you want the game numbers to stay exactly as they are today, and
	upgrade deliberately when the game changes. See <a href={href('/docs/install/')}>Install</a> for the
	options.
</p>

<p class="mt-8 text-sm">
	<a href={href('/docs/dependencies/')}>Dependencies →</a>
	·
	<a href={href('/docs/install/')}>Install →</a>
	·
	<a href={LINKS.github}>GitHub →</a>
</p>
