import { describe, expect, it, vi } from 'vitest'
import {
  FANDOM_API_URL,
  fetchFandomPageAsMarkdown,
  fetchFandomWikitext,
} from '../../src/wiki'

/**
 * The fetch half of wiki ingest.
 *
 * The conversion below it arrived with its own tests; this is the new part, and
 * what it mostly has to get right is *failing usefully*. A wiki page fetched by
 * the wrong title comes back `200 OK` with a `missing` marker rather than a
 * 404, so the only thing standing between a typo and an empty page is this
 * function noticing.
 */

/** A Fandom response, in either of the two shapes the API returns. */
function respond(page: unknown, ok = true, status = 200) {
  return vi.fn(async () => ({
    ok,
    status,
    json: async () => ({ query: { pages: { '123': page } } }),
  })) as unknown as typeof globalThis.fetch
}

const SLOTTED = { revisions: [{ slots: { main: { '*': "'''Cards''' are good." } } }] }
const FLAT = { revisions: [{ '*': "'''Cards''' are good." }] }

describe('fetching wikitext', () => {
  it('reads the slots shape', async () => {
    await expect(fetchFandomWikitext('Cards', { fetchImpl: respond(SLOTTED) }))
      .resolves.toBe("'''Cards''' are good.")
  })

  it('reads the flat shape too', async () => {
    // Which one you get depends on the MediaWiki version behind the wiki, and
    // both are current — reading only one works until the day it does not.
    await expect(fetchFandomWikitext('Cards', { fetchImpl: respond(FLAT) }))
      .resolves.toBe("'''Cards''' are good.")
  })

  it('refuses a page that is not there, though the request succeeded', async () => {
    await expect(fetchFandomWikitext('Nope', { fetchImpl: respond({ missing: '' }) }))
      .rejects.toThrow(/not found: Nope/)
  })

  it('refuses a page that exists and is empty', async () => {
    await expect(fetchFandomWikitext('Blank', { fetchImpl: respond({ revisions: [{ '*': '   ' }] }) }))
      .rejects.toThrow(/Empty wikitext/)
  })

  it('says what the server said when the request fails', async () => {
    await expect(fetchFandomWikitext('Cards', { fetchImpl: respond(SLOTTED, false, 503) }))
      .rejects.toThrow(/HTTP 503/)
  })

  it('asks the wiki for the page by title', async () => {
    const fetchImpl = respond(SLOTTED)
    await fetchFandomWikitext('Ultimate Weapons', { fetchImpl })

    const url = new URL((fetchImpl as unknown as { mock: { calls: string[][] } }).mock.calls[0][0])
    expect(`${url.origin}${url.pathname}`).toBe(FANDOM_API_URL)
    expect(url.searchParams.get('titles')).toBe('Ultimate Weapons')
    expect(url.searchParams.get('rvslots')).toBe('main')
  })

  it('honours an api url override, for a mirror or a proxy', async () => {
    const fetchImpl = respond(SLOTTED)
    await fetchFandomWikitext('Cards', { fetchImpl, apiUrl: 'https://example.test/api.php' })

    const url = (fetchImpl as unknown as { mock: { calls: string[][] } }).mock.calls[0][0]
    expect(url.startsWith('https://example.test/api.php?')).toBe(true)
  })

  it('converts on the way out', async () => {
    const markdown = await fetchFandomPageAsMarkdown('Cards', { fetchImpl: respond(SLOTTED) })
    // Wikitext bold is three quotes; Markdown's is two asterisks. Proves the
    // conversion actually ran rather than the wikitext passing through.
    expect(markdown).not.toContain("'''")
    expect(markdown).toContain('**Cards**')
  })
})
