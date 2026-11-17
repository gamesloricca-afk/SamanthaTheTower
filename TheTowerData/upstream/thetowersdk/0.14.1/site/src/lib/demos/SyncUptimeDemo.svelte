<script lang="ts">
	/**
	 * Golden Tower against Black Hole, on the same terms.
	 *
	 * This demo used to compare Death Wave with the Golden Bot. When the section was retitled to
	 * "Golden Tower vs Black Hole", only the heading and the code sample changed — the live panel
	 * beside them kept computing the old pair for weeks, showing one thing while the code next to it
	 * said another. Retitle this and you must re-point it.
	 *
	 * Comparing two ultimate weapons is also simpler than the old pairing: both draw Duration and
	 * Cooldown from the same catalog, so there is no bot-versus-weapon special casing, and no
	 * seconds-per-wave constant to convert a quantity into a duration.
	 *
	 * Uptime here is duration over cooldown and nothing else. Game speed rescales both timers
	 * together, so the ratio survives it — but a coins-per-hour or waves-per-hour number would not,
	 * because the game's stated multiplier is not its real one. That is why this reports a fraction
	 * and makes no claim about income.
	 */
	import { uwStoneChartData } from 'thetowersdk/data';
	import { estimateBotUptimeFraction } from 'thetowersdk/mechanics';

	type Option = { level: number; label: string; value: string };

	const weaponNamed = (name: string) =>
		Object.values(uwStoneChartData).find((weapon) => weapon.name === name);

	/**
	 * Options straight off the ladder, keeping the catalog's own string values.
	 *
	 * The values stay as the game writes them ('23s'), because `estimateBotUptimeFraction` parses
	 * units itself and throws outright when handed a number — stripping the unit first is the way to
	 * break it.
	 */
	function optionsFor(weaponName: string, statName: string): Option[] {
		const stat = weaponNamed(weaponName)?.stats.find((entry) => entry.name === statName);
		return (stat?.levels ?? []).map((entry) => ({
			level: entry.level,
			label: `Lv ${entry.level} — ${entry.value}`,
			value: String(entry.value)
		}));
	}

	const gtDuration = optionsFor('Golden Tower', 'Duration');
	const gtCooldown = optionsFor('Golden Tower', 'Cooldown');
	const bhDuration = optionsFor('Black Hole', 'Duration');
	const bhCooldown = optionsFor('Black Hole', 'Cooldown');

	/**
	 * Starting level, clamped per ladder.
	 *
	 * The four ladders are different lengths — Golden Tower's Duration runs to 38 while Black Hole's
	 * Cooldown stops at 15 — so a shared default level is not guaranteed to exist in all of them.
	 * Falling back to the last entry keeps every control on a real level instead of an empty select.
	 */
	const START_LEVEL = 8;
	const levelAt = (options: Option[]) =>
		String(options.find((o) => o.level === START_LEVEL)?.level ?? options.at(-1)?.level ?? 0);

	let gtDurLevel = $state(levelAt(gtDuration));
	let gtCdLevel = $state(levelAt(gtCooldown));
	let bhDurLevel = $state(levelAt(bhDuration));
	let bhCdLevel = $state(levelAt(bhCooldown));

	const valueOf = (options: Option[], level: string) =>
		options.find((o) => String(o.level) === level)?.value ?? '';

	let gtDur = $derived(valueOf(gtDuration, gtDurLevel));
	let gtCd = $derived(valueOf(gtCooldown, gtCdLevel));
	let bhDur = $derived(valueOf(bhDuration, bhDurLevel));
	let bhCd = $derived(valueOf(bhCooldown, bhCdLevel));

	let gtUptime = $derived(estimateBotUptimeFraction(gtDur, gtCd));
	let bhUptime = $derived(estimateBotUptimeFraction(bhDur, bhCd));

	function formatPct(fraction: number): string {
		if (!Number.isFinite(fraction) || fraction <= 0) return '—';
		return `${(fraction * 100).toFixed(1)}%`;
	}

	const rows = $derived([
		{ name: 'Golden Tower', cooldown: gtCd, duration: gtDur, uptime: gtUptime },
		{ name: 'Black Hole', cooldown: bhCd, duration: bhDur, uptime: bhUptime }
	]);

	const controls = $derived([
		{
			label: 'Golden Tower Duration Level',
			options: gtDuration,
			get: () => gtDurLevel,
			set: (v: string) => (gtDurLevel = v)
		},
		{
			label: 'Golden Tower Cooldown Level',
			options: gtCooldown,
			get: () => gtCdLevel,
			set: (v: string) => (gtCdLevel = v)
		},
		{
			label: 'Black Hole Duration Level',
			options: bhDuration,
			get: () => bhDurLevel,
			set: (v: string) => (bhDurLevel = v)
		},
		{
			label: 'Black Hole Cooldown Level',
			options: bhCooldown,
			get: () => bhCdLevel,
			set: (v: string) => (bhCdLevel = v)
		}
	]);
</script>

<div class="grid gap-4 sm:grid-cols-2">
	{#each controls as control (control.label)}
		<label class="block text-sm text-muted">
			{control.label}
			<select
				class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
				value={control.get()}
				onchange={(event) => control.set(event.currentTarget.value)}
			>
				{#each control.options as option (option.level)}
					<option value={String(option.level)}>{option.label}</option>
				{/each}
			</select>
		</label>
	{/each}
</div>

<div class="mt-4 overflow-x-auto rounded-md border border-line/70 bg-bg/40">
	<table class="w-full min-w-[20rem] text-left text-sm">
		<thead class="border-b border-line/70 text-xs tracking-wide text-muted uppercase">
			<tr>
				<th class="px-3 py-2 font-medium">Weapon</th>
				<th class="px-3 py-2 font-medium">Duration (s)</th>
				<th class="px-3 py-2 font-medium">Cooldown (s)</th>
				<th class="px-3 py-2 font-medium">Uptime (%)</th>
			</tr>
		</thead>
		<tbody class="font-mono text-fg">
			{#each rows as row (row.name)}
				<tr class="border-b border-line/50 last:border-b-0">
					<td class="px-3 py-2 font-sans text-fg">{row.name}</td>
					<td class="px-3 py-2 text-accent">{row.duration || '—'}</td>
					<td class="px-3 py-2 text-gold">{row.cooldown || '—'}</td>
					<td class="px-3 py-2 text-fg">{formatPct(row.uptime)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
