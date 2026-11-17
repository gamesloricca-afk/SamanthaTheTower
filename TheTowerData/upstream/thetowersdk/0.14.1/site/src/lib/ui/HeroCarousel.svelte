<script lang="ts">
	/**
	 * The rotating hero.
	 *
	 * A static headline had to pick one of several honest answers to "what is this for". This shows
	 * them in turn, which is also the only thing on the page with motion — the previous passes at
	 * "make it pop" were all static colour, and static colour on a dark page is what the reader's eye
	 * skips over.
	 *
	 * Behaviour worth knowing before changing it:
	 *
	 * - **Every slide is rendered and stacked in one grid cell.** Slides differ in body length, so
	 *   the stage takes its height from the tallest of them at whatever width the reader is at, and
	 *   the controls below never move. Hand-measured heights were correct at two widths and wrong
	 *   between them.
	 * - **Rotation stops on hover, on focus inside, and when the tab is hidden.** A carousel that
	 *   advances while someone is reading a slide, or mid-way through tabbing to its controls, is
	 *   actively hostile. A hidden tab is just wasted timers.
	 * - **`prefers-reduced-motion` removes the animation, not the rotation.** This previously
	 *   suppressed auto-advance entirely, which meant the hero silently never rotated for anyone
	 *   with Windows animations turned off — `MinAnimate = 0` makes Chrome report the query, and
	 *   that is a common setting rather than a rare one. Slides now still advance; they cut instead
	 *   of sliding. The preference is about movement on screen, and a cut has none.
	 * - **Manual interaction pauses rotation, then hands it back.** It used to stop for good, which
	 *   meant a single click on an arrow silently killed the carousel for the rest of the visit.
	 *   Moving a slide out from under someone who just chose it is still the worst thing this can
	 *   do, so the pause is generous — but permanent was the wrong trade.
	 *
	 * The `children` snippet renders between the slides and the controls, so the arrows and dots sit
	 * beneath the whole hero — buttons and install command included — rather than splitting the
	 * headline from its call to action.
	 */
	import type { Snippet } from 'svelte';
	import { heroSlides } from '$lib/content';

	let {
		intervalMs = 5500,
		resumeAfterMs = 20000,
		children
	}: { intervalMs?: number; resumeAfterMs?: number; children?: Snippet } = $props();

	let index = $state(0);
	/** Direction of the last change, so the slide animates in from the side it came from. */
	let direction = $state(1);
	let paused = $state(false);
	/** Set when the reader takes control; cleared again after `resumeAfterMs`. */
	let stopped = $state(false);
	let resumeTimer: number | undefined;

	/**
	 * Hand control back after a quiet spell.
	 *
	 * Re-armed on every interaction, so someone clicking through the slides is never interrupted
	 * mid-browse — the clock only starts once they stop.
	 */
	function holdThenResume() {
		stopped = true;
		if (resumeTimer) window.clearTimeout(resumeTimer);
		resumeTimer = window.setTimeout(() => {
			stopped = false;
		}, resumeAfterMs);
	}

	const count = heroSlides.length;

	function goTo(next: number, dir: number) {
		direction = dir;
		// Wraps in both directions, so "previous" from the first slide lands on the last.
		index = (next + count) % count;
	}

	function step(dir: number) {
		holdThenResume();
		goTo(index + dir, dir);
	}

	function select(target: number) {
		holdThenResume();
		goTo(target, target > index ? 1 : -1);
	}

	$effect(() => {
		if (stopped || paused) return;

		const timer = window.setInterval(() => {
			// Checked here as well as in the guard above: the tab can be hidden mid-interval.
			if (!document.hidden) goTo(index + 1, 1);
		}, intervalMs);
		return () => window.clearInterval(timer);
	});

	// The resume timer outlives the interval effect, so it needs clearing on its own.
	$effect(() => () => {
		if (resumeTimer) window.clearTimeout(resumeTimer);
	});
</script>

<div
	class="hero-carousel"
	role="region"
	aria-roledescription="carousel"
	aria-label="What TheTowerSDK is for"
	onmouseenter={() => (paused = true)}
	onmouseleave={() => (paused = false)}
	onfocusin={() => (paused = true)}
	onfocusout={() => (paused = false)}
