<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = ''
	}: {
		children: Snippet;
		class?: string;
	} = $props();
</script>

<div
	class={[
		/*
		 * `min-w-0` matters: a grid or flex item defaults to `min-width: auto`, so a panel holding a
		 * wide <pre> is sized by the longest line of code rather than by its column. That pushed the
		 * demo grid 96px past the viewport and gave the whole page a horizontal scrollbar — the
		 * CodeBlock's own `overflow-x-auto` never got a chance to engage, because its container had
		 * already grown to fit.
		 */
		/*
		 * The panel sits on a lattice, so it needs to look like it is above it: a real drop shadow
		 * for separation, a hairline top highlight so the top edge catches light, and a blur so the
		 * texture behind it is visibly out of focus. A flat 1px border on a flat fill read as a box
		 * drawn on the page rather than a surface resting on it.
		 */
		'min-w-0 rounded-xl border border-line/80 bg-panel/80 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_10px_30px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md',
		className
	]}
>
	{@render children()}
</div>
