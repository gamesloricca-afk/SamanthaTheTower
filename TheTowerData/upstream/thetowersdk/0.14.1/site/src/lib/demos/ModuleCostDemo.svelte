<script lang="ts">
	import { getModuleShardUpgradeCost } from 'thetowersdk/data';
	import { formatNumberForDisplay } from 'thetowersdk/formatting';

	const moduleLevelOptions = [
		1, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280
	] as const;

	let fromLevel = $state('160');

	let nextLevel = $derived(Number(fromLevel) + 1);
	let cost = $derived(getModuleShardUpgradeCost(nextLevel));
</script>

<label class="block max-w-xs text-sm text-muted">
	Current Level
	<select
		class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
		bind:value={fromLevel}
	>
		{#each moduleLevelOptions as option (option)}
			<option value={String(option)}>{option}</option>
		{/each}
	</select>
</label>

<div class="mt-4 rounded-md border border-line/70 bg-bg/40 p-3">
	<p class="text-xs tracking-wide text-muted uppercase">
		Shards to level {nextLevel}
	</p>
	<p class="font-mono text-2xl text-gold">{formatNumberForDisplay(cost)}</p>
</div>