>
	<div class="hero-stage" aria-live="polite">
		<!--
			Every slide is rendered, stacked in one grid cell, and all but the active one is hidden.

			The stage is therefore always as tall as its tallest slide AT THE CURRENT VIEWPORT, which
			is the only way this stays still: slide bodies differ in length, and how many lines each
			one wraps to depends on the width. See the note in the stylesheet below.
		-->
		{#each heroSlides as entry, entryIndex (entry.headline)}
			<div
				class="hero-slide"
				class:is-active={entryIndex === index}
				style="--slide-dir: {direction}"
				aria-hidden={entryIndex === index ? undefined : 'true'}
			>
				<p class="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
					{entry.eyebrow}
				</p>
				<h1
					class="headline-gradient mt-3 text-4xl font-bold tracking-tight text-balance sm:text-6xl"
				>
					{entry.headline}
				</h1>
				<p class="mx-auto mt-5 max-w-xl text-lg text-pretty text-muted">{entry.body}</p>
			</div>
		{/each}
	</div>

	{@render children?.()}

	<div
		class="mt-10 flex items-center justify-center gap-3"
		role="group"
		aria-label="Slide controls"
	>
		<button type="button" class="hero-arrow" onclick={() => step(-1)} aria-label="Previous slide">
			<span aria-hidden="true">‹</span>
		</button>

		<div class="flex items-center gap-2" role="tablist" aria-label="Slides">
			{#each heroSlides as item, i (item.headline)}
				<button
					type="button"
					role="tab"
					class="hero-dot"
					class:is-active={i === index}
					aria-selected={i === index}
					aria-label={`Show slide ${i + 1}: ${item.headline}`}
					onclick={() => select(i)}
				></button>
			{/each}
		</div>

		<button type="button" class="hero-arrow" onclick={() => step(1)} aria-label="Next slide">
			<span aria-hidden="true">›</span>
		</button>
	</div>
</div>

<style>
	/*
	 * The stage is as tall as its tallest slide, measured by the browser rather than by hand.
	 *
	 * This used to be two hand-measured `min-height` values, one per breakpoint. They were correct
	 * at the two widths they were measured at and wrong everywhere else: slide bodies differ in
	 * length, so the tallest slide changes with the width, and between the breakpoints the buttons
	 * below jumped on every rotation. Editing any slide's copy silently invalidated both numbers.
	 *
	 * Stacking every slide in one grid cell makes the cell size to the tallest of them at whatever
	 * width the reader is actually at. Nothing to re-measure, and a longer slide cannot reintroduce
	 * the jump.
	 *
	 * `visibility: hidden` and not `display: none`: a hidden slide must still occupy the cell, or it
	 * contributes nothing to the height and the whole point is lost.
	 */
	.hero-stage {
		display: grid;
		position: relative;
	}

	.hero-slide {
		grid-area: 1 / 1;
		visibility: hidden;
		pointer-events: none;
	}

	.hero-slide.is-active {
		visibility: visible;
		pointer-events: auto;
		animation: hero-slide-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes hero-slide-in {
		from {
			opacity: 0;
			transform: translateX(calc(var(--slide-dir) * 2.5rem));
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.hero-arrow {
		display: inline-flex;
		height: 2.5rem;
		width: 2.5rem;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		border: 1px solid color-mix(in srgb, var(--color-fg) 22%, transparent);
		background: rgba(0, 0, 0, 0.35);
		color: color-mix(in srgb, var(--color-fg) 90%, transparent);
		font-size: 1.25rem;
		line-height: 1;
		backdrop-filter: blur(4px);
		transition:
			border-color 160ms ease,
			background-color 160ms ease,
			color 160ms ease;
	}
	.hero-arrow:hover {
		border-color: color-mix(in srgb, var(--color-accent) 60%, transparent);
		background: color-mix(in srgb, var(--color-accent) 12%, transparent);
		color: var(--color-fg);
	}

	.hero-dot {
		height: 0.5rem;
		width: 0.5rem;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--color-fg) 32%, transparent);
		transition:
			width 220ms ease,
			background-color 220ms ease;
	}
	.hero-dot:hover {
		background: color-mix(in srgb, var(--color-fg) 55%, transparent);
	}
	/* The active dot widens into a bar, so the position in the set is readable without counting. */
	.hero-dot.is-active {
		width: 1.5rem;
		background: var(--color-accent);
		box-shadow: 0 0 12px color-mix(in srgb, var(--color-accent) 55%, transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-slide.is-active {
			animation: none;
		}
		.hero-arrow,
		.hero-dot {
			transition: none;
		}
	}
</style>
