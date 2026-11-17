<script lang="ts">
	import { LAB_CATALOG, type LabCatalogRecord } from 'thetowersdk/data';
	import { formatNumberForDisplay, parseDuration } from 'thetowersdk/formatting';

	const defaultLab =
		LAB_CATALOG.find((lab) => lab.name === 'Attack Speed') ??
		LAB_CATALOG.find((lab) => lab.slug === 'attack_speed') ??
		LAB_CATALOG[0];

	let labName = $state(defaultLab?.name ?? '');
	let currentLevel = $state('0');
	let targetLevel = $state('10');

	let lab = $derived(
		LAB_CATALOG.find((item) => item.name === labName || item.slug === labName) ?? LAB_CATALOG[0]
	) as LabCatalogRecord | undefined;

	let levelOptions = $derived(
		Array.from({ length: (lab?.levels.length ?? 0) + 1 }, (_, i) => String(i))
	);

	/*
	 * The target is a level, not a count of levels.
	 *
	 * This control used to hold "levels ahead" while the tracker's labs page asks for a target
	 * level, so the same question needed different arithmetic on each. Renaming the label alone
	 * would have been worse than leaving it: the control would read as one thing and do another.
	 */
	let targetOptions = $derived(
		levelOptions.filter((option) => Number(option) > Number(currentLevel))
	);

	let result = $derived.by(() => {
		if (!lab) return null;
		const maxLevel = lab.levels.length;
		const from = Math.max(0, Math.min(Number(currentLevel) || 0, maxLevel));
		const to = Math.max(from, Math.min(Number(targetLevel) || from, maxLevel));
		const slice = lab.levels.slice(from, to);
		const coins = slice.reduce((sum, level) => sum + level.cost, 0);
		const seconds = slice.reduce((sum, level) => sum + parseDuration(level.duration), 0);
		return {
			from,
			to,
			count: slice.length,
			coins,
			seconds,
			maxLevel
		};
	});

	function formatDuration(totalSeconds: number): string {
		if (totalSeconds <= 0) return '—';
		const days = Math.floor(totalSeconds / 86400);
		const hours = Math.floor((totalSeconds % 86400) / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		if (days > 0) return `${days}d ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
	<label class="block text-sm text-muted">
		Select Lab
		<select
			class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
			bind:value={labName}
		>
			{#each LAB_CATALOG as option, i (`${option.slug}-${i}`)}
				<option value={option.name}>{option.name}</option>
			{/each}
		</select>
	</label>
	<label class="block text-sm text-muted">
		Current Level
		<select
			class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
			bind:value={currentLevel}
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
			bind:value={targetLevel}
		>
			{#each targetOptions as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</label>
</div>

{#if result}
	<dl class="mt-4 grid gap-3 sm:grid-cols-2">
		<div class="rounded-md border border-line/70 bg-bg/40 p-3">
			<dt class="text-xs tracking-wide text-muted uppercase">
				Coin cost (levels {result.from} → {result.to})
			</dt>
			<dd class="font-mono text-2xl text-gold">{formatNumberForDisplay(result.coins)}</dd>
		</div>
		<div class="rounded-md border border-line/70 bg-bg/40 p-3">
			<dt class="text-xs tracking-wide text-muted uppercase">Research Time</dt>
			<dd class="font-mono text-2xl text-accent">{formatDuration(result.seconds)}</dd>
		</div>
	</dl>
	<p class="mt-3 text-xs text-muted">
		{result.count} level{result.count === 1 ? '' : 's'} · lab max {result.maxLevel}
	</p>
{/if}
