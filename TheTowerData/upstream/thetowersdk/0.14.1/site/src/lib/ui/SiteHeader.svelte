<script lang="ts">
	import { page } from '$app/state';
	import { nav } from '$lib/content';
	import CreatorCode from '$lib/ui/CreatorCode.svelte';
	import { asset, href } from '$lib/paths';

	let open = $state(false);

	function isActive(path: string): boolean {
		const target = href(path);
		return page.url.pathname === target || page.url.pathname === `${target}`.replace(/\/$/, '');
	}
</script>

<!--
	Sticky, so the nav is reachable from anywhere on a long docs page without scrolling back up.

	`bg-bg/85` rather than a solid fill: the page carries artwork behind it, and an opaque bar would
	cut a hard band across it while scrolling. The blur is what keeps text readable over whatever
	passes underneath.

	## The bar is one line at every width

	Nothing in it may wrap. The nav used to carry `flex-wrap`, which does not fail loudly — it
	relieves the pressure by dropping links onto a second row, so the bar silently doubles in
	height somewhere between the breakpoints and no check notices. `flex-nowrap` turns that same
	pressure into an overflow, which is visible.

	The full nav is five links wide, one of them "What You Can Build", and together with the
	wordmark and the badge it needs about 730px of a bar that is only 704px at `md`. It collapses
	to Menu at `lg`, which is the first width all three actually fit; `md` was the width the
	wrapping happened at.

	The creator code stays in the bar at every width and never moves into the menu. It is the one
	control here with nothing behind it — a nav link has the page it points at, but a code the
	reader never sees does nothing at all. So the wordmark's text yields first on a narrow screen,
	then the nav collapses to Menu; the code never gives up its place.

	## Where "centred" is measured from

	Between the wordmark and the nav, not on the bar's true centre. Only the middle column grows,
	so it centres in the space the other two leave over — which sits a little left of the page's
	midpoint, because the nav is wider than the wordmark. That offset is the intended result: the
	badge is balanced against the things beside it, which is what reads as centred in a header.
	Centring it on the bar instead is a different thing that also happens to overlap the nav below
	about 1058px, since a 90px badge on the midpoint cannot clear 468px of links.
-->
<header
	class="sticky top-0 z-50 border-b border-line/80 bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70"
>
	<div class="relative mx-auto max-w-6xl px-4 py-2">
		<div class="flex flex-nowrap items-center justify-between gap-3">
			<!--
				`min-w-0` so this is the column that gives when the bar is tight: the wordmark can
				shrink, and its text is dropped outright on the narrowest screens, leaving the mark.
			-->
			<a
				href={href('/')}
				aria-label="TheTowerSDK home"
				class="flex min-w-0 shrink items-center gap-2 text-fg no-underline"
			>
				<img
					src={asset('/TheTowerSDK_logo.v5.png')}
					alt=""
					class="h-8 w-8 shrink-0 object-contain"
					width="32"
					height="32"
				/>
				<span class="hidden truncate font-semibold tracking-tight sm:inline">TheTowerSDK</span>
			</a>

			<!--
				The only column that grows, so the badge lands in the middle of the gap the wordmark
				and the nav leave. `shrink-0` because a flex item can be compressed below its content
				width even when it is not allowed to wrap, and a squeezed badge is a broken one.
			-->
			<div class="flex shrink-0 grow justify-center">
				<CreatorCode />
			</div>

			<div class="flex shrink-0 justify-end">
				<button
					type="button"
					class="shrink-0 rounded-md border border-line px-3 py-1 text-sm lg:hidden"
					aria-expanded={open}
					aria-controls="mobile-navigation"
					onclick={() => (open = !open)}
				>
					Menu
				</button>

				<nav
					aria-label="Main navigation"
					class="hidden flex-nowrap justify-end gap-1 text-sm lg:flex"
				>
					{#each nav as item (item.href)}
						<a
							href={href(item.href)}
							aria-current={isActive(item.href) ? 'page' : undefined}
							class={[
								'rounded-md px-2.5 py-1 whitespace-nowrap no-underline',
								isActive(item.href) ? 'bg-accent-dim text-fg' : 'text-muted hover:text-fg'
							]}
						>
							{item.label}
						</a>
					{/each}
				</nav>
			</div>
		</div>

		{#if open}
			<!--
				`absolute top-full`, so the menu hangs over the page instead of being inserted above
				it. In flow it pushed everything down by its own height the moment it opened, which
				moves whatever the reader was looking at — on a phone that is the entire screen
				jumping. It also has to carry its own background and blur: the bar's fill stops at
				the bar, and without one the links render straight over the artwork underneath.
			-->
			<nav
				id="mobile-navigation"
				aria-label="Main navigation"
				class="absolute inset-x-0 top-full flex flex-col gap-1 border-b border-line/80 bg-bg/95 px-4 py-3 text-sm shadow-lg backdrop-blur-md lg:hidden"
			>
				{#each nav as item (item.href)}
					<a
						href={href(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}
						class={[
							'rounded-md px-2.5 py-1 no-underline',
							isActive(item.href) ? 'bg-accent-dim text-fg' : 'text-muted hover:text-fg'
						]}
						onclick={() => (open = false)}
					>
						{item.label}
					</a>
				{/each}
			</nav>
		{/if}
	</div>
</header>
