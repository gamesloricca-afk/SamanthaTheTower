import { describe, expect, it } from 'vitest'
import {
  DISCOUNT_LAB_NAME_BY_KEY,
  DISCOUNT_PRIORITY_ORDER,
  effectiveEconomyDiscountPriority,
  effectiveEconomyDiscountSaving,
  effectiveEconomyDiscountValue,
  LAB_DISCOUNT_UNCOUNTED_LABS,
  labCoinsRemaining,
  labCoinsRemainingDetailed,
  moduleCoinsInvested,
  planEffectiveEconomyDiscountPath,
  RETROACTIVE_DISCOUNT_LABS,
  workshopEnhancementCoinsInvested,
} from '../../src/mechanics/effective-paths/eecon-discount'
import type { EffectiveEconomyDiscountKey, EffectiveEconomyDiscountTotals } from '../../src/mechanics/effective-paths/types'
import { LAB_CATALOG } from '../../src/data/labs/catalog.data'
import { labMaxCatalogLevel } from '../../src/mechanics/effective-paths/lab-costs'
import { ZERO_EFFECTIVE_ECONOMY_LEVELS } from '../../src/mechanics/effective-paths/eecon-levels'

/**
 * The discount path.
 *
 * The values here are the ones probed off the live sheet: `EPC_LAB_DISCOUNT`
 * and `EPC_MOD_DISCOUNT` were read at levels 0..40 and are exactly linear, so
 * the assertions are against that line rather than against a fixture of one
 * account's numbers.
 */

const TOTALS: EffectiveEconomyDiscountTotals = {
  labCoins: 4.89707e22,
  enhancementAttackCoins: 5e9,
  enhancementDefenseCoins: 2e9,
  enhancementUtilityCoins: 1e9,
  moduleCoins: 80000,
}

const ZERO = ZERO_EFFECTIVE_ECONOMY_LEVELS.discount

describe('what a level is worth', () => {
  it('takes 0.3% off the lab total a level, as the sheet does', () => {
    // `EPC_LAB_DISCOUNT(1)/EPC_LAB_DISCOUNT(0)` measured 0.997 exactly.
    const zero = effectiveEconomyDiscountValue('labsCoinDiscount', 0, TOTALS)
    const one = effectiveEconomyDiscountValue('labsCoinDiscount', 1, TOTALS)
    expect(zero).toBeCloseTo(TOTALS.labCoins, 6)
    expect(one / zero).toBeCloseTo(0.997, 12)
  })

  it('takes 1% off the module total a level', () => {
    expect(effectiveEconomyDiscountValue('moduleCoinCost', 0, TOTALS)).toBe(80000)
    expect(effectiveEconomyDiscountValue('moduleCoinCost', 1, TOTALS)).toBe(79200)
    expect(effectiveEconomyDiscountValue('moduleCoinCost', 40, TOTALS)).toBe(48000)
  })

  it('grows the workshop utility multiplier rather than shrinking a total', () => {
    expect(effectiveEconomyDiscountValue('workshopUtilityDiscount', 0, TOTALS)).toBe(1)
    expect(effectiveEconomyDiscountValue('workshopUtilityDiscount', 10, TOTALS))
      .toBeCloseTo(1 / 0.95, 12)
  })

  it('reports no coins saved for the multiplier candidate', () => {
    // It saves coins, but not a number of them — the sheet shows the
    // multiplier in that column instead, and inventing a coin figure here
    // would put two different quantities in one total.
    expect(effectiveEconomyDiscountSaving('workshopUtilityDiscount', 3, TOTALS)).toBe(0)
    expect(effectiveEconomyDiscountSaving('moduleCoinCost', 0, TOTALS)).toBe(800)
  })
})

