<script lang="ts">
	import { TIERS } from 'thetowersdk/data';
	import { computeWaveBaseDamage, computeWaveBaseHealth } from 'thetowersdk/mechanics';
	import { formatNumberForDisplay } from 'thetowersdk/formatting';

	/** Farm tiers plus tournament league bases (tier+), selectable as distinct rows. */
	const tierOptions = [
		...TIERS.map((tier) => ({
			id: `farm-${tier}`,
			label: `Tier ${tier}`,
			tier,
			tournament: false
		})),
		{ id: 'tour-copper', label: 'Copper (T1+)', tier: 1, tournament: true },
		{ id: 'tour-silver', label: 'Silver (T3+)', tier: 3, tournament: true },
		{ id: 'tour-gold', label: 'Gold (T5+)', tier: 5, tournament: true },
		{ id: 'tour-platinum', label: 'Platinum (T8+)', tier: 8, tournament: true },
		{ id: 'tour-champion', label: 'Champion (T12+)', tier: 12, tournament: true },
		{ id: 'tour-legend', label: 'Legend (T17+)', tier: 17, tournament: true }
	] as const;

	const waveOptions = [100, 500, 1000, 2500, 4500, 7500, 10000, 15000, 20000] as const;

	let tierId = $state('farm-10');
	let wave = $state('4500');

	let selected = $derived(tierOptions.find((o) => o.id === tierId) ?? tierOptions[0]);

	let hp = $derived(
		formatNumberForDisplay(
			computeWaveBaseHealth({
				tier: selected.tier,
				wave: Number(wave),
				tournament: selected.tournament
			})
		)
	);
	let damage = $derived(
		formatNumberForDisplay(
			computeWaveBaseDamage({
				tier: selected.tier,
				wave: Number(wave),
				tournament: selected.tournament
			})
		)
	);
</script>

<div class="grid gap-4 sm:grid-cols-2">
	<label class="block text-sm text-muted">
		Tier
		<select
			class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
			bind:value={tierId}
		>
			{#each tierOptions as option (option.id)}
				<option value={option.id}>{option.label}</option>
			{/each}
		</select>
	</label>
	<label class="block text-sm text-muted">
		Wave
		<select
			class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
			bind:value={wave}
		>
			{#each waveOptions as option (option)}
				<option value={String(option)}>{option}</option>
			{/each}
		</select>
	</label>
</div>

<dl class="mt-4 grid gap-3 sm:grid-cols-2">
	<div class="rounded-md border border-line/70 bg-bg/40 p-3">
		<dt class="text-xs tracking-wide text-muted uppercase">Enemy Health</dt>
		<dd class="font-mono text-2xl text-gold">{hp}</dd>
	</div>
	<div class="rounded-md border border-line/70 bg-bg/40 p-3">
		<dt class="text-xs tracking-wide text-muted uppercase">Enemy Damage</dt>
		<dd class="font-mono text-2xl text-accent">{damage}</dd>
	</div>
</dl>
