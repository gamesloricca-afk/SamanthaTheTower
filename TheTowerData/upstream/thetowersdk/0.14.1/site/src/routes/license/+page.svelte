<script lang="ts">
	import { LINKS } from '$lib/links';
	import { href } from '$lib/paths';
	import { buildLicenseIssueUrl, isValidPlayerId, playerIdHint } from '$lib/player-id';
	import GlassPanel from '$lib/ui/GlassPanel.svelte';

	let playerId = $state('');
	let github = $state('');

	let hint = $derived(playerIdHint(playerId));
	let valid = $derived(isValidPlayerId(playerId) && github.trim().length > 0);

	function requestLicense() {
		const url = buildLicenseIssueUrl({
			playerId,
			github,
			repo: LINKS.siteRepo
		});
		window.open(url, '_blank', 'noopener,noreferrer');
	}
</script>

<p class="text-xs font-semibold tracking-[0.18em] text-gold uppercase">Players</p>
<h1 class="mt-2 text-3xl font-semibold">Player License</h1>
<p class="mt-2 max-w-2xl text-muted">
	TheTowerSDK itself is free for everyone to install and use — community tools, personal projects,
	or commercial apps.
</p>
<p class="mt-3 max-w-2xl text-muted">
	Separately, Tower players can get <strong>Agentic Cognition Substrate</strong> for free for personal,
	non-commercial Tower work. That grant is tied to your in-game Player ID.
</p>

<div class="mt-8 grid gap-4 md:grid-cols-2">
	<GlassPanel>
		<p class="text-xs tracking-wide text-muted uppercase">TheTowerSDK</p>
		<p class="mt-1 font-medium">Free for everyone</p>
		<p class="mt-2 text-sm text-muted">
			Install from npm and build. No Player ID needed for the SDK.
		</p>
	</GlassPanel>
	<GlassPanel>
		<p class="text-xs tracking-wide text-gold uppercase">ACS for Tower players</p>
		<p class="mt-1 font-medium">Personal grant</p>
		<p class="mt-2 text-sm text-muted">
			Optional AI governance tooling for your own local Tower projects. Not the same thing as the
			SDK.
		</p>
		<p class="mt-3 text-sm"><a href={href('/ai/#ags')}>How AI &amp; ACS Fit Together →</a></p>
	</GlassPanel>
</div>

<section class="mt-10 max-w-xl">
	<h2 class="text-xl font-medium">Request Free Personal ACS</h2>
	<p class="mt-2 text-sm text-muted">
		In The Tower: Settings → Player ID (digits). Used only to confirm you play and to bind the
		grant.
	</p>
	<p class="mt-2 text-sm text-muted">
		A key may not be granted to accounts with no meaningful play history.
	</p>

	<form
		class="mt-6 space-y-4"
		onsubmit={(event) => {
			event.preventDefault();
			if (valid) requestLicense();
		}}
	>
		<label class="block text-sm">
			<span class="text-muted">Tower Player ID</span>
			<input
				class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 font-mono text-fg"
				bind:value={playerId}
				inputmode="numeric"
				autocomplete="off"
				placeholder="e.g. 12345678"
				required
			/>
			{#if hint}
				<span class="mt-1 block text-xs text-gold">{hint}</span>
			{/if}
		</label>
		<label class="block text-sm">
			<span class="text-muted">GitHub username</span>
			<input
				class="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-fg"
				bind:value={github}
				autocomplete="username"
				placeholder="your-github"
				required
			/>
		</label>
		<button
			type="submit"
			class="rounded-md bg-gold px-4 py-2 font-medium text-bg disabled:opacity-40"
			disabled={!valid}
		>
			Submit ACS request
		</button>
		<p class="text-xs text-muted">
			Opens a GitHub issue with your Player ID and GitHub username. Requests are reviewed by hand.
		</p>
	</form>
</section>
