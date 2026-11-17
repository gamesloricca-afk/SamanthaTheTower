<script lang="ts">
	import { homeExamples, moreExamples } from '$lib/content';
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import GlassPanel from '$lib/ui/GlassPanel.svelte';
	import LabsDemo from '$lib/demos/LabsDemo.svelte';
	import SyncUptimeDemo from '$lib/demos/SyncUptimeDemo.svelte';
	import WaveDemo from '$lib/demos/WaveDemo.svelte';
	import SaveDemo from '$lib/demos/SaveDemo.svelte';
	import ModuleCostDemo from '$lib/demos/ModuleCostDemo.svelte';
	import CardGemDemo from '$lib/demos/CardGemDemo.svelte';
	import EffectivePathDemo from '$lib/demos/EffectivePathDemo.svelte';
	import GlossaryDemo from '$lib/demos/GlossaryDemo.svelte';
	import BuildersDemo from '$lib/demos/BuildersDemo.svelte';

	/*
	 * Paired by TITLE, not by position.
	 *
	 * This spread `moreExamples[n]` beside a hand-listed component, and the two lists had drifted:
	 * `moreExamples[0]` is "Generate A Cost Table", which has no interactive panel, so every
	 * pairing after it sat one place out. The page showed the Effective Paths sample above the
	 * glossary demo and the glossary sample above the builders demo — each code block describing
	 * the panel beside it, and none of them matching it.
	 *
	 * A name cannot drift silently: a renamed or missing example throws here instead.
	 */
	const byTitle = new Map(
		[...homeExamples, ...moreExamples].map((example) => [example.title as string, example])
	);

	const LAYOUT = [
		['Lab Costs', LabsDemo, 'Live'],
		['Golden Tower vs Black Hole Uptime', SyncUptimeDemo, 'Live'],
		['Enemy Stats', WaveDemo, 'Live'],
		['Read A Save', SaveDemo, 'Sample'],
		// Code-only. Claiming it had a demo is what pushed everything below it out of step.
		['Generate A Cost Table', null, 'Code'],
		['Module Shard Cost', ModuleCostDemo, 'Live'],
		['Card Gem Cost', CardGemDemo, 'Live'],
		['Effective Paths', EffectivePathDemo, 'Live'],
		['Glossary Lookup', GlossaryDemo, 'Live'],
		['Any Calculator, From Its Own Declaration', BuildersDemo, 'Live']
	] as const;

	const paired = LAYOUT.map(([title, Demo, panel]) => {
		const example = byTitle.get(title);
		if (!example) throw new Error(`playground: no example titled "${title}"`);
		return { ...example, Demo, panel };
	});
</script>

<p class="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Examples</p>
<h1 class="mt-2 text-3xl font-semibold">Examples</h1>
<p class="mt-2 max-w-2xl text-muted">
	Labs, cards, uptime, enemy stats, saves, modules, Effective Paths, and the package glossary.
</p>

<div class="mt-8 space-y-10">
	{#each paired as item (item.title)}
		{@const Demo = item.Demo}
		<section>
			<h2 class="text-lg font-medium">{item.title}</h2>
			<p class="mt-1 mb-4 text-sm text-muted">{item.blurb}</p>
			<div class="grid gap-4 lg:grid-cols-2">
				{#if Demo}
					<GlassPanel>
						<p class="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">
							{item.panel}
						</p>
						<svelte:boundary>
							{#snippet failed(error)}
								<p class="text-sm text-muted">
									This demo failed to load
									{#if error instanceof Error}
										({error.message})
									{/if}
									. The code sample still works.
								</p>
							{/snippet}
							<Demo />
						</svelte:boundary>
					</GlassPanel>
				{/if}
				<GlassPanel>
					<p class="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">Code</p>
					<CodeBlock code={item.code} />
				</GlassPanel>
			</div>
		</section>
	{/each}
</div>
