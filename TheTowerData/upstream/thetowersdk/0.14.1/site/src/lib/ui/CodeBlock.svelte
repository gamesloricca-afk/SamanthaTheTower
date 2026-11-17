<script lang="ts">
	import { highlightCode } from './highlight';
	import { createClipboardFeedback } from './clipboard.svelte';

	let { code, label = 'Copy' }: { code: string; label?: string } = $props();

	const clipboard = createClipboardFeedback();

	/**
	 * Highlighted markup, once shiki has loaded.
	 *
	 * The plain `<pre>` below renders immediately and is replaced in place, so the sample is
	 * readable during the lazy load, with JavaScript off, and if the highlighter fails outright.
	 * `codeToHtml` escapes the source it is given, which is what makes the `@html` safe here.
	 */
	let highlighted = $state<string | null>(null);

	$effect(() => {
		const source = code;
		highlighted = null;
		let current = true;
		void highlightCode(source).then((markup) => {
			if (current) highlighted = markup;
		});
		return () => {
			current = false;
		};
	});
</script>

<div class="code-block relative overflow-hidden rounded-xl border border-line">
	<button
		type="button"
		class="absolute top-2 right-2 z-10 rounded-md border border-line bg-panel/90 px-2 py-1 text-xs text-muted backdrop-blur-sm hover:text-fg"
		aria-label="Copy code"
		onclick={() => clipboard.copy(code)}
	>
		{clipboard.status === 'copied' ? 'Copied' : label}
	</button>
	<span class="sr-only" role="status">{clipboard.status === 'copied' ? 'Code copied.' : ''}</span>
	{#if clipboard.status === 'failed'}
		<p class="px-4 pt-10 text-sm text-fg" role="status">
			Copy failed. Select the code below and copy it manually.
		</p>
	{/if}
	{#if highlighted}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- shiki escapes the source it renders -->
		{@html highlighted}
	{:else}
		<pre class="shiki-fallback"><code>{code}</code></pre>
	{/if}
</div>

<style>
	/*
	 * One set of rules for both the shiki output and the pre-highlight fallback, so the block does
	 * not resize or reflow when the highlighter resolves. Shiki emits its own `<pre class="shiki">`
	 * carrying the theme background inline, which `:global` is needed to reach.
	 */
	/*
	 * Long lines wrap instead of scrolling sideways.
	 *
	 * These blocks sit in narrow two-column panels, where a horizontal scrollbar hides the end of
	 * every line until the reader finds and drags it. `pre-wrap` keeps the code's own newlines and
	 * indentation, and the hanging indent keeps a wrapped continuation visually inside its line
	 * rather than looking like a new statement.
	 */
	.code-block :global(pre.shiki),
	.code-block .shiki-fallback {
		margin: 0;
		padding: 2.5rem 1rem 1rem;
		font-size: 0.8rem;
		line-height: 1.65;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		text-indent: -1.25rem;
		padding-left: 2.25rem;
	}

	/*
	 * Shiki nests a `<code>` inside its `<pre>`, and that child keeps its own intrinsic width — so
	 * wrapping the `<pre>` alone still left long lines running past the panel on narrow screens.
	 * `display: block` gives it a width to wrap within.
	 */
	.code-block :global(pre.shiki code),
	.code-block .shiki-fallback code {
		display: block;
		white-space: inherit;
		overflow-wrap: inherit;
	}

	/*
	 * Override the theme's own background with the site's panel colour.
	 *
	 * Night Owl ships a near-black blue that sits oddly against this palette; the token colours are
	 * what is wanted, not the canvas. `!important` is the only lever here because shiki writes the
	 * background as an inline style on the element it emits.
	 */
	.code-block :global(pre.shiki) {
		background-color: #0d131b !important;
	}

	/* Night Owl's comment token needs more contrast on the shared code background. */
	.code-block :global(pre.shiki span[style*='color:#637777']) {
		color: #93a8a8 !important;
	}

	.code-block .shiki-fallback {
		background-color: #0d131b;
		color: var(--color-fg);
		opacity: 0.9;
	}
</style>
