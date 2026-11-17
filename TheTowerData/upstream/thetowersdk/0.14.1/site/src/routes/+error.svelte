<script lang="ts">
	import { page } from '$app/state';
	import { href } from '$lib/paths';

	/*
	 * `+error.svelte` receives no props.
	 *
	 * This declared `let { error, status } = $props()`, which SvelteKit never fills — so the
	 * heading rendered an empty status and the body always fell through to "Something went
	 * wrong." regardless of what actually happened. The status and the error live on `page`.
	 */
</script>

<h1 class="text-3xl font-semibold">{page.status}</h1>
<p class="mt-2 text-muted">{page.error?.message ?? 'Something went wrong.'}</p>
<p class="mt-4"><a href={href('/')}>Back to TheTowerSDK</a></p>
