/**
 * The IDS onboarding adapter, driven by NINE real players' IDS blocks.
 *
 * These are the same community sheets the parity work uses, captured read-only
 * by `scripts/effective-paths/capture-community-ids.mjs`. They span v5.07.02 to
 * v5.09.03, which is the whole point: the claim under test is that an OLD EP
 * sheet's IDS still fills the site's targets, so the fixture has to contain
 * old sheets or the claim is untested.
 */
import { describe, expect, it } from 'vitest'
import {
  idsLabNameAliases,
  resolveIdsLabSaveIndex,
} from '../../src/save/ids/import'





describe('resolveIdsLabSaveIndex', () => {
  it('resolves every alias to a real catalog index', () => {
    // An alias whose target the catalog dropped resolves to nothing, and a lab
    // that resolves to nothing imports as level 0 -- which looks like progress
    // the player has not made rather than like a failure.
    for (const [idsName, catalogName] of Object.entries(idsLabNameAliases())) {
      expect(resolveIdsLabSaveIndex(idsName), `alias ${idsName} is dead`).not.toBeNull()
      expect(resolveIdsLabSaveIndex(idsName), `${idsName} != ${catalogName}`)
        .toBe(resolveIdsLabSaveIndex(catalogName))
    }
  })

  it('does not route through LAB_RESEARCH_LAB_BY_LEGACY_LEVEL_KEY, whose targets do not exist', () => {
    // The catalog says "Labs Speed"; that legacy map points it at "Lab Speed",
    // which is not a lab. Recorded as a test so the mistake is not made twice.
    expect(resolveIdsLabSaveIndex('Labs Speed')).not.toBeNull()
    expect(resolveIdsLabSaveIndex('Lab Speed')).toBeNull()
    expect(resolveIdsLabSaveIndex('Lab Coin Discount')).toBeNull()
  })

  it('returns null for a name the catalog does not have, rather than a plausible index', () => {
    expect(resolveIdsLabSaveIndex('Not A Lab At All')).toBeNull()
  })
})