describe('every candidate names a real lab', () => {
  for (const [key, name] of Object.entries(DISCOUNT_LAB_NAME_BY_KEY)) {
    it(`prices ${key}`, () => {
      expect(labMaxCatalogLevel(name), `${key} -> ${name}`).toBeGreaterThan(0)
    })
  }

  it('gates five of the six on the priority selector', () => {
    // Workshop Utility Discount is deliberately absent: the sheet's `CL`
    // column, unlike the other five, does not check `CK5`.
    expect([...DISCOUNT_PRIORITY_ORDER].sort()).toEqual(
      (Object.keys(DISCOUNT_LAB_NAME_BY_KEY) as EffectiveEconomyDiscountKey[])
        .filter(key => key !== 'workshopUtilityDiscount').sort(),
    )
  })
})

describe('the priority selector', () => {
  it('picks the category saving the most coins a day', () => {
    const rich: EffectiveEconomyDiscountTotals = { ...TOTALS, enhancementAttackCoins: 1e30 }
    expect(effectiveEconomyDiscountPriority(ZERO, rich)).toBe('enhancementAttackDiscount')
  })

  it('is decided by absolute savings, not by rate', () => {
    // Module coin cost discounts at 1% a level against the labs' 0.3%, so a
    // rate-based selector would always pick it. The lab total is 17 orders of
    // magnitude larger, and absolute coins are what the sheet compares.
    expect(effectiveEconomyDiscountPriority(ZERO, TOTALS)).toBe('labsCoinDiscount')
  })

  it('skips a category with nothing left to buy', () => {
    const maxed = {
      ...ZERO,
      labsCoinDiscount: labMaxCatalogLevel(DISCOUNT_LAB_NAME_BY_KEY.labsCoinDiscount),
    }
    expect(effectiveEconomyDiscountPriority(maxed, TOTALS)).not.toBe('labsCoinDiscount')
  })

  it('has nothing to pick when every total is zero', () => {
    const nothing: EffectiveEconomyDiscountTotals = {
      labCoins: 0,
      enhancementAttackCoins: 0,
      enhancementDefenseCoins: 0,
      enhancementUtilityCoins: 0,
      moduleCoins: 0,
    }
    // Every gain ties at zero, and the sheet's `IFS` still names the first —
    // so this returns a category rather than null. The planner then drops it
    // for having no return, and buys the one candidate whose worth does not
    // depend on a total: the workshop utility multiplier.
    expect(effectiveEconomyDiscountPriority(ZERO, nothing)).toBe('enhancementAttackDiscount')
    const plan = planEffectiveEconomyDiscountPath({
      totals: nothing, levels: ZERO, steps: 5, hideRetroactiveDiscountLabs: false,
    })
    expect(plan.totalCoinsSaved).toBe(0)
    for (const step of plan.steps) expect(step.id).toBe('discount.workshopUtilityDiscount')
  })
})

