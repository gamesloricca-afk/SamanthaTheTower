<script lang="ts">
	import { docsNav } from '$lib/content';
	import { href } from '$lib/paths';
	import { page } from '$app/state';

	let { children } = $props();

	function isActive(path: string): boolean {
		const target = href(path);
		const here = page.url.pathname;
		if (path === '/docs/') {
			return here === target || here === target.replace(/\/$/, '');
		}
		return here === target || here.startsWith(target);
	}

	/**
	 * The current page's own headings, read from the rendered article.
	 *
	 * Read from the DOM rather than declared in `content.ts`, because a list of subsections kept
	 * beside the nav is a list that goes stale the first time a page gains a section — and it goes
	 * stale silently, since a table of contents missing an entry still renders perfectly. The
	 * headings are already on the page; this just indexes them.
	 *
	 * Only the open page expands. Subsections under a page nobody is reading are noise, and the
	 * sidebar has to stay short enough to scan.
	 */
	let sections = $state<{ id: string; text: string }[]>([]);
	let activeId = $state('');

	/*
	 * Open by default, and collapsible.
	 *
	 * Below the two-column breakpoint the sidebar stacks ABOVE the article, so on a phone every
	 * docs page opened with a full-height table of contents between the reader and the first
	 * paragraph. Collapsing it is the fix; defaulting it closed is not, because then the
	 * navigation is invisible on exactly the screens where it is hardest to discover.
	 */
	let open = $state(true);

	$effect(() => {
		/* Re-read when the route changes; the article is replaced, not mutated. */
		void page.url.pathname;

		const article = document.querySelector('article');
		if (!article) {
			sections = [];
			return;
		}

		const found = [...article.querySelectorAll('h2')].map((heading, index) => {
			/*
			 * Give a heading an id if it has none. Without one there is nothing to link to, and
			 * every page here writes plain `<h2>` — asking each to carry an id by hand is the same
			 * staleness problem in a different place.
			 *
			 * A heading linked to from ANOTHER page must still declare its id in the markup: these
			 * are assigned in the browser, and the prerender link check runs before any of that.
			 * It caught exactly that, which is the check doing its job.
			 */
			if (!heading.id) {
				heading.id =
					heading.textContent
						?.toLowerCase()
						.replace(/[^a-z0-9]+/g, '-')
						.replace(/^-+|-+$/g, '') || `section-${index}`;
			}
			return { id: heading.id, text: heading.textContent?.trim() ?? '' };
		});

		/*
		 * Read `headings`, not `sections`, from here on.
		 *
		 * Reading the state this effect just wrote makes the effect depend on it, so it invalidates
		 * itself: every re-run disconnected the observer it had just created and the active-section
		 * highlight never appeared. The list is already in hand — use it.
		 */
		const headings = found.filter((entry) => entry.text.length > 0);
		sections = headings;

		if (headings.length === 0) return;

		/*
		 * Highlight whichever section the reader is inside.
		 *
		 * This was an IntersectionObserver on the headings, which only ever fires while a heading is
		 * on screen — so scrolling into the body of a long section left nothing highlighted at all,
		 * which is precisely when the contents list is most useful. Being "in" a section is a
		 * question about the last heading ABOVE the reading line, and that is what this asks.
		 */
		const line = () => window.scrollY + 96;

		const recount = () => {
			let current = headings[0]!.id;
			for (const entry of headings) {
				const element = document.getElementById(entry.id);
				if (!element) continue;
				if (element.getBoundingClientRect().top + window.scrollY <= line()) current = entry.id;
				else break;
			}

			/*
			 * Assigned, never compared against.
			 *
			 * Reading `activeId` here would make this effect depend on state it writes, so every
			 * highlight change would tear the effect down and rebuild it — listeners and all. Svelte
			 * skips the update when a primitive is unchanged, so the comparison bought nothing and
			 * cost that.
			 */
			activeId = current;
			revealActive(current);
		};

		/*
		 * Keep the highlighted entry inside the sidebar's own scroll.
		 *
		 * The sidebar scrolls independently once it is taller than the screen, so on a long page the
		 * current entry is often below its fold — the highlight was moving correctly and could not
		 * be seen doing it, which from the outside is indistinguishable from not working at all.
		 */
		const revealActive = (id: string) => {
			const aside = document.querySelector('.doc-aside');
			const link = aside?.querySelector<HTMLElement>(`.doc-subnav a[href="#${CSS.escape(id)}"]`);
			if (!aside || !link) return;

			const box = aside.getBoundingClientRect();
			const item = link.getBoundingClientRect();
			if (item.top >= box.top && item.bottom <= box.bottom) return;

			/* Centred, and only within the aside — `scrollIntoView` would move the page as well. */
			aside.scrollTop += item.top - box.top - box.height / 2 + item.height / 2;
		};

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

<div class="doc-layout" class:is-collapsed={!open}>
	<aside class="doc-column">
		<div class="doc-aside">
			<button
				type="button"
				class="doc-toc-toggle"
				aria-expanded={open}
				aria-controls="docs-toc"
				onclick={() => (open = !open)}
			>
				<span class="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Docs</span>
				<span class="doc-toc-chevron" class:is-open={open} aria-hidden="true">›</span>
			</button>
			<nav
				id="docs-toc"
				class="mt-3 flex-col gap-0.5 text-sm"
				class:hidden={!open}
				class:flex={open}
			>
				{#each docsNav as item (item.href)}
					{@const open = isActive(item.href)}
					<a
						href={href(item.href)}
						class={[
							'rounded-md px-2.5 py-1.5 no-underline',
							open ? 'bg-accent-dim text-fg' : 'text-muted hover:text-fg'
						]}
						aria-current={open ? 'page' : undefined}
					>
						{item.label}
					</a>

					{#if open && sections.length > 0}
						<ul class="doc-subnav">
							{#each sections as section (section.id)}
								<li>
									<a
										href={`#${section.id}`}
										class="doc-subnav-link"
										class:is-active={activeId === section.id}
										aria-current={activeId === section.id ? 'true' : undefined}
									>
										{section.text}
									</a>
								</li>
							{/each}
						</ul>
					{/if}
				{/each}
			</nav>
		</div>
	</aside>
	<article class="max-w-3xl min-w-0">
		{@render children()}
	</article>
</div>

<style>
	/*
	 * The sidebar scrolls itself once it is taller than the viewport.
	 *
	 * `position: sticky` pins the top and nothing else: a list longer than the screen had its
	 * bottom entries permanently below the fold, reachable only by scrolling the article all the
	 * way down — at which point the sticky element has moved anyway. Giving it a height and its own
	 * overflow is what makes a long contents list usable.
	 */
	/*
	 * Collapsing gives the space back rather than leaving a hole.
	 *
	 * The toggle used to hide the list inside a column that stayed 200px wide, so the article never
	 * got the room — a collapse that costs a click and returns nothing. The column is a grid track,
	 * so collapsing it to `auto` narrows it to the toggle itself and the article takes the rest.
	 */
	.doc-layout {
		display: grid;
		gap: 2rem;

		/*
		 * One place for the column width.
		 *
		 * The toggle is pinned to the viewport and so cannot read the grid track: `width: inherit`
		 * on an out-of-flow element gives the parent's computed `auto`, which is what sized the
		 * whole panel to its longest entry once before. A variable is read by both and guesses at
		 * nothing.
		 */
		--doc-col: 200px;
		--doc-toggle-h: 1.75rem;
		/*
		 * The site header is sticky and 60px tall, so anything pinned above that sits behind it.
		 * The first attempt put the toggle at 1rem and it vanished under the nav bar — visible to a
		 * measurement, invisible to a reader.
		 */
		--doc-header-h: 60px;
	}

	@media (min-width: 768px) {
		.doc-layout {
			grid-template-columns: var(--doc-col) minmax(0, 1fr);
		}

		/*
		 * Wide enough for the toggle itself. The panel is fixed, so a column narrower than its own
		 * button does not clip it — it overlaps the article instead, which is worse than either.
		 */
		.doc-layout.is-collapsed {
			grid-template-columns: 4.75rem minmax(0, 1fr);
			gap: 1.25rem;
		}
	}

	/*
	 * Sticky, not fixed.
	 *
	 * Fixed was an attempt to keep the contents on screen past the end of the article, and it broke
	 * three things at once: `width: inherit` on an out-of-flow element inherits the parent's
	 * COMPUTED width, which for a grid item is `auto` — so the panel sized itself to its longest
	 * entry, stopped wrapping, overlapped the article and then covered the footer.
	 *
	 * Sticky cannot do any of that. It stays in the grid track, so it takes the track's width and
	 * wraps inside it, and it is bounded by the layout — which means it holds position for the whole
	 * article and releases exactly as the footer arrives, rather than sitting on top of it.
	 */
	.doc-column {
		position: relative;
	}

	@media (min-width: 768px) {
		/*
		 * The toggle is pinned to the viewport; the list is sticky beneath it.
		 *
		 * Sticky is bounded by its grid area, so near the end of an article the panel rides up and
		 * takes the toggle with it — and the toggle is the one control that must always be there.
		 * It is a short, fixed-width button, so pinning it carries none of the risk that pinning
		 * the whole panel did: nothing to wrap, and at 1rem from the top it never reaches the
		 * footer.
		 */
		/*
		 * Two classes, because the base `.doc-toc-toggle` rule sits further down this stylesheet.
		 * At equal specificity the later rule wins, so `width: 100%` beat `width: var(--doc-col)`
		 * and the pinned button stretched to 885px across the article. Order is not a thing to rely
		 * on when one of the rules is inside a media query.
		 */
		.doc-column .doc-toc-toggle {
			position: fixed;
			top: calc(var(--doc-header-h) + 0.75rem);
			z-index: 2;
			width: var(--doc-col);
			height: var(--doc-toggle-h);
		}

		.doc-column .doc-aside {
			position: sticky;
			top: calc(var(--doc-header-h) + 0.75rem + var(--doc-toggle-h));
			align-self: start;
			padding-top: 0.5rem;
			max-height: calc(100vh - var(--doc-header-h) - 2rem - var(--doc-toggle-h));
		}

		/*
		 * The list fades out under the toggle rather than being hidden by a panel behind it.
		 *
		 * An opaque strip reads as a box sitting on the page. A mask lets the entries thin out as
		 * they pass beneath, which is what the eye expects of something scrolling under a heading.
		 */
		/*
		 * The mask goes on the LIST, not the panel.
		 *
		 * The toggle is fixed but still a child of the panel, and a mask applies to everything
		 * inside it — so the first version faded the word "Docs" along with the entries passing
		 * under it. The thing doing the covering must not be the thing being faded.
		 */
		.doc-column .doc-aside > nav {
			mask-image: linear-gradient(180deg, transparent 0, #000 1.25rem);
		}
	}

	.doc-aside {
		max-height: calc(100vh - 2rem);
		overflow-y: auto;
		/*
		 * Never horizontally.
		 *
		 * Setting `overflow-y: auto` computes `overflow-x` to `auto` as well, so a long entry —
		 * "Plasma Cannon BC Reduction Lab Level" — put a scrollbar along the bottom of the
		 * navigation. The text wraps instead; a contents list is one of the few places where two
		 * short lines are simply better than one clipped one.
		 */
		overflow-x: hidden;
		/*
		 * No `overscroll-behavior: contain` here.
		 *
		 * It stops the scroll chaining to the page, so a wheel over the sidebar moved the page not
		 * at all once the list hit its end — the pointer sits over the navigation often, and the
		 * page simply refusing to move is the kind of wrongness that is hard to name.
		 */
		/*
		 * A scrollbar only while the pointer is over it. A permanent gutter down the side of a
		 * navigation list is visual noise on a surface that is mostly not being scrolled, and on
		 * Windows it is an opaque grey bar rather than an overlay.
		 */
		scrollbar-width: none;
	}

	.doc-aside::-webkit-scrollbar {
		width: 0;
	}

	.doc-aside:hover,
	.doc-aside:focus-within {
		scrollbar-width: thin;
		scrollbar-color: var(--color-line) transparent;
	}

	.doc-aside:hover::-webkit-scrollbar,
	.doc-aside:focus-within::-webkit-scrollbar {
		width: 6px;
	}

	.doc-aside::-webkit-scrollbar-thumb {
		background: var(--color-line);
		border-radius: 3px;
	}

	@media (max-width: 767px) {
		/* Stacked above the article, where a fixed height would clip it instead of helping. */
		.doc-aside {
			max-height: none;
			overflow-y: visible;
		}
	}

	/*
	 * Pinned inside the panel's own scroll.
	 *
	 * The contents list scrolls itself once it outgrows the screen, and the toggle sits at the top
	 * of it — so scrolling the list, or the highlight scrolling it for you, carried the only way to
	 * collapse the sidebar out of sight. It is the one control here that must never be unreachable.
	 */
	.doc-toc-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		padding: 0.25rem 0;
		border: 0;
		cursor: pointer;
		color: inherit;
	}

	/*
	 * A fixed square, so rotating it cannot push past the sidebar's edge.
	 *
	 * `transform` does not move layout but it does extend visual overflow: the rotated chevron sat
	 * 27px beyond the right edge and gave a 200px-wide aside a 210px scroll width. Nothing showed a
	 * scrollbar once overflow-x was hidden, but the glyph was being clipped — the fix is for it to
	 * fit, not to hide the evidence that it does not.
	 */
	.doc-toc-chevron {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		flex: none;
		line-height: 1;
		transition: transform 180ms ease;
		color: var(--color-muted);
	}

	.doc-toc-chevron.is-open {
		transform: rotate(90deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.doc-toc-chevron {
			transition: none;
		}
	}

	.doc-subnav a,
	.doc-layout :global(nav a) {
		overflow-wrap: anywhere;
		hyphens: auto;
	}

	/*
	 * Styled here, not with utilities.
	 *
	 * `layout.css` sets `a { color: var(--color-accent) }`, and a bare element selector in a global
	 * stylesheet beats a single Tailwind class — so `text-accent` and `text-muted` both rendered
	 * rgb(61, 155, 253) and the current section looked identical to every other. The class WAS being
	 * applied the whole time. Two tests asserted exactly that and passed, which is the difference
	 * between checking what the code does and checking what a reader sees.
	 *
	 * These selectors are two classes deep, so they win outright, and the active state carries a
	 * weight and a marker as well as a colour — a highlight that survives being looked at quickly.
	 */
	.doc-subnav-link {
		display: block;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		line-height: 1.25;
		text-decoration: none;
		color: var(--color-muted);
	}

	.doc-subnav-link:hover {
		color: var(--color-fg);
	}

	.doc-subnav .doc-subnav-link.is-active {
		color: var(--color-fg);
		font-weight: 600;
		background: var(--color-accent-dim, rgba(61, 155, 253, 0.16));
		box-shadow: inset 2px 0 0 var(--color-accent);
	}

	.doc-subnav {
		margin: 0.15rem 0 0.4rem 0.75rem;
		padding-left: 0.6rem;
		border-left: 1px solid var(--color-line);
		list-style: none;
	}

	/*
	 * A jump lands the heading below the sticky header rather than under it. Set here because the
	 * headings live in the pages, and every page would otherwise need to remember it.
	 */
	:global(article h2) {
		scroll-margin-top: 5rem;
	}
</style>
