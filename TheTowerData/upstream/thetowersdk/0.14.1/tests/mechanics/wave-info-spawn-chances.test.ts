import { describe, expect, it } from 'vitest'

import { waveInfoSpawnChances } from '../../src/mechanics/waves/info-panel-stats'

/**
 * The ordinary-enemy spawn chances the Enemy Stats calculator displays.
 *
 * `waveInfoSpawnChances` derives fast, tank and ranged from a tier weight,
 * takes a protector chance, and gives basic whatever is left:
 *
 *     basic = Math.max(0, 100 - fast - tank - ranged - protector)
 *
 * That `Math.max(0, ...)` is doing more than guarding a rounding edge. Above
 * tier 23 the four named chances exceed 100 on their own — fast, tank and
 * ranged stop growing because the tier weight table is capped at 13 entries,
 * while the protector chance keeps rising with tier — so the residual goes
 * NEGATIVE and the clamp turns it into a displayed 0%.
 *
 * The tests below pin that: not to bless it, but so the inconsistency cannot
 * keep being invisible. A calculator page showing "Basic 0%" is making a claim,
 * and at tier 21 the save fixture refutes it directly — 171,255 basics were
 * killed at tier 21. See `enemy-type-mix-vs-save.test.ts`.
 */
describe('waveInfoSpawnChances', () => {
  it('sums to 100 while the residual is positive', () => {
    for (const tier of [9, 12, 15, 18]) {
      const chances = waveInfoSpawnChances(tier, 4875)
      const total = chances.Basic + chances.Fast + chances.Tank + chances.Ranged + chances.Protector
      expect(total, `tier ${tier}`).toBe(100)
    }
  })

  it('stops summing to 100 once the clamp engages', () => {
    // The defect, stated as a measurement. At these tiers the displayed
    // chances add up to more than a whole, which no probability distribution
    // can do — the page is showing an over-subscribed mix and calling the
    // leftover zero.
    for (const tier of [24, 30, 40]) {
      const chances = waveInfoSpawnChances(tier, 4875)
      const total = chances.Basic + chances.Fast + chances.Tank + chances.Ranged + chances.Protector
      expect(total, `tier ${tier}`).toBeGreaterThan(100)
      expect(chances.Basic, `tier ${tier}`).toBe(0)
    }
  })

  it('freezes fast, tank and ranged above tier 21', () => {
    // The tier weight table has 13 entries and is indexed by `tier - 9`, so
    // every tier from 21 up shares tier 21's weights. Whether the game does the
    // same is unverified — this records that the model does.
    const base = waveInfoSpawnChances(21, 4875)
    for (const tier of [24, 30, 40]) {
      const chances = waveInfoSpawnChances(tier, 4875)
      expect(chances.Fast, `tier ${tier}`).toBe(base.Fast)
      expect(chances.Tank, `tier ${tier}`).toBe(base.Tank)
      expect(chances.Ranged, `tier ${tier}`).toBe(base.Ranged)
    }
  })

  it('keeps the displayed reference chances independent of the modeled wave', () => {
    
    // wave from tier AND wave, then recomputes the normal chance. This model
    // varies only the protector chance with wave, and at high waves not even
    // that. Recorded as a known simplification, not as agreement.
    const low = waveInfoSpawnChances(21, 4875)
    const high = waveInfoSpawnChances(21, 10662)
    expect(high.Fast).toBe(low.Fast)
    expect(high.Tank).toBe(low.Tank)
    expect(high.Ranged).toBe(low.Ranged)
  })
})
