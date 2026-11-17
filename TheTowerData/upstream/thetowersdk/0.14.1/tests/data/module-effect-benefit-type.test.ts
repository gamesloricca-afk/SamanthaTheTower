import { describe, expect, it } from 'vitest'

import { MODULE_EFFECTS_TABLE } from '../../src/data/assets/data'

/**
 * `benefitType` on a module effect row is the game's `BenefitType` enum, and **v29 re-based
 * that enum**. It was not appended to — it was redesigned:
 *
 *   v28.3  Normal=0 Add=1 Add10=2 AddMult=3 Multiply=4 Percentage=5 Percentage100=6
 *          Subtract=7 Time=8 AddTime=9 SubtractTime=10 Meters=11 Angle=12   (13 members)
 *
 *   v29    None=0 Percentage1=10 Percentage100=20 Seconds=30 Time=40
 *          Meters=50 Angle=60                                               (7 members)
 *
 * Nine v28.3 members were removed, and the survivors moved (Percentage100 6 -> 20,
 * Time 8 -> 40, Meters 11 -> 50, Angle 12 -> 60). The new spacing is deliberate, leaving
 * room between members.
 *
 * The shipped table is still v28.3-coded, and nothing in the SDK or the app branches on
 * these values today — they are carried through `getModuleEffectRow()` and the module save
 * decoder and never interpreted. That is exactly why this needs a test rather than a fix:
 * the day someone updates the asset tables to the v29 value scheme, every one of these numbers
 * silently changes meaning, and no existing assertion would notice. A `6` would keep
 * reading as "Percentage100" to a human while the game now calls that `Percentage1`.
 *
 * When the table IS regenerated from v29: update the expected set below to the v29 space,
 * and check every consumer of `benefitType` at that moment — `data/modules/effect-resolver`,
 * `save/modules/decode`, and the v28.3 parity test.
 */
const V283_BENEFIT_TYPES = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])

// Values unique to the v29 value scheme. Their presence requires reviewing
// this test and every consumer before changing the expected encoding.
const V29_ONLY_BENEFIT_TYPES = new Set([20, 30, 40, 50, 60])

describe('module effect benefitType is still v28.3-coded', () => {
  const rows = Object.values(MODULE_EFFECTS_TABLE)

  it('has rows to check', () => {
    // Guard the guard: an empty table would make every assertion below vacuously pass.
    expect(rows.length).toBeGreaterThan(100)
  })

  it('uses only v28.3 BenefitType values', () => {
    const seen = new Set(rows.map(row => row.benefitType))
    const unexpected = [...seen].filter(value => !V283_BENEFIT_TYPES.has(value)).sort((a, b) => a - b)

    expect(
      unexpected,
      'Unexpected BenefitType values in MODULE_EFFECTS_TABLE. If the asset tables were '
      + 'updated to the v29 value scheme, these numbers no longer mean what the rest of the '
      + 'codebase assumes — see the comment at the top of this file before updating it.',
    ).toEqual([])
  })

  it('contains no value that only exists in the v29 enum', () => {
    const v29Only = [...new Set(rows.map(row => row.benefitType))]
      .filter(value => V29_ONLY_BENEFIT_TYPES.has(value))
      .sort((a, b) => a - b)

    expect(
      v29Only,
      'MODULE_EFFECTS_TABLE contains v29-only BenefitType values, so it has been '
      + 'updated to the v29 value scheme. Update this test to the v29 enum and re-check every '
      + 'consumer of benefitType.',
    ).toEqual([])
  })
})
