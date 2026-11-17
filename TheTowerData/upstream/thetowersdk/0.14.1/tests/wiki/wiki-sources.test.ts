/**
 * The multi-wiki client, exercised against fakes rather than the live sites.
 *
 * No network here on purpose: both wikis are volunteer-run, and a test suite
 * that hammers them is rude and flaky in equal measure. The behaviours that
 * matter are all about how sources are chosen and combined, which is testable
 * without leaving the process.
 */
import { describe, expect, it } from 'vitest'

import {
  WIKI_SOURCES,
  fetchWikiPageFromAnySource,
  getWikiSource,
  searchWiki,
  searchWikis,
} from '../../src/wiki/community/wikis'

/** A fetch stand-in that answers from a map of substring → payload. */
function fakeFetch(routes: Array<[string, unknown, number?]>): typeof globalThis.fetch {
  return (async (input: string | URL) => {
    const url = String(input)
    const hit = routes.find(([fragment]) => url.includes(fragment))
    if (!hit) return { ok: false, status: 404, json: async () => ({}) } as unknown as Response
    const [, payload, status = 200] = hit
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
    } as unknown as Response
  }) as unknown as typeof globalThis.fetch
}

const pageWith = (title: string, wikitext: string) => ({
  query: { pages: { 1: { title, revisions: [{ slots: { main: { '*': wikitext } } }] } } },
})

describe('wiki sources', () => {
  it('registers both wikis with the paths and quirks each one needs', () => {
    expect(WIKI_SOURCES.map(source => source.id)).toEqual(['fandom', 'gamevault'])

    // Not derivable from the host — the two sites put api.php in different
    // places, which is why this is data rather than a template.
    expect(getWikiSource('fandom').apiUrl).toMatch(/\/api\.php$/)
    expect(getWikiSource('gamevault').apiUrl).toMatch(/\/w\/api\.php$/)

    // Game Vault's full-text backend is broken, so it must be searched by
    // prefix; Fandom's is not.
    expect(getWikiSource('gamevault').searchMode).toBe('prefix')
    expect(getWikiSource('fandom').searchMode).toBe('search')
  })

  it('names an unknown source instead of failing vaguely', () => {
    expect(() => getWikiSource('nope')).toThrow(/Unknown wiki source "nope".*fandom, gamevault/)
  })

  it('refuses an external-transport source with the reason, not a 403', async () => {
    // The failure mode this guards: without a usable client, Game Vault answers
    // 403 and the caller reads it as "the page does not exist".
    await expect(fetchWikiPageFromAnySource('Multishot', { sourceIds: ['gamevault'] }))
      .rejects.toThrow(/blocks that client|createCurlFetch/)
  })

  it('uses the external client only for the source that needs it', async () => {
    const calledBy: string[] = []
    const tag = (label: string, payload: unknown): typeof globalThis.fetch =>
      (async (input: string | URL) => {
        calledBy.push(`${label}:${String(input).includes('game-vault') ? 'gv' : 'fandom'}`)
        return { ok: true, status: 200, json: async () => payload } as unknown as Response
      }) as unknown as typeof globalThis.fetch

    await fetchWikiPageFromAnySource('Multishot', {
      sourceIds: ['gamevault'],
      externalFetchImpl: tag('external', pageWith('Workshop/Multishot', 'body')),
    })
    expect(calledBy).toEqual(['external:gv'])
  })

  it('returns the fullest page, not the first one that answers', async () => {
    // The real case. Fandom's Multishot is a stub that returns 200; taking the
    // first success hands back an empty page and never asks the wiki that has
    // the content.
    const stub = pageWith('Multishot', 'x')
    const full = pageWith('Workshop/Multishot', 'Multishot gives a chance to fire at more enemies. '.repeat(40))

    const result = await fetchWikiPageFromAnySource('Multishot', {
      fetchImpl: fakeFetch([['game-vault', full], ['fandom', stub]]),
    })

    expect(result.sourceId).toBe('gamevault')
    expect(result.alternatives.map(alternative => alternative.sourceId)).toEqual(['fandom'])
    // The stub is still reported — it exists, it is just empty.
    expect(result.alternatives[0].length).toBeLessThan(result.markdown.length)
  })

  it('follows redirects, so a namespaced page is not read as a one-line stub', async () => {
    const result = await fetchWikiPageFromAnySource('Multishot', {
      sourceIds: ['fandom'],
      fetchImpl: fakeFetch([['fandom', pageWith('Workshop/Multishot', 'the real body')]]),
    })
    expect(result.resolvedTitle).toBe('Workshop/Multishot')
  })

  it('keeps same-titled pages from different wikis apart', async () => {
    const { hits } = await searchWikis('knockback', {
      fetchImpl: fakeFetch([
        ['game-vault', { query: { prefixsearch: [{ title: 'Knockback' }] } }],
        ['fandom', { query: { search: [{ title: 'Knockback' }] } }],
      ]),
    })
    // Two entries, not one: the same title on two wikis is two pages that can
    // disagree, and merging them would throw the disagreement away.
    expect(hits).toHaveLength(2)
    expect(hits.map(hit => hit.sourceId).sort()).toEqual(['fandom', 'gamevault'])
  })

  it('reports a source that failed rather than dropping it', async () => {
    const { hits, failures } = await searchWikis('knockback', {
      fetchImpl: fakeFetch([
        ['fandom', { query: { search: [{ title: 'Knockback' }] } }],
        ['game-vault', {}, 500],
      ]),
    })
    // A lost source and a source with nothing to say look identical unless the
    // failure is named.
    expect(hits.map(hit => hit.sourceId)).toEqual(['fandom'])
    expect(failures).toEqual([{ sourceId: 'gamevault', error: expect.stringContaining('500') }])
  })

  it('sends each wiki the search parameters its mode requires', async () => {
    const urls: string[] = []
    const spy: typeof globalThis.fetch = (async (input: string | URL) => {
      urls.push(String(input))
      return { ok: true, status: 200, json: async () => ({ query: {} }) } as unknown as Response
    }) as unknown as typeof globalThis.fetch

    await searchWiki('knock', { sourceId: 'fandom', fetchImpl: spy })
    await searchWiki('knock', { sourceId: 'gamevault', fetchImpl: spy })

    expect(urls[0]).toContain('srsearch=knock')
    expect(urls[1]).toContain('pssearch=knock')
  })
})
