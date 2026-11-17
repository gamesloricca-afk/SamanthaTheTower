import { describe, expect, it } from 'vitest'
import {
  coinFarmDays,
  EFFECTIVE_ECONOMY_UPGRADES,
  planEffectiveEconomyPath,
  SHEET_DEFAULT_COINS_PER_HOUR,
} from '../../src/mechanics/effective-paths/eecon-plan'
import { ZERO_EFFECTIVE_ECONOMY_LEVELS } from '../../src/mechanics/effective-paths/eecon-levels'
import { zeroEffectiveEconomyConfig } from '../../src/mechanics/effective-paths/eecon-compute'

/**
 * `eEcon!O3` — counting research days only.
 *
 * ## What it is for
 *
 * Twenty-three candidates share the time path and four of them cost coins with
 * no research time at all: the two workshop enhancements and the two Generator
 * module levels. Ranked by return per *day*, a purchase that takes no days is
 * free — and free beats everything, forever.
 *
 * The sheet's answer is the tab's cost mode. `EO2`, `EP2`, `EQ2` and `ER2` —
 * the hide rows of those four and of nothing else — each open with
 * `NOT(O$3<>"DO")`, so all four leave the path when the mode is `DO`. Under
 * `D+FT` they stay, priced by how long farming their coins takes at the
 * `Coin / Hour` rate.
 *
 * Both halves are modelled: `DO` drops the four, and `D+FT` prices every
 * candidate at its research duration plus `coins / (CpH * 23)`, which is
 * `eEcon!E6` and `O6` respectively.
 */

/** An account with enough of everything for the path to have somewhere to go. */
function account() {
  const zero = zeroEffectiveEconomyConfig()
  return {
    ...zero,
    unlockedUltimateWeaponCount: 12,
    baseCoinsPerKill: 1,
    waveDurationSeconds: 35,
    timeMultiplier: 1,
    coinsPerKill: { value: 12, relicPct: 0.05, vaultPct: 0.05 },
  }
}
const FOUR = [
  'Coin Bonus',
  'Free Upgrades',
  'Primary Module - Generator',
  'Assist Module - Generator',
]

const plan = (daysOnly: boolean) => planEffectiveEconomyPath({
  config: account() as never,
  levels: ZERO_EFFECTIVE_ECONOMY_LEVELS,
  variant: 'time',
  steps: 60,
  daysOnly,
  workshopEnhancementsUnlocked: true,
})

describe('the four coin-priced candidates', () => {
  it('are all in the time path’s list to begin with', () => {
    // The precondition. If the names drifted, every check below would pass by
    // matching nothing.
    const names = new Set(
      EFFECTIVE_ECONOMY_UPGRADES
        .filter(upgrade => upgrade.variants.includes('time'))
        .map(upgrade => upgrade.sheetName),
    )
    for (const name of FOUR) expect(names, name).toContain(name)
  })

  it('leave the path when days only is on, and say why', () => {
    const excluded = new Map(plan(true).excluded.map(entry => [entry.sheetName, entry.reason]))
    for (const name of FOUR) {
      expect(excluded.get(name), name).toMatch(/counting days only/)
    }
  })

  it('are never planned as a step under days only', () => {
    // Excluding them from the candidate list and still planning one would mean
    // two lists disagreeing, which is worse than either behaviour alone.
    const names = plan(true).steps.map(step => step.name)
    for (const name of FOUR) expect(names, name).not.toContain(name)
  })

  it('are not excluded for that reason when it is off', () => {
    const excludedForMode = plan(false).excluded
      .filter(entry => /counting days only/.test(entry.reason))
    expect(excludedForMode).toEqual([])
  })
})

