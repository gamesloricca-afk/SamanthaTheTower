<script lang="ts">
	import {
		planEffectiveEconomyPath,
		ZERO_EFFECTIVE_ECONOMY_LEVELS,
		zeroEffectiveEconomyConfig,
		type EffectiveEconomyLevels
	} from 'thetowersdk/mechanics';

	const seedOptions = [
		{ key: 'coinsPerKillBonus', label: 'Coins / Kill Bonus' },
		{ key: 'goldenTowerBonus', label: 'Golden Tower Bonus' },
		{ key: 'goldenTowerDuration', label: 'Golden Tower Duration' },
		{ key: 'deathWaveCoinBonus', label: 'Death Wave Coin Bonus' },
		{ key: 'blackHoleCoinBonus', label: 'Black Hole Coin Bonus' },
		{ key: 'goldBotDuration', label: 'Golden Bot Duration' }
	] as const;

	const stepOptions = ['3', '5', '8', '10', '12'] as const;
	const startLevelOptions = Array.from({ length: 31 }, (_, i) => String(i));

	let steps = $state('5');
	let seedKey = $state<(typeof seedOptions)[number]['key']>('coinsPerKillBonus');
	let startLevel = $state('0');

	let levels = $derived.by((): EffectiveEconomyLevels => {
		const next: EffectiveEconomyLevels = {
			time: { ...ZERO_EFFECTIVE_ECONOMY_LEVELS.time },
			stone: { ...ZERO_EFFECTIVE_ECONOMY_LEVELS.stone },
			discount: { ...ZERO_EFFECTIVE_ECONOMY_LEVELS.discount }
		};
		next.time[seedKey] = Number(startLevel) || 0;
		return next;
	});

	let plan = $derived(
		planEffectiveEconomyPath({
			config: zeroEffectiveEconomyConfig(),
			levels,
			variant: 'time',
			steps: Number(steps) || 5
		})
	);
</script>

<div class="grid gap-4 sm:grid-cols-3">
	<label class="block text-sm text-muted">
		Upgrade
		<select
			class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
			bind:value={seedKey}
		>
			{#each seedOptions as option (option.key)}
				<option value={option.key}>{option.label}</option>
			{/each}
		</select>
	</label>
	<label class="block text-sm text-muted">
		Current Level
		<select
			class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
			bind:value={startLevel}
		>
			{#each startLevelOptions as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</label>
	<label class="block text-sm text-muted">
		Steps
		<select
			class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
			bind:value={steps}
		>
			{#each stepOptions as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</label>
</div>

<ul class="mt-4 divide-y divide-line/70 rounded-md border border-line/70">
	{#each plan.steps as step, i (i)}
		<li class="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm">
			<span class="font-medium">{i + 1}. {step.name ?? step.id ?? 'upgrade'}</span>
			<span class="font-mono text-xs text-muted">lv {step.level}</span>
		</li>
	{:else}
		<li class="px-3 py-2 text-sm text-muted">No steps in this plan.</li>
	{/each}
</ul>
<p class="mt-2 text-xs text-muted">
	{plan.excluded?.length ?? 0} candidates skipped (with reasons on the full object).
</p>
