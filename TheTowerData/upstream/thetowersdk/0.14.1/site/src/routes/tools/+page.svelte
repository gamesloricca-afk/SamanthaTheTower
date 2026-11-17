<script lang="ts">
	import { trackerExamples } from '$lib/content';
	import { LINKS } from '$lib/links';
	import { href } from '$lib/paths';
</script>

<p class="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Build</p>
<h1 class="mt-2 text-3xl font-semibold">What You Can Build</h1>
<p class="mt-2 max-w-2xl text-muted">
	Every tool below is built from the catalogs and formulas in the package. Pick the one you want to
	make and open its docs — each card links straight to the reference for it.
</p>

<!--
	Cards are links, not panels with links inside them.

	The whole card is the target, so there is no small "docs →" to aim for, and it reads as a menu of
	things you can go and build rather than a list of things that exist.
-->
<div class="mt-8 grid gap-4 md:grid-cols-2">
	{#each trackerExamples as tool (tool.title)}
		<a href={href(tool.docs)} class="tool-card lift">
			<h2 class="text-lg font-medium">{tool.title}</h2>
			<p class="mt-2 text-sm text-muted">{tool.body}</p>
		</a>
	{/each}
</div>

<p class="mt-8 text-sm text-muted">
	Built on this package:
	<a href={LINKS.tracker}>The Tower Run Tracker</a>
	·
	<a href={href('/playground/')}>Runnable examples →</a>
</p>

<!-- `.tool-card` lives in layout.css — the home page uses it too. -->
