import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { MONOREPO_ROOT } from '../helpers/paths'

/**
 * The wiki drift check must ask every wiki, and must be able to reach them.
 *
 * It called `fetchFandomPageAsMarkdown`. Two failure modes followed, and only the first was loud:
 *
 * - A page that lives only on Game Vault read as "wiki page not found" — `Lab`, whose full boost
 *   cost table is the source of the 20%-per-boosted-lab scaling.
 * - A page Fandom carries as an EMPTY STUB was fetched, hashed, and reported unchanged, while the
 *   table it exists to watch sits on the other site. A stub is a successful fetch. Nothing
 *   distinguished it from the real page, so the report said `ok` about pages it was not reading.
 *
 * With every wiki asked and the curl transport available, 22 of 58 pages come back from Game Vault
 * — including Bounce Shot, Multishot and Rend Armor, the three the SDK's own docblock on
 * `fetchWikiPageFromAnySource` names as the reason that function exists. The lesson had been
 * learned and written down; this caller never picked it up.
 *
 * Both halves are load-bearing and both are asserted. The multi-source fetch alone is not enough:
 * Game Vault's edge blocks the platform fetch, so without `createCurlFetch` every Game Vault
 * attempt errors and the fetch silently falls back to Fandom — the stub problem, restored.
 */

const DRIFT = path.resolve(MONOREPO_ROOT, 'scripts', 'mechanics-trust', 'drift-wiki.mjs')
const HASHES = path.resolve(
  MONOREPO_ROOT, 'docs', 'mechanics-map', 'drift', 'wiki-hashes.json',
)

describe.skipIf(!existsSync(DRIFT))('wiki drift reads the wiki that has the page', () => {
  const source = () => readFileSync(DRIFT, 'utf8')

  it('asks every wiki, not just Fandom', () => {
    const text = source()

    expect(text, 'a single-wiki fetch cannot tell a stub from the real page')
      .toMatch(/fetchWikiPageFromAnySource/)
    expect(text).not.toMatch(/fetchPage\s*=\s*wikiMod\.fetchFandomPageAsMarkdown/)
  })

  it('carries the transport Game Vault needs', () => {
    /*
     * Without this the multi-source fetch still resolves — to Fandom, every time, because the Game
     * Vault attempt errors before it can answer. The bug would look fixed and behave exactly as
     * before, which is the worst shape a fix can have.
     */
    const text = source()

    expect(text).toMatch(/createCurlFetch/)
    expect(text).toMatch(/externalFetchImpl/)
  })

  it('records which wiki answered, so a source change is not read as content drift', () => {
    const text = source()

    expect(text, 'the same title can differ between the two sites').toMatch(/sourceId/)
    expect(text, 'a moved source is a different event from a changed page').toMatch(/movedSource/)
  })

  it.skipIf(!existsSync(HASHES))('has a baseline that actually spans both wikis', () => {
    /*
     * The claim this whole change rests on, checked against the recorded state rather than
     * restated: a meaningful share of the coverage surface is NOT on Fandom.
     */
    const { hashes } = JSON.parse(readFileSync(HASHES, 'utf8')) as {
      hashes: Record<string, string | { hash: string, sourceId: string }>
    }

    const entries = Object.values(hashes).filter(value => typeof value === 'object')
    expect(entries.length, 'baseline has not been rewritten with source ids yet').toBeGreaterThan(20)

    const fromGameVault = entries.filter(value => (value as { sourceId: string }).sourceId === 'gamevault')
    expect(fromGameVault.length, 'if nothing comes from Game Vault, the transport is not working')
      .toBeGreaterThan(5)
  })
})
