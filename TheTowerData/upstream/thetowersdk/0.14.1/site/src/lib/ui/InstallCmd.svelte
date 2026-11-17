<script lang="ts">
	import { INSTALL_CMD, SDK_VERSION } from '$lib/links';
	import { createClipboardFeedback } from './clipboard.svelte';

	let {
		command = INSTALL_CMD,
		showVersion = true
	}: {
		command?: string;
		showVersion?: boolean;
	} = $props();

	const clipboard = createClipboardFeedback();
</script>

<!--
	`min-w-0` on the row and `break-all` on the command are what stop a long command running past the
	panel. A flex item defaults to `min-width: auto`, so without the first the row refuses to shrink
	below the command's own width; without the second the command has no break opportunity, since a
	shell line has no spaces the browser will break inside a path.
-->
<div
	class="inline-flex max-w-full flex-wrap items-center gap-2 rounded-md border border-line/80 bg-panel/60 py-1.5 pr-1.5 pl-3 font-mono text-sm text-muted"
>
	<code class="min-w-0 break-all whitespace-pre-wrap text-fg/90">{command}</code>
	{#if showVersion}
		<span aria-hidden="true">·</span>
		<span>v{SDK_VERSION}</span>
	{/if}
	<button
		type="button"
		class="ml-1 rounded border border-line bg-bg/80 px-2 py-0.5 text-xs text-muted hover:border-accent hover:text-fg"
		aria-label="Copy command"
		onclick={() => clipboard.copy(command)}
	>
		{clipboard.status === 'copied' ? 'Copied' : 'Copy'}
	</button>
	<span class="sr-only" role="status">{clipboard.status === 'copied' ? 'Command copied.' : ''}</span
	>
	{#if clipboard.status === 'failed'}
		<span class="basis-full text-sm text-fg" role="status"
			>Copy failed. Select the command and copy it manually.</span
		>
	{/if}
</div>
