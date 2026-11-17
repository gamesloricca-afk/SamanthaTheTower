import { describe, expect, it } from 'vitest'
import {
  findToolLabBySlug,
  getSharedToolLabs,
  CANONICAL_LAB_SLUG_BY_ALIAS,
} from '../../src/data'

/**
 * `findToolLabBySlug` is the single lookup behind five former copies (platform's
 * enemy-stats labs, three SDK modules, and the site's enemy-stats domain). A lab is named
 * four different ways depending on who is asking, so every branch of the fallback chain is
 * load-bearing — and a miss returns `undefined` rather than throwing, which is exactly how
 * a broken branch stays invisible.
 *
 * Cases are derived from the catalog, never transcribed.
 */
describe('findToolLabBySlug resolves every name a caller may hold', () => {
  const labs = getSharedToolLabs()

  it('has a catalog to test against', () => {
    expect(labs.length).toBeGreaterThan(100)
  })

  it('resolves by canonical catalog name', () => {
    for (const lab of labs.slice(0, 25)) {
      expect(findToolLabBySlug(lab.name)?.name, lab.name).toBe(lab.name)
    }
  })

  it('resolves every catalog name, with no unresolvable entries', () => {
    const unresolved = labs.map(l => l.name).filter(name => !findToolLabBySlug(name))
    expect(unresolved).toEqual([])
  })

  /*
   * Observed, not required: across all 241 real inputs (every catalog name plus every
   * alias key) the `lab.name === slug` branch alone answers every one — the canonical,
   * display-name and saveIndex branches never fire. They are kept because slugs also
   * arrive from saves and sheets, which this catalog sweep does not cover; but if a
   * future change makes one of those branches matter, nothing here would notice, so
   * this is recorded rather than asserted.
   */

  it('resolves every site alias to a real lab', () => {
    const aliases = Object.keys(CANONICAL_LAB_SLUG_BY_ALIAS)
    expect(aliases.length).toBeGreaterThan(0)
    for (const alias of aliases) {
      // The alias must land on the same record its target does.
      const viaAlias = findToolLabBySlug(alias)
      const viaTarget = findToolLabBySlug(CANONICAL_LAB_SLUG_BY_ALIAS[alias]!)
      expect(viaAlias?.name, alias).toBe(viaTarget?.name)
    }
  })

  it('returns undefined for an unknown slug instead of guessing', () => {
    expect(findToolLabBySlug('definitely_not_a_lab_slug')).toBeUndefined()
    expect(findToolLabBySlug('')).toBeUndefined()
  })

  it('treats prototype member names as unknown slugs', () => {
    /*
     * These pass with plain `ALIASES[slug]` too — Object.prototype.constructor is not a
     * lab name, so the lookup still misses. The own-key check in the implementation is
     * defensive consistency with the rest of the codebase, NOT something this test
     * discriminates; planting the unsafe version does not turn it red. Kept because the
     * outcome (undefined, never a thrown TypeError from a function-valued slug) is the
     * contract callers rely on.
     */
    for (const key of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
      expect(() => findToolLabBySlug(key), key).not.toThrow()
      expect(findToolLabBySlug(key), key).toBeUndefined()
    }
  })
})
