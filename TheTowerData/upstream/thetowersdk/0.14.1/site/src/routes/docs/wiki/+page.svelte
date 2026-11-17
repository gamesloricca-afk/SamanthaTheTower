<script lang="ts">
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import { href } from '$lib/paths';
</script>

<h1 class="text-3xl font-semibold">Wiki</h1>
<p class="mt-3 text-muted">
	Pull pages from the community wikis as Markdown, so a mechanic's description sits in your app next
	to the numbers the catalogs give you. Two wikis are configured, tables and infoboxes are converted
	for you, and every page comes back with the URL it came from.
</p>

<h2 class="mt-10 text-xl font-semibold">Read A Page</h2>
<p class="mt-3 text-muted">
	One call takes a page title and returns Markdown. The result carries the source it used, the title
	it actually resolved to, and the page URL.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { fetchWikiPageAsMarkdown } from 'thetowersdk/wiki'

const page = await fetchWikiPageAsMarkdown('Golden Tower')

console.log(page.sourceId)        // 'fandom'
console.log(page.resolvedTitle)   // 'Golden Tower'
console.log(page.url)             // 'https://the-tower-idle-tower-defense.fandom.com/wiki/Golden_Tower'

console.log(page.markdown)
// ## Description
//
// Turns the tower golden for a period of time after a period of time. While
// active you receive a multiplier cash and coins from enemy kills.
//
// ## Workshop
// …`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Search For One</h2>
<p class="mt-3 text-muted">
	<code>searchWiki</code> returns ranked titles with their source and URL, which is what you want when
	a player types a phrase rather than an exact page name.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { searchWiki } from 'thetowersdk/wiki'

const hits = await searchWiki('golden tower')

console.log(hits.length)   // 10
console.log(hits[0])
// {
//   title: 'Golden Tower',
//   sourceId: 'fandom',
//   url: 'https://the-tower-idle-tower-defense.fandom.com/wiki/Golden_Tower'
// }

// Search, then read the best match.
const page = await fetchWikiPageAsMarkdown(hits[0].title)`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">The Two Wikis</h2>
<p class="mt-3 text-muted">
	<code>WIKI_SOURCES</code> lists what is configured. Fandom is the default and the broader of the two;
	Game Vault is the other. Each entry carries its API URL, the base for page links, and how its search
	behaves.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { WIKI_SOURCES, DEFAULT_WIKI_SOURCE_ID, getWikiSource } from 'thetowersdk/wiki'

for (const source of WIKI_SOURCES) {
  console.log(source.id, '—', source.label)
}
// fandom    — Fandom — The Tower: Idle Tower Defense Wiki
// gamevault — Game Vault — The Tower Wiki and Guides

console.log(DEFAULT_WIKI_SOURCE_ID)   // 'fandom'

const fandom = getWikiSource('fandom')
console.log(fandom.apiUrl)        // 'https://…fandom.com/api.php'
console.log(fandom.pageUrlBase)   // 'https://…fandom.com/wiki/'
console.log(fandom.searchMode)    // 'search'  — Game Vault uses 'prefix'`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Try Both</h2>
<p class="mt-3 text-muted">
	<code>fetchWikiPageFromAnySource</code> looks in each configured wiki and returns the first page it
	finds, which covers titles that exist on one and not the other.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { fetchWikiPageFromAnySource } from 'thetowersdk/wiki'

const page = await fetchWikiPageFromAnySource('Guardian')
console.log(page.sourceId)   // whichever one had it`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Show When It Was Last Edited</h2>
<p class="mt-3 text-muted">
	Wiki prose ages. <code>fetchWikiPageLastEdited</code> tells you when the page last changed, so a cached
	copy can show its age or be refreshed on a schedule.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { fetchWikiPageLastEdited } from 'thetowersdk/wiki'

const revision = await fetchWikiPageLastEdited('Golden Tower')

console.log(revision.lastEdited)   // '2024-05-01T03:08:24Z'
console.log(revision.sourceId)     // 'fandom'
console.log(revision.title)        // 'Golden Tower'`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Work With The Raw Wikitext</h2>
<p class="mt-3 text-muted">
	<code>fetchWikiWikitext</code> gives you the page source, for when you want to search it, diff it, or
	transform something before rendering.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { fetchWikiWikitext } from 'thetowersdk/wiki'

