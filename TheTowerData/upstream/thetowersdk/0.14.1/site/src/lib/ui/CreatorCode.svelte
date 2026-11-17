<script lang="ts">
	import { asset } from '$lib/paths';

	/**
	 * The creator code, as it appears on the Run Tracker's header.
	 *
	 * Using the code in the in-game webstore supports the project at no cost to the player, so the
	 * button states the code rather than explaining it — the whole thing has to read in the width of
	 * a header slot, and anyone who does not already know what a creator code is will not be
	 * persuaded by two more words.
	 *
	 * Rebuilt rather than copied. The tracker's is Vuetify (`v-btn`, `v-avatar`) and this site is
	 * Svelte with Tailwind tokens; porting the markup would have dragged a component library in for
	 * one button. The design is the same — game logo, small label stacked over the code — because
	 * the two sites should look like the same hand made them.
	 *
	 * `variant` exists because the footer needs the same object at a different weight: quieter,
	 * inline with the other footer links, and not competing with the header's copy of itself.
	 *
	 * `tower-logo.webp` is a copy of `tower-assets/assets/site/towerlogo.webp`, the same asset the
	 * Run Tracker's header uses, so the two headers cannot drift apart.
	 *
	 * That asset used to ship with its background baked in and no alpha channel at all — a dark
	 * brown square that read as a tile sitting on the bar. Both copies are now the alpha cut. The
	 * art is neon glow on that ground and there is no edge to key against, so the cut is by
	 * luminance: the background tops out around L=26 and the glow runs to L=255, and the result is
	 * unpremultiplied so compositing reproduces the original over a dark ground. It assumes a dark
	 * ground for exactly that reason — on a light one the glow has nothing to read against, which
	 * is fine for both of these sites and would not be for a third.
	 */
	let { variant = 'header' }: { variant?: 'header' | 'footer' } = $props();

	const STORE = 'https://store.techtreegames.com/thetower/';
	const CODE = 'JDEVO';
</script>

<a
	class="creator-code"
	class:is-footer={variant === 'footer'}
	href={STORE}
	rel="noopener noreferrer"
	target="_blank"
	title="Use code {CODE} in the in-game webstore to support the project"
>
	<img class="creator-code__icon" src={asset('/tower-logo.webp')} alt="" width="22" height="22" />
	<span class="creator-code__stack">
		<span class="creator-code__label">Creator Code</span>
		<span class="creator-code__value">{CODE}</span>
	</span>
</a>

<style>
	.creator-code {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 8px;
		border-radius: 0.5rem;
		white-space: nowrap;
		text-decoration: none;
		color: inherit;
		transition:
			background-color 150ms ease,
			opacity 150ms ease;
	}

	.creator-code:hover {
		background-color: color-mix(in srgb, currentColor 10%, transparent);
	}

	.creator-code__icon {
		width: 22px;
		height: 22px;
		object-fit: contain;
		display: block;
		flex: 0 0 auto;
		background: transparent;
	}

	.creator-code__stack {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.creator-code__label {
		font-size: 8px;
		color: var(--color-fg);
	}

	.creator-code__value {
		font-size: 13px;
		font-weight: 600;
	}

	/* Quieter in the footer, where it sits beside links rather than acting as one. */
	.is-footer {
		color: var(--color-fg);
	}

	.is-footer:hover {
		opacity: 1;
	}
</style>
