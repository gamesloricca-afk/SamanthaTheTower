<script lang="ts">
	import { onMount } from 'svelte';
	import { asset } from '$lib/paths';
	import { artTileForPath, ART_TILE_COUNT } from '$lib/art';

	/**
	 * The page backdrop, which changes as you read.
	 *
	 * One image behind a two-thousand-pixel page means the reader sees the same surface for the
	 * whole scroll, so a long document looks like it is not moving. This advances the backdrop at
	 * the section boundaries the page already has — its headings — so the change lands where the
	 * subject changes rather than at an arbitrary pixel count.
	 *
	 * Two stacked layers, not one: swapping `background-image` on a single element cuts, and a cut
	 * behind body copy reads as a glitch. The inactive layer is loaded and faded up underneath, so
	 * the change is a cross-fade with no flash of the page's own colour between images.
	 *
	 * The starting tile comes from the route, so a page keeps the backdrop a returning reader
	 * remembers, and the nav pages are each given a different one outright — see `$lib/art`.
	 */
	let { path }: { path: string } = $props();

	const startTile = $derived(artTileForPath(path));

	/** Which of the two layers is currently on top. */
	let showingA = $state(true);
	let tileA = $state(1);
	let tileB = $state(2);
	let steps = $state(0);

	/* Reset to the page's own tile whenever the route changes. */
	$effect(() => {
		const start = startTile;
		steps = 0;
		showingA = true;
		tileA = start;
		tileB = (start % ART_TILE_COUNT) + 1;
	});

	const tileUrl = (tile: number) => `url(${asset(`/feature-${tile}.webp`)})`;

	onMount(() => {
		/*
		 * Headings are the section boundaries, and the page already declares them. Deriving the
		 * change points from the document means a page that grows a section gets another backdrop
		 * change for free, and one that loses a section stops changing there — no list to maintain
		 * and nothing to fall out of step.
		 */
		const headings = [...document.querySelectorAll('main h2, main h3')];
		if (headings.length === 0) return;

		/*
		 * `steps` counts how many boundaries are above the top of the viewport, so scrolling back up
		 * returns to the earlier image rather than continuing forward. A backdrop that only advances
		 * makes the same page look different depending on how you arrived at a point in it.
		 */
		const recount = () => {
			const line = window.scrollY + window.innerHeight * 0.35;
			let passed = 0;
			for (const heading of headings) {
				const top = heading.getBoundingClientRect().top + window.scrollY;
				if (top < line) passed += 1;
			}
			/* Every other heading, so a page of short subsections does not strobe. */
			const next = Math.floor(passed / 2);
			if (next === steps) return;

			const tile = ((startTile - 1 + next) % ART_TILE_COUNT) + 1;
			steps = next;

			/*
			 * Decode the next image BEFORE swapping to it.
			 *
			 * Setting the layer's image and flipping which one is visible in the same frame starts a
			 * 900ms fade to an image the browser has not finished decoding — so the layer fades up
			 * empty and the picture appears all at once partway through. It reads as a jump, which is
			 * the opposite of what the fade is for.
			 *
			 * Waiting costs nothing on a tile already in cache, which after the first pass is all of
			 * them.
			 */
			preload(tile).then(() => {
				if (showingA) tileB = tile;
				else tileA = tile;
				showingA = !showingA;
			});
		};

		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local preload cache; rendering does not read its membership
		const decoded = new Set<number>();

		function preload(tile: number): Promise<void> {
			if (decoded.has(tile)) return Promise.resolve();
			return new Promise((resolve) => {
				const image = new Image();
				/* Resolve either way: a tile that fails to load must not stop the backdrop changing. */
				image.onload = image.onerror = () => {
					decoded.add(tile);
					resolve();
				};
				image.src = asset(`/feature-${tile}.webp`);
			});
		}

		let queued = false;
		const onScroll = () => {
			if (queued) return;
			queued = true;
			requestAnimationFrame(() => {
				queued = false;
				recount();
			});
		};

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });
		recount();
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});
</script>

<div class="page-art-stack" aria-hidden="true">
	<div class="page-art" class:is-on={showingA} style="--section-art: {tileUrl(tileA)}"></div>
	<div class="page-art" class:is-on={!showingA} style="--section-art: {tileUrl(tileB)}"></div>
</div>
