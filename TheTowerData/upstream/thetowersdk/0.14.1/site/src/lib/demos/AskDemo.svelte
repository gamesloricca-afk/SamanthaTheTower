<script lang="ts">
	/**
	 * TowerAI, live.
	 *
	 * Calls the same assistant the tracker site and the Discord bot's `/ask` use, through the
	 * `towerai-ask` Appwrite function. The function retrieves from the shared TowerAI knowledge base
	 * and answers from it, so this page holds no key, no corpus and no prompt pipeline — it sends a
	 * question and renders what comes back, formatted the way the tracker formats it.
	 */
	import { SHARED_CHART_REGISTRY } from 'thetowersdk/charts';
	import { renderAssistantMarkdown } from '$lib/ui/assistant-markdown';

	/*
	 * The self-hosted Appwrite the tracker runs on, and the public project id. Both are addresses,
	 * not credentials — they are already in the tracker's own shipped bundle.
	 */
	const APPWRITE = 'https://appwrite.the-tower-run-tracker.com/v1';
	const PROJECT = '68190de700097b8f59df';
	const FUNCTION_ID = 'towerai-ask';

	type Turn = { role: 'user' | 'assistant'; text: string };

	/*
	 * Questions confirmed to answer correctly from the knowledge base on every attempt, each one
	 * paired with a chart that exists in the registry.
	 */
	const SUGGESTIONS = [
		'How do I sync Golden Bot with Death Wave?',
		'What does Golden Tower do?',
		'What are modules in The Tower?'
	];

	/**
	 * Where the rendered charts are served from.
	 *
	 * The images are produced by the tracker's own renderer (`scripts/render-sdk-site-charts.ts`)
	 * and uploaded to Appwrite storage (`scripts/upload-sdk-site-charts.mjs`), so the image shown
	 * here is the same image the tracker shows rather than a second drawing of the same data. They
	 * are hosted rather than committed because forty-odd lossless tables are close to a megabyte,
	 * and the project already runs an Appwrite that serves public files.
	 */
	const CHART_BUCKET = `${APPWRITE}/storage/buckets/sdk-site-charts/files`;

	/** Matches the id scheme in `scripts/upload-sdk-site-charts.mjs`. */
	const chartUrl = (fileName: string) =>
		`${CHART_BUCKET}/${fileName.replace(/\.png$/i, '').replace(/[^a-zA-Z0-9._-]/g, '-')}/view?project=${PROJECT}`;

	/**
	 * The supporting chart for a question, from the package's shared chart registry.
	 *
	 * The registry is the same one the tracker's assistant draws on, so a question only ever pairs
	 * with a chart that actually exists.
	 */
	function chartFor(question: string) {
		const terms = question
			.toLowerCase()
			.split(/[^a-z0-9+]+/)
			.filter((term) => term.length > 2);
		if (terms.length === 0) return null;

		let best: { entry: (typeof SHARED_CHART_REGISTRY)[number]; score: number } | null = null;
		for (const entry of SHARED_CHART_REGISTRY) {
			const haystack = `${entry.title} ${entry.description}`.toLowerCase();
			const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
			if (score >= 2 && (!best || score > best.score)) best = { entry, score };
		}
		return best?.entry ?? null;
	}

	let question = $state('');
	let turns = $state<Turn[]>([]);
	let pending = $state(false);
	let failure = $state<string | null>(null);
	let chart = $state<ReturnType<typeof chartFor>>(null);

	async function ask(text: string) {
		const trimmed = text.trim();
		if (!trimmed || pending) return;

		turns = [...turns, { role: 'user', text: trimmed }];
		question = '';
		pending = true;
		failure = null;
		chart = chartFor(trimmed);

		try {
			/*
			 * Appwrite's REST execution endpoint, called with plain fetch rather than the Appwrite
			 * SDK — this page should not carry a client library to ask one question. The function's
			 * own reply comes back as a JSON string in `responseBody`.
			 */
			const response = await fetch(`${APPWRITE}/functions/${FUNCTION_ID}/executions`, {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'x-appwrite-project': PROJECT },
				body: JSON.stringify({
					body: JSON.stringify({ question: trimmed }),
					async: false,
					method: 'POST',
					path: '/'
				})
			});

			const execution = await response.json().catch(() => null);
			let payload: {
				ok?: boolean;
				answer?: string;
				message?: string;
			} | null = null;
			try {
				payload = execution?.responseBody ? JSON.parse(execution.responseBody) : null;
			} catch {
				payload = null;
			}

			if (!response.ok || !payload?.ok || !payload.answer) {
				/*
				 * Say what happened rather than inventing an answer. A demo that fabricates when the
				 * service is down is worse than one that admits it.
				 */
				failure = payload?.message ?? `The assistant returned ${response.status}.`;
				return;
			}

			turns = [...turns, { role: 'assistant', text: String(payload.answer) }];
		} catch {
			failure = 'Could not reach the assistant.';
		} finally {
			pending = false;
		}
	}
