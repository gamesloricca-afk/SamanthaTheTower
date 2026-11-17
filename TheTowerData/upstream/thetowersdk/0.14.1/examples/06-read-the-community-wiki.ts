/**
 * Example 6 — Read the community wiki.
 *
 * The wiki helpers fetch a page from one of the community wikis and hand you
 * Markdown instead of raw wikitext. Useful for an assistant, a tooltip, or a
 * "what does this actually do?" panel next to a number you calculated.
 *
 * This example talks to the network. Both wikis are volunteer-run, so it asks
 * for one page, not a crawl.
 *
 * Game Vault's edge blocks Node's built-in fetch by client fingerprint, so it
 * will report itself unavailable below. That is expected, and the fix is to pass
 * a different HTTP client:
 *
 *   import { createCurlFetch } from 'thetowersdk/wiki'
 *   await searchWikis(title, { fetchImpl: createCurlFetch() })
 *
 * Run it:
 *   npx tsx examples/06-read-the-community-wiki.ts [page title]
 */
import {
  fetchWikiPageFromAnySource,
  searchWikis,
  WIKI_ATTRIBUTION,
  WIKI_CREDIT_SOURCES,
} from 'thetowersdk/wiki'

async function main(): Promise<void> {
  const title = process.argv.slice(2).join(' ') || 'Golden Tower'

  /*
   * Step 1 — find the page.
   *
   * The two wikis disagree about titles: Game Vault namespaces many of them
   * (`Workshop/Multishot`), Fandom does not. Searching both and taking what
   * comes back is more reliable than guessing a title for either.
   */
  const { hits, failures } = await searchWikis(title, { limit: 5 })
  console.log(`Search "${title}" — ${hits.length} result(s):`)
  for (const hit of hits) console.log(`  [${hit.sourceId}] ${hit.title}`)
  // A source that refused is reported rather than silently dropped, so an empty
  // result set is distinguishable from a wiki that blocked the request.
  for (const failure of failures) console.log(`  (${failure.sourceId} unavailable: ${failure.error})`)
  console.log()

  /*
   * Step 2 — fetch it as Markdown.
   *
   * `fetchWikiPageFromAnySource` tries the sources in order and returns the
   * first that answers, so a page missing from one wiki still resolves. The
   * result carries the `url` it came from — keep it: that link is how a reader
   * reaches the page's authors and edit history.
   */
  const page = await fetchWikiPageFromAnySource(hits[0]?.title ?? title)

  console.log(`${page.resolvedTitle} — ${page.url} (via ${page.sourceId})`)
  console.log('-'.repeat(72))
  console.log(page.markdown.split('\n').slice(0, 20).join('\n'))
  console.log('-'.repeat(72))
  console.log()

  /*
   * Step 3 — credit the people who wrote it.
   *
   * Nothing in this package produces wiki knowledge; it only transports and
   * reformats what volunteers wrote. If you show wiki text to a user, show this
   * too. Individual editors are deliberately not enumerated in code — authorship
   * changes continuously and lives in each wiki's own page history, so a copied
   * roster goes stale and silently drops people. Link the page instead.
   */
  console.log(WIKI_ATTRIBUTION)
  for (const source of WIKI_CREDIT_SOURCES) console.log(`  ${source.label} — ${source.url}`)
}

main().catch((error: unknown) => {
  // Both wikis are community-hosted and occasionally rate-limit or block a
  // plain fetch; that is a network condition, not a bug in your code.
  console.error('Wiki request failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
