<script lang="ts">
	import { CALCULATOR_BUILDERS } from 'thetowersdk/builders';
	import { formatNumberForDisplay } from 'thetowersdk/formatting';

	/*
	 * Nothing here knows what any calculator is.
	 *
	 * The picker, every control and its bounds come from the builder's own declaration, so this
	 * renders a calculator it has never heard of — which is the claim the page makes.
	 *
	 * It used to render the number fields only, and print the result as JSON. So a calculator
	 * whose answer depends on a rarity or a weapon silently ran on its default, and every answer
	 * arrived as a wall of braces. Both are fixed here rather than by narrowing what the SDK
	 * declares: selects and switches are field kinds the package already describes.
	 */
	const builders = [...CALCULATOR_BUILDERS].sort((a, b) => a.title.localeCompare(b.title));

	let selectedId = $state(builders[0].id);
	let builder = $derived(builders.find((entry) => entry.id === selectedId) ?? builders[0]);

	const defaultsOf = (entry: (typeof builders)[number]) => ({
		...(entry.defaults as Record<string, unknown>)
	});

	let values = $state<Record<string, unknown>>(defaultsOf(builders[0]));
	let lastId = $state(builders[0].id);
	$effect(() => {
		if (builder.id !== lastId) {
			lastId = builder.id;
			values = defaultsOf(builder);
		}
	});

	/*
	 * `CALCULATOR_BUILDERS` is a union of differently-typed calculators, so across the union the
	 * parameter of `normalize` intersects to `undefined` and no concrete value satisfies it. A
	 * caller who knows which calculator it wants gets full typing from `findCalculatorBuilder`;
	 * this deliberately does not know, so the boundary is crossed once, here.
	 */
	type AnyBuilder = {
		normalize: (input: Record<string, unknown>) => Record<string, unknown>;
		compute: (input: Record<string, unknown>) => Record<string, unknown>;
	};

	let result = $derived.by(() => {
		const untyped = builder as unknown as AnyBuilder;
		try {
			return untyped.compute(untyped.normalize(values));
		} catch (error) {
			return { error: error instanceof Error ? error.message : String(error) };
		}
	});

	/*
	 * Show the answer, not the working.
	 *
	 * Results carry both — a total and the per-level rows behind it. The rows are the reason the
	 * result is useful to a tool and the reason it is unreadable on a page, so scalars are shown
	 * as a summary and anything list-shaped is reported by its length.
	 */
	const summary = $derived.by(() => {
		const rows: Array<{ label: string; value: string }> = [];
		for (const [key, value] of Object.entries(result ?? {})) {
			if (key === 'notes') continue;
			if (typeof value === 'number') {
				rows.push({ label: humanise(key), value: readable(key, value) });
			} else if (typeof value === 'boolean' || typeof value === 'string') {
				rows.push({ label: humanise(key), value: String(value) });
			} else if (Array.isArray(value)) {
				rows.push({ label: humanise(key), value: `${value.length} row(s)` });
			} else if (value && typeof value === 'object') {
				for (const [innerKey, innerValue] of Object.entries(value)) {
					if (typeof innerValue === 'number') {
						rows.push({ label: humanise(innerKey), value: readable(innerKey, innerValue) });
					}
				}
			}
		}
		return rows;
	});

	const notes = $derived((result?.notes as string[] | undefined) ?? []);

	/** `totalShards` -> `Total shards`, so a result field reads like a label. */
	function humanise(key: string) {
		const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_.]/g, ' ');
		return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
	}

	/** Coins and shards reach values a browser prints in exponential notation. The game does not. */
	function readable(key: string, value: number) {
		if (/percent|share|fraction|ratio/i.test(key))
			return `${(value * (value <= 1 ? 100 : 1)).toFixed(2)}%`;
		if (!Number.isFinite(value)) return String(value);
		if (Number.isInteger(value) && Math.abs(value) < 10_000) return String(value);
		return formatNumberForDisplay(value);
	}
</script>

<div>
	<label class="block text-sm text-muted" for="builder-pick">Calculator</label>
	<select
		id="builder-pick"
		class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
		bind:value={selectedId}
	>
		{#each builders as entry (entry.id)}
			<option value={entry.id}>{entry.title}</option>
		{/each}
	</select>
	<p class="mt-2 text-xs text-muted">{builder.summary}</p>

	<div class="mt-4 grid gap-3 sm:grid-cols-2">
		{#each builder.fields as field (field.key)}
			<div class:sm:col-span-2={field.kind === 'select' && (field.options?.length ?? 0) > 12}>
				{#if field.kind === 'boolean'}
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" bind:checked={values[field.key] as boolean} />
						{field.label}
					</label>
				{:else}
					<label class="block text-xs text-muted" for={`f-${field.key}`}>
						{field.label}
						{#if field.kind === 'number' && field.max !== undefined}
							<span class="text-accent"> (max {field.max})</span>
						{/if}
					</label>

					{#if field.kind === 'select'}
						<select
							id={`f-${field.key}`}
							class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
							bind:value={values[field.key]}
						>
							{#each field.options ?? [] as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					{:else if field.kind === 'number'}
						<input
							id={`f-${field.key}`}
							type="number"
							class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
							min={field.min}
							max={field.max}
							bind:value={values[field.key]}
						/>
					{:else}
						<p class="mt-1 text-xs text-muted">
							Left at its default here: this control takes a list.
						</p>
					{/if}
				{/if}

				{#if field.help}
					<p class="mt-1 text-xs text-muted/80">{field.help}</p>
				{/if}
			</div>
		{/each}
	</div>

	<div class="mt-5 rounded-md border border-line/70 bg-bg px-4 py-3">
		{#if result?.error}
			<p class="text-sm text-accent">{result.error}</p>
		{:else}
			<dl class="grid gap-x-6 gap-y-2 sm:grid-cols-2">
				{#each summary as row (row.label)}
					<div class="flex items-baseline justify-between gap-3">
						<dt class="text-xs text-muted">{row.label}</dt>
						<dd class="font-mono text-sm">{row.value}</dd>
					</div>
				{/each}
			</dl>
		{/if}

		{#each notes as note (note)}
			<p class="mt-3 text-xs text-accent">{note}</p>
		{/each}
	</div>
</div>
