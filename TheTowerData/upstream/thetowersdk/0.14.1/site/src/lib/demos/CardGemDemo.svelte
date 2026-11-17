<script lang="ts">
	import { CARD_LEVEL_COPY_REQUIREMENTS, cardLevelUpgradeGemCost } from '$lib/sdk-card-costs';
	import { formatNumberForDisplay } from 'thetowersdk/formatting';

	const levelOptions = ['0', '1', '2', '3', '4', '5', '6', '7'] as const;

	let fromLevel = $state('0');
	let toLevel = $state('7');

	let gems = $derived(cardLevelUpgradeGemCost(Number(fromLevel), Number(toLevel)));

	const levelRows = levelOptions.slice(1).map((to) => {
		const toN = Number(to);
		const fromN = toN - 1;
		return {
			to,
			copies: CARD_LEVEL_COPY_REQUIREMENTS[toN] - CARD_LEVEL_COPY_REQUIREMENTS[fromN],
			gems: cardLevelUpgradeGemCost(fromN, toN)
		};
	});
</script>

<div class="grid gap-4 sm:grid-cols-2">
	<label class="block text-sm text-muted">
		Current Level
		<select
			class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
			bind:value={fromLevel}
		>
			{#each levelOptions as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</label>
	<label class="block text-sm text-muted">
		Target Level
		<select
			class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
			bind:value={toLevel}
		>
			{#each levelOptions as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</label>
</div>

<div class="mt-4 rounded-md border border-line/70 bg-bg/40 p-3">
	<p class="text-xs tracking-wide text-muted uppercase">Gem cost (range)</p>
	<p class="font-mono text-2xl text-gold">{formatNumberForDisplay(gems)}</p>
</div>

<table class="mt-4 w-full text-left text-sm">
	<thead class="text-xs tracking-wide text-muted uppercase">
		<tr>
			<th class="py-1 font-normal">Level</th>
			<th class="py-1 font-normal">Copies Owned</th>
			<th class="py-1 font-normal">Gems</th>
		</tr>
	</thead>
	<tbody class="font-mono">
		{#each levelRows as row (row.to)}
			<tr class="border-t border-line/50">
				<td class="py-1">{Number(row.to) - 1} → {row.to}</td>
				<td class="py-1">{row.copies}</td>
				<td class="py-1 text-gold">{formatNumberForDisplay(row.gems)}</td>
			</tr>
		{/each}
	</tbody>
</table>
