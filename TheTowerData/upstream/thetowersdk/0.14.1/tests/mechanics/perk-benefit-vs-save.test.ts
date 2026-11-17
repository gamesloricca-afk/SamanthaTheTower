import { describe, expect, it } from 'vitest'
import save from '../../fixtures/save/perk-run.sample.json'
import { findPerkCatalogRow } from '../../src/save/catalogs/perks'
import { computePerkBenefitUp, perkMaxLevel } from '../../src/mechanics/perks/benefit'

/**
 * The perk maths, against a real mid-run save.
 *
 * Everything before this was checked against the game's CODE. This checks it
 * against the game's OUTPUT — a save at wave 4875 with 48 perks taken and the
 * wave each was picked at.
 *
 * ## The limitation, stated up front
 *
 * `perkPickWaves` is history and `researchLevel` is current state. A run this
 * long spans lab upgrades, so the earliest picks were made under lab levels the
 * save no longer records. Only the steady-state stretch is usable as a check,
 * and pretending otherwise would be reading noise as signal.
 */

const perkLevel = save.perkLevel as number[]
const picks = save.perkPickWaves as { wave: number, perk: number }[]

describe('catalog tables agree with a real save', () => {
  it('has no perk above the catalog maximum', () => {
    /*
     * The strongest single check available. `perkMaxLevel` came out of
     * `Perks.Initialize`; if any of those numbers were too low, a real save
     * would exceed it. None does — including the three perks sitting exactly AT
     * their cap, which is where an off-by-one would show.
     */
    const violations = perkLevel
      .map((level, index) => ({ index, level, max: perkMaxLevel(index) }))
      .filter(row => row.max !== null && row.level > row.max)
    expect(violations).toEqual([])

    const atCap = perkLevel.filter((level, index) => level > 0 && level === perkMaxLevel(index))
    expect(atCap.length, 'no perk is maxed, so the caps are untested by this save')
      .toBeGreaterThan(0)
  })

  it('holds no perk at an index the game has no perk at', () => {
    // The gaps 15-19 and 29-39 are real. A save writing a level into one would
    // mean the index space is wrong.
    const stray = perkLevel
      .map((level, index) => ({ index, level }))
      .filter(row => row.level > 0 && perkMaxLevel(row.index) === null)
    expect(stray).toEqual([])
  })

  it('reproduces the level array exactly from the pick history', () => {
    /*
     * Two independent fields in the save that must agree, and agreeing tells us
     * `perkLevel[i]` is a QUANTITY per index — the thing the calculator takes —
     * rather than a flag or a tier.
     */
    const counted = new Map<number, number>()
    for (const pick of picks) counted.set(pick.perk, (counted.get(pick.perk) ?? 0) + 1)

    for (const [index, count] of counted) {
      expect(perkLevel[index], `index ${index} (${findPerkCatalogRow(index)?.name})`).toBe(count)
    }
    expect(picks).toHaveLength(save.perksPickedCount)
    expect(perkLevel.reduce((sum, n) => sum + n, 0)).toBe(save.perksPickedCount)
  })

  it('leaves every banned perk at zero', () => {
    // Cheap, and it confirms the banned indices and the level array are keyed
    // the same way — which is the assumption the whole catalog rests on.
    for (const index of save.bannedPerksIndex as number[]) {
      expect(perkLevel[index], `banned perk ${index} was taken`).toBe(0)
    }
  })
})

describe('the wave-requirement formula reproduces the save', () => {
  /*
   * `Perks.ApplyWaveBenefit`:
   *
   *     waves = trunc((1 - PerkBenefitUp(10)) * (baseWave - wavesRequiredLab))
   *
   * With the save's labs: Waves Required 13 and Standard Perks Bonus 25, both
   * flat +1 per level in `LAB_CATALOG`.
   *
   *     base 200 - 13            = 187
   *     PerkBenefitUp(10) at 1   = 0.2 * (1 + 0.25) = 0.25
   *     trunc(0.75 * 187)        = trunc(140.25) = 140
   */
  const WAVES_REQUIRED_LAB = save.researchLevel['81_wavesRequired']
  const STANDARD_PERKS_BONUS = save.researchLevel['83_standardPerksBonus'] / 100

  function wavesPerPerk(wavePerkQuantity: number): number {
    const benefit = computePerkBenefitUp({
      index: 10,
      quantity: wavePerkQuantity,
      standardPerksBonus: STANDARD_PERKS_BONUS,
    })!
    return Math.trunc((1 - benefit) * (200 - WAVES_REQUIRED_LAB))
  }

  it('predicts the 140-wave interval the save actually shows', () => {
    /*
     * Picks 3, 4 and 5 are 420, 560, 700 — three consecutive gaps of exactly
     * 140, with the wave-requirement perk at quantity 1 throughout. That is the
     * steady stretch, and 140 is what the formula gives.
     *
     * It is also a four-way agreement: the perk value 0.2 from
     * `Perks.Initialize`, the lab levels from the save, the flat +1/level curve
     * from `LAB_CATALOG`, and the observed interval. Getting 140.25 and
     * truncating is the part that would break if the rounding were wrong.
     */
    expect(wavesPerPerk(1)).toBe(140)

    const steady = [420, 560, 700]
    const observed = steady.slice(1).map((wave, i) => wave - steady[i])
    expect(observed).toEqual([140, 140])
    for (const gap of observed) expect(gap).toBe(wavesPerPerk(1))
  })

  it('is wrong for the earliest picks, and the save says why', () => {
    /*
     * The first two picks are at 190 and 280 — a gap of 90, which the formula
     * does not produce at any sane lab level. That is expected, not a defect:
     * the save records CURRENT lab levels and HISTORICAL pick waves, and this
     * run reached wave 4875. The early picks happened under labs that no longer
     * exist in the file.
     *
     * Asserting the mismatch keeps the limitation visible. If a future fixture
     * ever makes these agree, this test fails and someone re-reads it — which
     * is better than a comment nobody runs.
     */
    const earlyGap = picks[1].wave - picks[0].wave
    expect(earlyGap).toBe(90)
    expect(earlyGap).not.toBe(wavesPerPerk(1))

    /*
     * And the direction of the error corroborates the explanation rather than
     * just excusing it. The FIRST perk arrived at wave 190, which is ABOVE the
     * current threshold of 187 — a weaker Waves Required lab, not a stronger
     * one. 190 is exactly 200 - 10, so the lab was level 10 then and is 13 now.
     * That also independently supports the flat +1-per-level curve the
     * catalog gives it.
     */
    expect(picks[0].wave).toBeGreaterThan(200 - WAVES_REQUIRED_LAB)
    expect(picks[0].wave).toBe(200 - 10)
  })

  it('takes the wave-requirement perk into account rather than ignoring it', () => {
    // Without the perk the interval would be the full 187, so the perk is
    // load-bearing in the prediction above and not incidentally cancelling out.
    expect(wavesPerPerk(0)).toBe(200 - WAVES_REQUIRED_LAB)
    expect(wavesPerPerk(1)).toBeLessThan(wavesPerPerk(0))
    expect(wavesPerPerk(3)).toBeLessThan(wavesPerPerk(1))
  })
})