describe('planning the path', () => {
  it('buys improving levels and charges research days for them', () => {
    const plan = planEffectiveEconomyDiscountPath({
      totals: TOTALS, levels: ZERO, steps: 12, hideRetroactiveDiscountLabs: false,
    })

    expect(plan.steps).toHaveLength(12)
    for (const step of plan.steps) {
      expect(step.cost, step.name).toBeGreaterThan(0)
      expect(step.roi, step.name).toBeGreaterThan(0)
      expect(step.level, step.name).toBeGreaterThanOrEqual(1)
    }
    expect(plan.steps.at(-1)?.cumulativeCost).toBeGreaterThan(plan.steps[0].cumulativeCost)
  })

  it('only ever buys the multiplier or the step\'s chosen category', () => {
    const plan = planEffectiveEconomyDiscountPath({
      totals: TOTALS, levels: ZERO, steps: 30, hideRetroactiveDiscountLabs: false,
    })
    for (const step of plan.steps) {
      const key = step.id.replace('discount.', '') as EffectiveEconomyDiscountKey
      if (key === 'workshopUtilityDiscount') continue
      expect(key, `step ${step.step}`).toBe(step.priority)
    }
  })

  it('totals only the coins, leaving the multiplier out of the sum', () => {
    const plan = planEffectiveEconomyDiscountPath({
      totals: TOTALS, levels: ZERO, steps: 20, hideRetroactiveDiscountLabs: false,
    })
    const summed = plan.steps.reduce((total, step) => total + step.coinsSaved, 0)
    expect(plan.totalCoinsSaved).toBeCloseTo(summed, 6)
    for (const step of plan.steps) {
      if (step.id.endsWith('workshopUtilityDiscount')) expect(step.coinsSaved).toBe(0)
    }
  })

  it('respects a stop the player set', () => {
    const plan = planEffectiveEconomyDiscountPath({
      totals: TOTALS,
      levels: ZERO,
      steps: 30,
      hideRetroactiveDiscountLabs: false,
      targetLevels: { labsCoinDiscount: 0 },
    })
    expect(plan.steps.some(step => step.id.endsWith('labsCoinDiscount'))).toBe(false)
  })

  it('stops when every candidate is maxed rather than planning empty steps', () => {
    const maxed = {
      ...ZERO,
      ...Object.fromEntries(
        Object.entries(DISCOUNT_LAB_NAME_BY_KEY).map(([key, name]) => [key, labMaxCatalogLevel(name)]),
      ),
    }
    expect(planEffectiveEconomyDiscountPath({
      totals: TOTALS, levels: maxed, steps: 10, hideRetroactiveDiscountLabs: false,
    }).steps).toHaveLength(0)
  })
})

describe('the totals the priority selector weighs', () => {
  /**
   * The five level sets below were fed to the live
   * `WSPATTACK_TOTAL_COINS_INVESTED` on the working copy, alongside the sheet's
   * own six attack enhancement names, and these are the numbers it returned.
   */
  const ATTACK = ['Damage', 'Rend Armor', 'Critical Factor', 'Damage/Meter', 'Super Crit Mult', 'Attack Speed']
  const levelsOf = (values: number[]) =>
    Object.fromEntries(ATTACK.map((stat, index) => [stat, values[index]]))

  const CASES: Array<[number[], number]> = [
    [[1, 0, 0, 0, 0, 0], 5_000_000_000],
    [[2, 0, 0, 0, 0, 0], 10_040_000_000],
    [[10, 0, 0, 0, 0, 0], 55_540_000_000],
    [[0, 5, 0, 0, 0, 0], 25_680_000_000],
    [[3, 4, 5, 6, 7, 8], 6_891_120_000_000],
  ]

  for (const [levels, expected] of CASES) {
    it(`matches the sheet's attack total at ${levels.join('/')}`, () => {
      expect(workshopEnhancementCoinsInvested('attack', levelsOf(levels))).toBe(expected)
    })
  }

  it('counts only its own category', () => {
    const levels = { ...levelsOf([10, 0, 0, 0, 0, 0]), Health: 10 }
    expect(workshopEnhancementCoinsInvested('attack', levels)).toBe(55_540_000_000)
    expect(workshopEnhancementCoinsInvested('defense', levels)).toBeGreaterThan(0)
    expect(workshopEnhancementCoinsInvested('utility', levels)).toBe(0)
  })

  it('reads tracker WSP_* codes for utility spend', () => {
    // Without this the econ unlock gates and discount totals silently read 0.
    expect(workshopEnhancementCoinsInvested('utility', { WSP_CASH_BONUS: 10 }))
      .toBe(55_540_000_000)
    expect(workshopEnhancementCoinsInvested('utility', { 'Cash Bonus': 10 }))
      .toBe(55_540_000_000)
  })

  it('totals an empty module preset at the 80,000 the sheet returns', () => {
    // Eight slots, each counting one level at 10,000 — the figure
    // `EPC_MOD_DISCOUNT` gives for an account with nothing equipped.
    expect(moduleCoinsInvested([0, 0, 0, 0, 0, 0, 0, 0])).toBe(80_000)
  })

  it('matches the sheet with one module at level 100 equipped', () => {
    // Measured: a level-100 module in the preset's primary slot and seven
    // empty slots gives `EPC_MOD_DISCOUNT` exactly this.
    expect(moduleCoinsInvested([100, 0, 0, 0, 0, 0, 0, 0])).toBe(16_296_510_000)
  })

  it('lands within 1% of the total the sheet gives', () => {
    // `EPC_LAB_DISCOUNT` returns this for an account with every lab at zero,
    // read off the live sheet. Measured the same way: setting a lab to its
    // maximum drops the function by exactly that lab's remaining cost.
    //
    // 0.035% of the gap is the two tables disagreeing on labs they both have;
    // the rest is the 40 labs — masteries, Enemy Defense — that the sheet's
    // table does not carry and this deliberately still counts.
    const sheet = 4.897074139405717e22
    const ours = labCoinsRemainingDetailed(() => 0, { basis: 'ep-port-baseline' }).coins
    expect(ours / sheet).toBeGreaterThan(1)
    expect(ours / sheet).toBeLessThan(1.01)
  })

  it('leaves out the labs the sheet does not count', () => {
    // Original four fleet enemy labs at 3.835e23 each, plus three v29 fleet
    // siblings at 3.835e26 — counting any of them swamps a 4.9e22 total.
    const counted = labCoinsRemainingDetailed(() => 0, { basis: 'ep-port-baseline' }).coins
    const withThem = LAB_DISCOUNT_UNCOUNTED_LABS.reduce((total, name) => {
      const record = LAB_CATALOG.find(entry => entry.slug === name || entry.name === name)
      expect(record, name).toBeTruthy()
      return total + (record?.levels ?? []).reduce((a, level) => a + level.cost, 0)
    }, counted)
    expect(withThem / counted).toBeGreaterThan(30)
  })

  it('leaves labs already bought out of what is left to pay', () => {
    const everything = labCoinsRemaining(() => 0)
    const nothing = labCoinsRemaining(() => 9999)
    expect(everything).toBeGreaterThan(1e22)
    expect(nothing).toBe(0)
  })
})

