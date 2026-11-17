import { describe, expect, it } from 'vitest'
import {
  LIFETIME_SAVE_ORB_KILLS_FIELD_BEFORE_V29,
  LIFETIME_SAVE_ORB_KILLS_KEY,
  readLifetimeFromSaveRoot,
} from '../../src/save/lifetime/read'
import { decodePlayerInfoSaveBytes } from '../../src/node/decode-save'

/**
 * Orb kills survive the v29 rename, in both directions.
 *
 * The game misspelled this field as `totalEnemiesDestryoedByOrbs` up to v28.3 -- only on the two
 * orb counters, while every neighbouring `totalEnemiesDestroyedBy*` was spelled correctly -- and
 * v29 fixed it. Saves outlive versions, so both spellings are live data.
 *
 * A reader that knows one spelling returns nothing for the other half of the saves, and nothing
 * is indistinguishable here from a player who has never used an orb.
 */

/** The other rows are irrelevant here; only orbKills is under test. */
function orbKillsFrom(root: Record<string, unknown>): string | undefined {
  return readLifetimeFromSaveRoot(root)?.values.orbKills
}

describe('lifetime orb kills across the v29 field rename', () => {
  it('reads either spelling, and reads them the same way', () => {
    /*
     * Compared against each other rather than against a literal: the value is passed through the
     * display formatter, so a literal would be pinning the formatter's output as well and would
     * break for a reason that has nothing to do with the rename.
     */
    const viaV29 = orbKillsFrom({ [LIFETIME_SAVE_ORB_KILLS_KEY]: 4321 })
    const viaOlder = orbKillsFrom({ [LIFETIME_SAVE_ORB_KILLS_FIELD_BEFORE_V29]: 4321 })

    expect(viaV29).toBeDefined()
    expect(viaOlder).toBe(viaV29)
  })

  it('reads a value at all, rather than reporting an absent field', () => {
    const absent = orbKillsFrom({ somethingElse: 1 })
    expect(orbKillsFrom({ [LIFETIME_SAVE_ORB_KILLS_KEY]: 4321 })).not.toBe(absent)
  })

  it('does not add the two together', () => {
    /*
     * The row type's array form SUMS its keys, which is correct for a value split across three
     * fields and wrong for a rename. A save cannot legitimately carry both spellings, but if one
     * ever did, doubling a lifetime total is the kind of wrong that never gets noticed.
     */
    const both = orbKillsFrom({
      [LIFETIME_SAVE_ORB_KILLS_KEY]: 100,
      [LIFETIME_SAVE_ORB_KILLS_FIELD_BEFORE_V29]: 100,
    })
    expect(both).toBe('100')
  })

  it('the two spellings really are different, so this test is not vacuous', () => {
    expect(LIFETIME_SAVE_ORB_KILLS_KEY).not.toBe(LIFETIME_SAVE_ORB_KILLS_FIELD_BEFORE_V29)
  })

  it('reads orb kills through the official JSON export boundary', () => {
    const decoded = decodePlayerInfoSaveBytes(Buffer.from(JSON.stringify({ ResearchLevel: [1], [LIFETIME_SAVE_ORB_KILLS_KEY]: 4321 })))
    const root = decoded.parsedRoot as Record<string, unknown>

    const usesV29Key = Object.keys(root).includes(LIFETIME_SAVE_ORB_KILLS_KEY)
    const usesLegacyKey = Object.keys(root).includes(LIFETIME_SAVE_ORB_KILLS_FIELD_BEFORE_V29)
    expect(usesV29Key || usesLegacyKey).toBe(true)

    const orbKills = orbKillsFrom(root)
    expect(orbKills).toBeDefined()
    const raw = usesV29Key
      ? root[LIFETIME_SAVE_ORB_KILLS_KEY]
      : root[LIFETIME_SAVE_ORB_KILLS_FIELD_BEFORE_V29]
    expect(orbKills).toBe(orbKillsFrom({ [LIFETIME_SAVE_ORB_KILLS_KEY]: raw }))
  })
})