const { wikitext, source, resolvedTitle } = await fetchWikiWikitext('Golden Tower')

console.log(resolvedTitle)   // 'Golden Tower'
console.log(source.id)       // 'fandom'
console.log(wikitext.slice(0, 80))`}
	/>
</div>
<p class="mt-3 text-muted">
	For Markdown, reach for <code>fetchWikiPageAsMarkdown</code> rather than converting by hand — the converter
	needs the page's template and transclusion context to expand tabs and infoboxes, and the fetcher assembles
	that for you.
</p>

<h2 class="mt-10 text-xl font-semibold">Judge What A Page Carries</h2>
<p class="mt-3 text-muted">
	<code>scoreFandomMarkdownQuality</code> returns a number for how substantial a converted page is,
	and <code>countMarkdownTableRows</code> counts its table rows. Both help when you are choosing between
	two candidate pages, or deciding whether one is worth caching.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { countMarkdownTableRows, scoreFandomMarkdownQuality } from 'thetowersdk/wiki'

console.log(scoreFandomMarkdownQuality(page.markdown))   // 953
console.log(countMarkdownTableRows(page.markdown))       // 0 — this page is prose

// Pick the richer of two candidates.
const best = [pageA, pageB].sort(
  (left, right) =>
    scoreFandomMarkdownQuality(right.markdown) - scoreFandomMarkdownQuality(left.markdown)
)[0]`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Images</h2>
<p class="mt-3 text-muted">
	Wiki markup references images by file name. These resolve those names to the URLs the wiki serves,
	so an embedded page renders with its pictures.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import {
  readFandomFileNamesFromMarkdown,
  fetchFandomImageUrlMap,
  applyFandomImageUrlMap
} from 'thetowersdk/wiki'

const names = readFandomFileNamesFromMarkdown(page.markdown)

// A prose page returns none, so there is nothing to fetch.
if (names.length > 0) {
  const urls = await fetchFandomImageUrlMap(names)
  const withImages = applyFandomImageUrlMap(page.markdown, urls)
}`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Attribution</h2>
<p class="mt-3 text-muted">
	The pages are written by the wiki communities. <code>WIKI_ATTRIBUTION</code> is the credit line to
	show wherever you display their content, and <code>WIKI_CREDIT_SOURCES</code> lists the wikis it names.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { WIKI_ATTRIBUTION, WIKI_CREDIT_SOURCES } from 'thetowersdk/wiki'

console.log(WIKI_ATTRIBUTION)
// 'Wiki content is written and maintained by the contributors to Fandom — The
//  Tower: Idle Tower Defense Wiki and Game Vault — The Tower Wiki and Guides.
//  Each page links back to its source, where its authors are listed.'`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Prose Beside The Numbers</h2>
<p class="mt-3 text-muted">
	The combination worth building: the wiki says what a mechanic does, the catalogs say what it
	costs, and the <a href={href('/docs/knowledge/')}>knowledge graph</a> says what people get wrong about
	it.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { fetchWikiPageAsMarkdown } from 'thetowersdk/wiki'
import { uwStoneChartData } from 'thetowersdk/data'
import { trapsFor, resolve } from 'thetowersdk/knowledge'

async function mechanic(name) {
  const page = await fetchWikiPageAsMarkdown(name)
  const weapon = Object.values(uwStoneChartData).find((entry) => entry.name === name)
  const id = resolve(name)

  return {
    description: page.markdown,
    source: page.url,
    stats: weapon?.stats.map((stat) => ({ name: stat.name, levels: stat.levels.length })),
    watchOutFor: id ? trapsFor(id) : []
  }
}

console.log(await mechanic('Golden Tower'))`}
	/>
</div>

<p class="mt-8 text-sm">
	<a href={href('/docs/knowledge/')}>Knowledge Graph →</a>
	·
	<a href={href('/docs/data/')}>Catalogs →</a>
	·
	<a href={href('/docs/mcp/')}>Reach It From An Assistant →</a>
</p>
