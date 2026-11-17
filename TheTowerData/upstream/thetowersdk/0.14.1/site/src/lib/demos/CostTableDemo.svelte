<script lang="ts">
	/**
	 * Renders a cost table as an image, generated from the catalog.
	 *
	 * The output is a real image — an SVG serialized to a data URI — so it can be
	 * saved, posted to Discord, or dropped into a wiki page. Change the data and
	 * the image regenerates; nothing is drawn by hand.
	 */
	import { uwStoneChartData } from 'thetowersdk/data';
	import { formatNumberForDisplay } from 'thetowersdk/formatting';

	const weapons = Object.values(uwStoneChartData);

	let weaponName = $state(
		weapons.find((weapon) => weapon.name === 'Golden Tower')?.name ?? weapons[0]?.name ?? ''
	);

	let weapon = $derived(weapons.find((entry) => entry.name === weaponName) ?? weapons[0]);
	let statNames = $derived((weapon?.stats ?? []).map((stat) => stat.name));

	let statName = $state('');
	$effect(() => {
		if (!statNames.includes(statName)) statName = statNames[0] ?? '';
	});

	let stat = $derived((weapon?.stats ?? []).find((entry) => entry.name === statName));

	/** Stone costs are numbers from level 1; level 0 reads "Unlock". */
	let rows = $derived.by(() => {
		let running = 0;
		return (stat?.levels ?? []).map((level) => {
			const cost = typeof level.cost === 'number' ? level.cost : null;
			if (cost !== null) running += cost;
			return [
				String(level.level),
				String(level.value),
				cost === null ? '—' : formatNumberForDisplay(cost),
				cost === null ? '—' : formatNumberForDisplay(running)
			];
		});
	});

	const HEADERS = ['Level', 'Value', 'Cost', 'Total'];
	const COL_X = [16, 88, 190, 272];
	const ROW_H = 19;
	const TITLE_BASELINE = 18;
	/**
	 * Where the first data row starts.
	 *
	 * Must clear both the title baseline and the column header beneath it —
	 * at 34 the header sat 6px under a 12px title and the two collided.
	 */
	const HEAD_H = 58;
	const BLOCK_W = 360;
	/** Wrap into a second block rather than growing tall enough to need scrolling. */
	const MAX_ROWS_PER_BLOCK = 20;

	function escapeXml(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	let svg = $derived.by(() => {
		const title = `${weapon?.name ?? ''} — ${statName}`;

		// Split into side-by-side blocks so a 39-level stat stays a readable
		// shape instead of a column tall enough to need its own scrollbar.
		const blockCount = Math.max(1, Math.ceil(rows.length / MAX_ROWS_PER_BLOCK));
		const rowsPerBlock = Math.ceil(rows.length / blockCount);
		const width = BLOCK_W * blockCount;
		const height = HEAD_H + rowsPerBlock * ROW_H + 14;

		let markup = '';

		for (let b = 0; b < blockCount; b += 1) {
			const offsetX = b * BLOCK_W;
			const slice = rows.slice(b * rowsPerBlock, (b + 1) * rowsPerBlock);

			markup += HEADERS.map(
				(label, i) =>
					`<text x="${offsetX + COL_X[i]}" y="${HEAD_H - 14}" fill="#8b93a7" font-size="10" ` +
					`font-family="ui-monospace,monospace" letter-spacing="1">${escapeXml(label.toUpperCase())}</text>`
			).join('');

			markup += `<line x1="${offsetX}" y1="${HEAD_H - 6}" x2="${offsetX + BLOCK_W}" y2="${HEAD_H - 6}" stroke="#2b3040"/>`;

			markup += slice
				.map((cells, r) => {
					const y = HEAD_H + r * ROW_H + 13;
					const stripe =
						r % 2 === 1
							? `<rect x="${offsetX}" y="${HEAD_H + r * ROW_H}" width="${BLOCK_W}" height="${ROW_H}" fill="#ffffff" opacity="0.03"/>`
							: '';
					const text = cells
						.map(
							(cell, c) =>
								`<text x="${offsetX + COL_X[c]}" y="${y}" fill="${c === 3 ? '#e7b96b' : '#d5dae5'}" ` +
								`font-size="11" font-family="ui-monospace,monospace">${escapeXml(cell)}</text>`
						)
						.join('');
					return stripe + text;
				})
				.join('');
		}

		return (
			`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
			`viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)} cost table">` +
			`<rect width="${width}" height="${height}" fill="#12151c"/>` +
			`<text x="16" y="${TITLE_BASELINE}" fill="#e7b96b" font-size="12" font-weight="600" ` +
			`font-family="ui-sans-serif,system-ui">${escapeXml(title)}</text>` +
			markup +
			`</svg>`
		);
	});

	let imageSrc = $derived(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
	<label class="block text-sm text-muted">
		Ultimate Weapon
		<select
			class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
			bind:value={weaponName}
		>
			{#each weapons as option (option.name)}
				<option value={option.name}>{option.name}</option>
			{/each}
		</select>
	</label>
	<label class="block text-sm text-muted">
		Stat
		<select
			class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
			bind:value={statName}
		>
			{#each statNames as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</label>
</div>

{#if rows.length > 0}
	<div class="mt-4 rounded-md border border-line/70">
		<img src={imageSrc} alt="{weapon?.name} {statName} cost table" class="block w-full" />
	</div>
	<p class="mt-2 text-xs text-muted">
		Generated SVG · {rows.length} levels · save it, post it, embed it
	</p>
{:else}
	<p class="mt-4 text-sm text-muted">Select a stat to generate its table.</p>
{/if}
