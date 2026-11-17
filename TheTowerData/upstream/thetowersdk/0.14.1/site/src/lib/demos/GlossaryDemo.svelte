<script lang="ts">
	import { lookupGlossary } from 'thetowersdk/data';

	let query = $state('CF');
	let hits = $derived(lookupGlossary(query.trim()));
</script>

<div>
	<label class="block text-sm text-muted" for="glossary-q">Tower acronym or term</label>
	<input
		id="glossary-q"
		class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
		bind:value={query}
		placeholder="CF, GT, DW, ELS…"
		autocomplete="off"
		spellcheck="false"
	/>
	<ul class="mt-3 divide-y divide-line/70 rounded-md border border-line/70">
		{#each hits as hit, i (hit.term + hit.domain + i)}
			<li class="px-3 py-2">
				<p class="font-medium">
					{hit.term}
					{#if hit.expansion}
						<span class="text-muted"> — {hit.expansion}</span>
					{/if}
				</p>
				{#if hit.domain}
					<p class="text-xs text-accent">{hit.domain}</p>
				{/if}
				{#if hit.definition}
					<p class="mt-1 text-sm text-muted">{hit.definition}</p>
				{/if}
				{#if hit.source}
					<p class="mt-1 text-xs text-muted">Source: {hit.source}</p>
				{/if}
			</li>
		{:else}
			<li class="px-3 py-2 text-sm text-muted">No match.</li>
		{/each}
	</ul>
</div>
