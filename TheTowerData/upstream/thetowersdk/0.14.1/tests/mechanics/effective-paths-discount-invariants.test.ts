import { describe, expect, it } from 'vitest'
import {
  effectiveEconomyDiscountPriority,
  planEffectiveEconomyDiscountPath,
  RETROACTIVE_DISCOUNT_LABS,
} from '../../src/mechanics/effective-paths/eecon-discount'
import { ZERO_EFFECTIVE_ECONOMY_LEVELS } from '../../src/mechanics/effective-paths/eecon-levels'

/**
 * The discount path's own walk.
 *
 * ## Why it needs its own file
 *
 * Every other path goes through `planPath`, so the structural invariants in
 * `effective-paths-invariants.test.ts` cover all eight of them at once. The
 * discount path does not: it ranks coins *saved* rather than coins earned, it
 * picks one category per step through a priority selector, and it has its own
 * loop. None of the shared checks reach it.
 *
 * It is also the path most likely to look broken when it is right. `eEcon
 * Discount!AY14` ships **on**, which hides five of its eleven candidates, and
 * on an account that has finished the sixth the honest answer is an empty
 * table. That has already been reported as a bug once.
 */

/** An account with something invested everywhere, so every category can pay. */
const TOTALS = {
  labCoins: 5e12,
  enhancementAttackCoins: 8e11,
  enhancementDefenseCoins: 6e11,
  enhancementUtilityCoins: 9e11,
  moduleCoins: 3e11,
}

const levels = () => ({ ...ZERO_EFFECTIVE_ECONOMY_LEVELS.discount })

const plan = (steps: number, hideRetroactive = false) => planEffectiveEconomyDiscountPath({
  totals: TOTALS,
  levels: levels(),
  steps,
  hideRetroactiveDiscountLabs: hideRetroactive,
})

describe('the discount path', () => {
  const result = plan(20)

  it('plans something on an account with coins invested', () => {
    expect(result.steps.length).toBeGreaterThan(0)
  })

  it('numbers its steps from one, without gaps', () => {
    expect(result.steps.map(step => step.step))
      .toEqual(result.steps.map((_, index) => index + 1))
  })

  it('buys one level at a time, in order, per candidate', () => {
    const seen = new Map<string, number>()
    for (const step of result.steps) {
      const previous = seen.get(step.id)
      if (previous !== undefined) {
        expect(step.level, `${step.name} jumped from ${previous}`).toBe(previous + 1)
      }
      seen.set(step.id, step.level)
    }
  })

  it('accumulates cost exactly, and only upwards', () => {
    let running = 0
    for (const step of result.steps) {
      running += step.cost
      expect(step.cumulativeCost, `step ${step.step}`).toBeCloseTo(running, 6)
    }
  })

  it('totals exactly the coins its steps say they save', () => {
    /*
     * `coinsSaved` is `0` for the Workshop Utility Discount candidate, whose
     * `value` is a cost multiplier rather than coins — two quantities in one
     * column, as on the sheet. So the total has to sum `coinsSaved` and not
     * `value`, and this is what says which one it summed.
     */
    const summed = result.steps.reduce((total, step) => total + step.coinsSaved, 0)
    expect(result.totalCoinsSaved).toBeCloseTo(summed, 6)
  })

  it('never reports a negative saving', () => {
    for (const step of result.steps) {
      expect(step.coinsSaved, step.name).toBeGreaterThanOrEqual(0)
    }
  })

  it('gives the same answer twice', () => {
    expect(plan(20).steps.map(step => `${step.id}@${step.level}`))
      .toEqual(result.steps.map(step => `${step.id}@${step.level}`))
  })

  it('extends rather than rewrites when asked for more', () => {
    const longer = plan(30)
    expect(longer.steps.slice(0, result.steps.length).map(step => `${step.id}@${step.level}`))
      .toEqual(result.steps.map(step => `${step.id}@${step.level}`))
  })

  it('explains every candidate it did not plan', () => {
    const planned = new Set(result.steps.map(step => step.name))
    for (const entry of result.excluded) {
      expect(entry.reason, entry.sheetName).toBeTruthy()
      expect(planned.has(entry.sheetName), `${entry.sheetName} was planned and excluded`).toBe(false)
    }
  })
})

describe('Hide Retroactive Discount Labs — eEcon Discount!AY14', () => {
  it('takes the five off and says what they have in common', () => {
    /*
     * Matched on the reason the code actually gives — "only discounts coins
     * already spent" — rather than on the word "retroactive", which is the
     * sheet's label for the switch and appears nowhere in the message. The
     * first version of this test looked for the label and matched nothing.
     */
    const hidden = plan(20, true)
    const reasons = hidden.excluded.filter(entry => /already spent/i.test(entry.reason))
    expect(reasons.length).toBe(RETROACTIVE_DISCOUNT_LABS.length)
  })

  it('leaves a shorter path, not a broken one', () => {
    /*
     * The sheet ships this **on**, so its discount tab offers exactly one
     * candidate — and an account that has maxed Labs Coin Discount, which is
     * common, sees nothing at all. That is the sheet's answer, and it was
     * reported here as a bug before the exclusions explained themselves.
     */
    const hidden = plan(20, true)
    const shown = plan(20, false)
    expect(hidden.steps.length).toBeLessThanOrEqual(shown.steps.length)
    expect(hidden.excluded.length).toBeGreaterThan(shown.excluded.length)
  })
})

describe('the priority selector — eEcon Discount!CK5', () => {
  it('picks a category while any of them has room', () => {
    expect(effectiveEconomyDiscountPriority(levels(), TOTALS)).toBeTruthy()
  })

  it('returns null rather than a category with nothing left', () => {
    // The loop's stop condition. A selector that kept naming a finished
    // category would spin, or worse, plan a level nobody can buy.
    const capped = effectiveEconomyDiscountPriority(levels(), TOTALS, { capOf: () => 0 })
    expect(capped).toBeNull()
  })

  it('prefers the category with the most coins behind it', () => {
    /*
     * It ranks absolute coins saved per day, not relative — which is the one
     * place on this tab where the account totals decide the order rather than
     * merely scaling it. Starve every category but one and that one must win.
     */
    const onlyUtility = {
      ...TOTALS,
      labCoins: 1,
      enhancementAttackCoins: 1,
      enhancementDefenseCoins: 1,
      moduleCoins: 1,
    }
    expect(effectiveEconomyDiscountPriority(levels(), onlyUtility)).toBe('enhancementUtilityDiscount')
  })
})