describe('explicit lab-cost populations and coverage', () => {
  const PRIMARY_LABS = ['primary_module_bonus_cannon', 'primary_module_bonus_armor', 'primary_module_bonus_generator', 'primary_module_bonus_core']
  const PRIMARY_LAB_COST = 3.8350012088012697e25
  it('separates current primary-lab costs from the frozen sheet population', () => {
    const current = labCoinsRemainingDetailed(() => 0, { basis: 'current-catalog' })
    const frozen = labCoinsRemainingDetailed(() => 0, { basis: 'ep-port-baseline' })
    expect((current.coins - frozen.coins) / PRIMARY_LAB_COST).toBeCloseTo(4, 10)
    expect(frozen.omittedLabs.filter(lab => PRIMARY_LABS.includes(lab.slug)).map(lab => lab.slug).sort()).toEqual([...PRIMARY_LABS].sort())
    expect(current.coverageGaps).toEqual([])
    expect(frozen.coverageGaps.every(lab => !lab.costIncluded)).toBe(true)
  })
  it('moves the real remaining cost when primary research is completed', () => {
    const empty = labCoinsRemainingDetailed(() => 0, { basis: 'current-catalog' })
    const complete = labCoinsRemainingDetailed(name => PRIMARY_LABS.includes(name) ? 30 : 0, { basis: 'current-catalog' })
    expect((empty.coins - complete.coins) / PRIMARY_LAB_COST).toBeCloseTo(4, 10)
    expect(labCoinsRemaining(() => 0)).toBe(empty.coins)
  })
  it('refuses an unknown cost population', () => {
    expect(() => labCoinsRemainingDetailed(() => 0, { basis: 'invalid' as never })).toThrow(/lab cost basis/)
  })
})
