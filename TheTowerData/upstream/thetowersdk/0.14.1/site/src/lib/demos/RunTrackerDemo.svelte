<script lang="ts">
	/**
	 * A run tracker built from battle reports.
	 *
	 * `listImportableBattleRuns` returns the decoded entries the game stored, so
	 * a tracker is a table over them plus whatever totals you want. Sample rows
	 * stand in for a decoded save here; the shape is the same.
	 */
	import { formatNumberForDisplay } from 'thetowersdk/formatting';

	type Run = {
		tier: number;
		wave: number;
		seconds: number;
		coins: number;
		at: string;
	};

	const RUNS: Run[] = [
		{ tier: 11, wave: 5241, seconds: 27_180, coins: 4.12e15, at: '2026-08-16 21:40' },
		{ tier: 11, wave: 4988, seconds: 25_500, coins: 3.74e15, at: '2026-08-16 08:15' },
		{ tier: 12, wave: 3902, seconds: 22_860, coins: 3.98e15, at: '2026-08-15 22:03' },
		{ tier: 10, wave: 6104, seconds: 29_640, coins: 3.51e15, at: '2026-08-15 09:27' },
		{ tier: 12, wave: 3744, seconds: 21_300, coins: 3.66e15, at: '2026-08-14 20:11' }
	];

	const SORTS = [
		{ key: 'at', label: 'Newest' },
		{ key: 'wave', label: 'Wave' },
		{ key: 'coins', label: 'Coins' }
	] as const;

	let sortKey = $state<(typeof SORTS)[number]['key']>('at');
	let tierFilter = $state('all');

	const tiers = ['all', ...new Set(RUNS.map((run) => String(run.tier)))];

	function formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		return `${hours}h ${String(minutes).padStart(2, '0')}m`;
	}

	let rows = $derived(
		RUNS.filter((run) => tierFilter === 'all' || String(run.tier) === tierFilter).sort((a, b) => {
			if (sortKey === 'at') return a.at < b.at ? 1 : -1;
			return b[sortKey] - a[sortKey];
		})
	);

	let totals = $derived({
		runs: rows.length,
		coins: rows.reduce((sum, run) => sum + run.coins, 0),
		seconds: rows.reduce((sum, run) => sum + run.seconds, 0),
		bestWave: rows.reduce((best, run) => Math.max(best, run.wave), 0)
	});

	/** Coins per hour — the number this table exists to produce. */
	let coinsPerHour = $derived(totals.seconds > 0 ? (totals.coins / totals.seconds) * 3600 : 0);
</script>

<div class="grid grid-cols-2 gap-3">
	<label class="block text-sm text-muted">
		Tier
		<select
			class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
			bind:value={tierFilter}
		>
			{#each tiers as tier (tier)}
				<option value={tier}>{tier === 'all' ? 'All tiers' : `Tier ${tier}`}</option>
			{/each}
		</select>
	</label>
	<label class="block text-sm text-muted">
		Sort by
		<select
			class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
			bind:value={sortKey}
		>
			{#each SORTS as option (option.key)}
				<option value={option.key}>{option.label}</option>
			{/each}
		</select>
	</label>
</div>

<div class="mt-4 overflow-x-auto rounded-md border border-line/70">
	<table class="w-full text-left font-mono text-xs">
		<thead class="bg-panel text-[11px] tracking-wide text-muted uppercase">
			<tr>
				<th class="px-2 py-2 font-medium">Tier</th>
				<th class="px-2 py-2 text-right font-medium">Wave</th>
				<th class="px-2 py-2 text-right font-medium">Duration</th>
				<th class="px-2 py-2 text-right font-medium">Coins</th>
				<th class="px-2 py-2 font-medium">Date</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as run (run.at)}
				<tr class="border-t border-line/40">
					<td class="px-2 py-1.5 text-muted">{run.tier}</td>
					<td class="px-2 py-1.5 text-right">{run.wave.toLocaleString()}</td>
					<td class="px-2 py-1.5 text-right text-muted">{formatDuration(run.seconds)}</td>
					<td class="px-2 py-1.5 text-right text-gold">{formatNumberForDisplay(run.coins)}</td>
					<td class="px-2 py-1.5 text-muted">{run.at}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<dl class="mt-3 grid grid-cols-3 gap-2 text-center">
	<div class="rounded-md border border-line/60 bg-bg/40 p-2">
		<dt class="text-[11px] tracking-wide text-muted uppercase">Runs</dt>
		<dd class="font-mono text-sm text-fg">{totals.runs}</dd>
	</div>
	<div class="rounded-md border border-line/60 bg-bg/40 p-2">
		<dt class="text-[11px] tracking-wide text-muted uppercase">Best Wave</dt>
		<dd class="font-mono text-sm text-fg">{totals.bestWave.toLocaleString()}</dd>
	</div>
	<div class="rounded-md border border-line/60 bg-bg/40 p-2">
		<dt class="text-[11px] tracking-wide text-muted uppercase">Coins / Hour</dt>
		<dd class="font-mono text-sm text-gold">{formatNumberForDisplay(coinsPerHour)}</dd>
	</div>
</dl>
