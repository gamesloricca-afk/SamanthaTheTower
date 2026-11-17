<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { dev } from '$app/environment';
	import { href } from '$lib/paths';
	import { pageMetadata, shareLogoUrl, structuredDataMarkup } from '$lib/seo';
	import SiteFooter from '$lib/ui/SiteFooter.svelte';
	import SiteHeader from '$lib/ui/SiteHeader.svelte';
	import PageArt from '$lib/ui/PageArt.svelte';
	import './layout.css';

	let { children } = $props();

	const home = href('/');

	/*
	 * The home page brings its own full-bleed artwork per section, so the page-wide layer would sit
	 * underneath all of it doing nothing but adding a request.
	 */
	const isHome = $derived(
		page.url.pathname === home || page.url.pathname === home.replace(/\/$/, '')
	);
	const metadata = $derived(pageMetadata(page.url.pathname, base));

	/*
	 * Link previews read these. Every URL is absolute, because a crawler resolves nothing against
	 * the page. The logo is square, so `summary` shows it as a thumbnail beside the text.
	 */
	const logoUrl = shareLogoUrl(base);
	const structuredData = structuredDataMarkup(base);
</script>

<svelte:head>
	<!--
		No icon here. `app.html` declares it once, pointing at the real SDK logo.

		This carried a second `<link rel="icon">` at a hand-drawn placeholder SVG — a dark rounded
		square left over from the skeleton. Because the layout renders into `%sveltekit.head%`, which
		sits AFTER the app.html link, the placeholder won every time and the logo never appeared in a
		tab. Two declarations of one thing, and the wrong one silently taking precedence.
	-->
	<title>{metadata.title}</title>
	<meta name="description" content={metadata.description} />
	<link rel="canonical" href={metadata.canonical} />
	<meta
		name="robots"
		content={dev || !metadata.indexable ? 'noindex,follow' : 'index,follow,max-image-preview:large'}
	/>
	<meta name="theme-color" content="#0f1419" />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="TheTowerSDK" />
	<meta property="og:title" content={metadata.title} />
	<meta property="og:description" content={metadata.shareDescription} />
	<meta property="og:url" content={metadata.canonical} />
	<meta property="og:image" content={logoUrl} />
	<meta property="og:image:secure_url" content={logoUrl} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="500" />
	<meta property="og:image:height" content="500" />
	<meta property="og:image:alt" content="TheTowerSDK logo" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={metadata.title} />
	<meta name="twitter:description" content={metadata.shareDescription} />
	<meta name="twitter:image" content={logoUrl} />
	<meta name="twitter:image:alt" content="TheTowerSDK logo" />
	{#if isHome}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- static data with HTML delimiters escaped -->
		{@html structuredData}
	{/if}
</svelte:head>

{#if !isHome}
	<PageArt path={page.url.pathname} />
{/if}

<div class="flex min-h-screen flex-col">
	<a class="skip-link" href="#main-content">Skip to content</a>
	<SiteHeader />
	<main id="main-content" tabindex="-1" class="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
		{@render children()}
	</main>
	<SiteFooter />
</div>