describe('the farm-time conversion', () => {
  /*
   * `eEcon!E6`, read off the sheet rather than derived here:
   *
   *   =IF(AND(O3<>"DO", NOT(ISBLANK(CpH))),
   *        <that level's coin cost> / (UNFORMAT_NUMBER(CpH) * 23), )
   *
   * With the tab's own `Cost` of 30 and its default 100K/hr it evaluates to
   * 1.3043478260869566e-5 days, which is the figure below. It is the whole
   * reason the 23 is not 24: agreeing with the sheet beats a rounder number.
   */
  const SHEET_COST = 30
  const SHEET_RATE = 100_000
  const SHEET_FARM_DAYS = 1.3043478260869566e-5

  it('matches the sheet cell it comes from', () => {
    /*
     * Against the exported conversion, not against arithmetic repeated here.
     * The first version of this test computed `cost / (rate * 23)` and compared
     * it to `cost / (rate * 23)`, so changing the constant to 24 left the whole
     * suite green — the test asserted its own copy of the formula.
     */
    expect(coinFarmDays(SHEET_COST, SHEET_RATE)).toBeCloseTo(SHEET_FARM_DAYS, 18)
  })

  it('uses the sheet’s 23 and not a day’s 24 hours', () => {
    // Off by 4%: small enough to look right in a ranking, wrong in every cost.
    expect(coinFarmDays(SHEET_COST, SHEET_RATE)).not.toBeCloseTo(SHEET_COST / (SHEET_RATE * 24), 18)
  })

  it('defaults to the rate the sheet ships', () => {
    expect(coinFarmDays(SHEET_COST)).toBe(coinFarmDays(SHEET_COST, SHEET_DEFAULT_COINS_PER_HOUR))
    expect(SHEET_DEFAULT_COINS_PER_HOUR).toBe(SHEET_RATE)
  })

  it('treats a rate of zero as no farming rather than dividing by it', () => {
    // A player who has not set one must not get Infinity in every cost.
    expect(coinFarmDays(SHEET_COST, 0)).toBe(0)
  })

  it('leaves no step priced like a coin figure', () => {
    /*
     * The defect this closes, stated as a property rather than about one
     * candidate. A level 253 `Assist Module - Generator` read `2.8e19 d` on a
     * path measured in days, because its raw coin cost was the cost.
     *
     * Deliberately not "the four are planned": correctly priced, they are
     * expensive and stop winning the early steps, so demanding one appear would
     * fail *because* the fix works.
     */
    for (const step of plan(false).steps) {
      expect(step.cost, `${step.name} costs ${step.cost} days`).toBeLessThan(1e6)
    }
  })

  it('costs less the faster the player farms', () => {
    // Twice the coins an hour is half the farm time, so the same path is
    // cheaper — whichever candidates it happens to pick.
    const at = (coinsPerHour: number) => planEffectiveEconomyPath({
      config: account() as never,
      levels: ZERO_EFFECTIVE_ECONOMY_LEVELS,
      variant: 'time',
      steps: 20,
      coinsPerHour,
      workshopEnhancementsUnlocked: true,
    }).steps.reduce((total, step) => total + step.cost, 0)

    expect(at(50_000)).toBeGreaterThan(at(100_000))
  })

  it('halves a lab’s farm time when the rate doubles', () => {
    /*
     * The conversion itself, isolated. A lab's cost is research + farm, and
     * only the second half moves with the rate — so the difference between two
     * rates is exactly the difference between their farm times.
     */
    const firstLab = (coinsPerHour: number) => planEffectiveEconomyPath({
      config: account() as never,
      levels: ZERO_EFFECTIVE_ECONOMY_LEVELS,
      variant: 'time',
      steps: 1,
      coinsPerHour,
      workshopEnhancementsUnlocked: true,
    }).steps[0]

    const slow = firstLab(50_000)
    const fast = firstLab(100_000)
    const research = plan(true).steps[0]

    expect(slow.name).toBe(fast.name)
    expect(research.name).toBe(fast.name)
    expect(slow.cost - research.cost).toBeCloseTo((fast.cost - research.cost) * 2, 12)
  })

  it('adds farm time to a lab’s research time rather than replacing it', () => {
    /*
     * `eEcon!O6` accumulates `MAP(Duration, FarmTime, (d, c) => d + c)`, so a
     * lab costs both. Days-only drops the second half, so a lab must be cheaper
     * under days-only than under days-plus-farm-time — and still not free.
     */
    const lab = (daysOnly: boolean) => plan(daysOnly).steps
      .find(step => !FOUR.includes(step.name))

    const withFarm = lab(false)
    const withoutFarm = lab(true)
    expect(withoutFarm?.name).toBe(withFarm?.name)
    expect(withoutFarm!.cost).toBeGreaterThan(0)
    expect(withFarm!.cost).toBeGreaterThan(withoutFarm!.cost)
  })
})

describe('the rest of the path', () => {
  it('still plans without them', () => {
    // A mode that empties the tab is not a mode, it is an outage.
    expect(plan(true).steps.length).toBeGreaterThan(0)
  })

  it('excludes nothing else for the mode', () => {
    /*
     * The clause names four columns on the sheet and no others. Hiding a fifth
     * would be this port inventing a rule, which is the failure the whole
     * candidate transcription exists to avoid.
     */
    const namedByMode = plan(true).excluded
      .filter(entry => /counting days only/.test(entry.reason))
      .map(entry => entry.sheetName)
      .sort()
    expect(namedByMode).toEqual([...FOUR].sort())
  })

  it('defaults to leaving them in', () => {
    // The sheet ships `D+FT`, so an absent option has to behave as `D+FT` does.
    const withoutOption = planEffectiveEconomyPath({
      config: account() as never,
      levels: ZERO_EFFECTIVE_ECONOMY_LEVELS,
      variant: 'time',
      steps: 60,
      workshopEnhancementsUnlocked: true,
    })
    const excludedForMode = withoutOption.excluded
      .filter(entry => /counting days only/.test(entry.reason))
    expect(excludedForMode).toEqual([])
  })
})