</script>

<!--
	Laid out as a chat, not as a fixed-height box.

	The transcript grows with its content and the page scrolls, so there is no inner scrollbar and no
	empty space under a short answer. The prompts stay visible after one is used, so a reader can try
	the next without reloading.
-->
<div class="flex flex-col gap-4">
	<p class="text-sm text-muted">
		Ask about a mechanic. This calls the live assistant — the same one behind the tracker site and
		the bot's <code>/ask</code> — which answers from the shared TowerAI knowledge base.
	</p>

	<div class="flex flex-wrap gap-2">
		{#each SUGGESTIONS as suggestion (suggestion)}
			<button
				type="button"
				class="rounded-md border border-line px-2 py-1 text-xs text-muted hover:border-accent hover:text-fg disabled:opacity-50"
				disabled={pending}
				onclick={() => ask(suggestion)}
			>
				{suggestion}
			</button>
		{/each}
	</div>

	<!-- Transcript first, composer under it — the way every chat window is read. -->
	{#if turns.length || pending || failure}
		<div class="space-y-4 border-t border-line/70 pt-4">
			{#each turns as turn, index (index)}
				{#if turn.role === 'user'}
					<div>
						<p class="text-xs tracking-wide text-accent uppercase">You</p>
						<p class="mt-1 font-medium">{turn.text}</p>
					</div>
				{:else}
					<div>
						<p class="text-xs tracking-wide text-accent uppercase">TowerAI</p>
						<div class="assistant-reply mt-1 text-sm">
							<!--
								The markup is produced by `renderAssistantMarkdown`, which runs the model's reply
								through DOMPurify before it is returned. This is the one sink on the site, and it
								is sanitized at the source rather than here.
							-->
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html renderAssistantMarkdown(turn.text)}
						</div>
					</div>
				{/if}
			{/each}

			{#if pending}
				<p class="text-sm text-muted">Thinking…</p>
			{/if}
			{#if failure}
				<p class="text-sm text-accent">{failure}</p>
			{/if}

			{#if chart && !pending}
				<figure class="rounded-md border border-line/70 bg-bg/40 p-3">
					<figcaption class="mb-2 text-xs font-semibold tracking-wide text-accent uppercase">
						{chart.title}
					</figcaption>
					<img
						src={chartUrl(chart.fileName)}
						alt={chart.description}
						loading="lazy"
						class="max-h-[28rem] w-auto rounded"
					/>
				</figure>
			{/if}
		</div>
	{/if}

	<form
		class="flex gap-2"
		onsubmit={(event) => {
			event.preventDefault();
			ask(question);
		}}
	>
		<input
			class="w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
			bind:value={question}
			placeholder="Ask about a mechanic…"
			autocomplete="off"
			disabled={pending}
		/>
		<button
			type="submit"
			class="rounded-md border border-line px-3 py-2 text-sm disabled:opacity-50"
			disabled={pending || !question.trim()}
		>
			Ask
		</button>
	</form>
</div>

<style>
	/*
	 * Markdown from the assistant arrives as real HTML, so the elements it produces need spacing.
	 * `:global` is required because the markup is injected rather than compiled from this template.
	 */
	.assistant-reply :global(p) {
		margin: 0.5rem 0;
	}
	.assistant-reply :global(ul),
	.assistant-reply :global(ol) {
		margin: 0.5rem 0;
		padding-left: 1.25rem;
		list-style: revert;
	}
	.assistant-reply :global(li) {
		margin: 0.25rem 0;
	}
	.assistant-reply :global(strong) {
		color: var(--color-fg);
		font-weight: 600;
	}
	.assistant-reply :global(code) {
		border-radius: 0.25rem;
		background: rgba(0, 0, 0, 0.35);
		padding: 0.05rem 0.3rem;
	}
	.assistant-reply :global(table) {
		width: 100%;
		margin: 0.75rem 0;
		border-collapse: collapse;
		font-size: 0.85em;
	}
	.assistant-reply :global(th),
	.assistant-reply :global(td) {
		border: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent);
		padding: 0.25rem 0.5rem;
		text-align: left;
	}
	.assistant-reply :global(h1),
	.assistant-reply :global(h2),
	.assistant-reply :global(h3) {
		margin: 0.75rem 0 0.25rem;
		font-size: 1em;
		font-weight: 600;
		color: var(--color-fg);
	}
</style>
