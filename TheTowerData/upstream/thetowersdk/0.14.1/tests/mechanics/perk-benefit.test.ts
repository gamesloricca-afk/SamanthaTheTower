import { describe, expect, it } from 'vitest'
import { findPerkCatalogRow } from '../../src/save/catalogs/perks'
import {
  computePerkBenefitDown,
  computePerkBenefits,
  computePerkBenefitUp,
  PERK_INDEX_WITH_HALF_LAB,
  PERK_INDICES_WITHOUT_LAB_SCALING,
  perkCarriesIdentityTerm,
  perkMaxLevel,
} from '../../src/mechanics/perks/benefit'

/**
 * Stacking, against the formula the game runs.
 *
 * The claim this file exists for: a perk whose `base` is 0 has NO implicit 1, so
 * stacking it is linear. "Land Mine Damage x3.50" taken twice is worth 7.0, not
 * 8.0 — and 8.0 is what you get by reading the "x" in the name as a
 * multiplier-with-identity, which is the natural reading.
 *
 * Nothing in this repo computed multi-stack perk totals before, so the claim had
 * no consumer to be wrong in. Now it does.
 */

describe('base decides whether stacking is linear or offset', () => {
  it('gives a base-1 perk the implicit 1', () => {
    // "x1.20 Max Health", increase 0.2, base 1 -> 1 + 0.2*q
    expect(perkCarriesIdentityTerm(0)).toBe(true)
    expect(computePerkBenefitUp({ index: 0, quantity: 1 })).toBeCloseTo(1.2, 10)
    expect(computePerkBenefitUp({ index: 0, quantity: 5 })).toBeCloseTo(2.0, 10)
  })

  it('gives a base-0 perk none, so two stacks are 7.0 and not 8.0', () => {
    /*
     * The whole point. "Land Mine Damage x3.50" is stored as base 0,
     * increase 3.5 — so the second stack adds another 3.5 rather than
     * compounding onto an implicit 1.
     */
    expect(perkCarriesIdentityTerm(6)).toBe(false)
    expect(computePerkBenefitUp({ index: 6, quantity: 1 })).toBeCloseTo(3.5, 10)
    expect(computePerkBenefitUp({ index: 6, quantity: 2 })).toBeCloseTo(7.0, 10)
    expect(computePerkBenefitUp({ index: 6, quantity: 2 })).not.toBeCloseTo(8.0, 6)
  })

  it('is linear in quantity for base-0 and affine for base-1', () => {
    const stepBaseZero = (q: number) =>
      computePerkBenefitUp({ index: 6, quantity: q })! - computePerkBenefitUp({ index: 6, quantity: q - 1 })!
    const stepBaseOne = (q: number) =>
      computePerkBenefitUp({ index: 0, quantity: q })! - computePerkBenefitUp({ index: 0, quantity: q - 1 })!

    // Same increment every step in both cases — the difference is the intercept,
    // not the slope, and stating it this way is what makes "linear" checkable.
    for (const q of [2, 3, 4, 5]) {
      expect(stepBaseZero(Math.min(q, 5))).toBeCloseTo(3.5, 10)
      expect(stepBaseOne(q)).toBeCloseTo(0.2, 10)
    }
    expect(computePerkBenefitUp({ index: 6, quantity: 0 })).toBe(0)
    expect(computePerkBenefitUp({ index: 0, quantity: 0 })).toBe(1)
  })
})

describe('the two perk labs are not interchangeable', () => {
  it('scales standard perks with Standard Perks Bonus and nothing else', () => {
    const withStandard = computePerkBenefitUp({ index: 0, quantity: 5, standardPerksBonus: 0.08 })
    const withTradeOff = computePerkBenefitUp({ index: 0, quantity: 5, improveTradeOffPerks: 0.08 })

    expect(withStandard).toBeCloseTo(2.0 * 1.08, 10)
    // A standard perk must ignore the trade-off lab entirely.
    expect(withTradeOff).toBeCloseTo(2.0, 10)
  })

  it('scales trade-offs with Improve Trade-off Perks and nothing else', () => {
    const withTradeOff = computePerkBenefitUp({ index: 40, quantity: 1, improveTradeOffPerks: 0.5 })
    const withStandard = computePerkBenefitUp({ index: 40, quantity: 1, standardPerksBonus: 0.5 })

    expect(withTradeOff).toBeCloseTo(1.5 * 1.5, 10)
    expect(withStandard).toBeCloseTo(1.5, 10)
  })

  it('leaves the integer perks and every UW perk unscaled by either lab', () => {
    /*
     * Bounce Shot and Orbs are integer counts; a percentage bonus on them makes
     * no sense and the game does not apply one. UW perks are flat too — "Swamp
     * Radius x1.5" is x1.5 regardless of labs.
     */
    for (const index of PERK_INDICES_WITHOUT_LAB_SCALING) {
      const plain = computePerkBenefitUp({ index, quantity: 1 })
      const labbed = computePerkBenefitUp({
        index,
        quantity: 1,
        standardPerksBonus: 0.5,
        improveTradeOffPerks: 0.5,
      })
      expect(labbed, `perk ${index} must ignore both labs`).toBe(plain)
    }
    expect(computePerkBenefitUp({ index: 4, quantity: 3 })).toBeCloseTo(6, 10)
    expect(computePerkBenefitUp({ index: 7, quantity: 2 })).toBeCloseTo(2, 10)
  })
})

describe('the reduction trade-offs return a multiplier, not a reduction', () => {
  it('turns "Enemies Damage -50%" into a 0.5 multiplier', () => {
    // increase 0.5, returned as 1 - 0.5 = 0.5, which is what the call site
    // multiplies enemy damage by.
    expect(computePerkBenefitUp({ index: 43, quantity: 1 })).toBeCloseTo(0.5, 10)
    // The lab makes the reduction BIGGER, so the multiplier gets smaller.
    expect(computePerkBenefitUp({ index: 43, quantity: 1, improveTradeOffPerks: 0.2 }))
      .toBeCloseTo(1 - 0.5 * 1.2, 10)
  })

  it('gives boss health only half the lab, which is unique to perk 48', () => {
    const halved = computePerkBenefitUp({
      index: PERK_INDEX_WITH_HALF_LAB,
      quantity: 1,
      improveTradeOffPerks: 0.4,
    })
    expect(halved).toBeCloseTo(1 - 0.7 * (1 + 0.4 / 2), 6)

    // Every other complement perk gets the full lab, so the two differ.
    const full = computePerkBenefitUp({ index: 45, quantity: 1, improveTradeOffPerks: 0.4 })
    expect(full).toBeCloseTo(1 - 0.4 * 1.4, 6)
  })
})

describe('the surface refuses to invent answers', () => {
  it('returns null in the index gaps rather than a plausible zero', () => {
    for (const index of [15, 19, 29, 39, 50, -1]) {
      expect(computePerkBenefitUp({ index, quantity: 1 }), `index ${index}`).toBeNull()
      expect(perkMaxLevel(index)).toBeNull()
    }
  })

  it('clamps quantity to the perk maximum instead of extrapolating', () => {
    const atMax = computePerkBenefitUp({ index: 0, quantity: 5 })
    expect(computePerkBenefitUp({ index: 0, quantity: 99 })).toBe(atMax)
    expect(computePerkBenefitUp({ index: 0, quantity: -3 })).toBe(1)
  })

  it('returns per-perk values and never a single combined multiplier', () => {
    /*
     * Deliberate. Perk 0 lands on max health, perk 6 on mine damage, perk 43 on
     * enemy damage — combining them into one number would be a summary that
     * reads as useful and cannot be correct.
     */
    const result = computePerkBenefits({ 0: 5, 6: 2, 43: 1 }, { standardPerksBonus: 0.08 })
    expect([...result.keys()].sort((a, b) => a - b)).toEqual([0, 6, 43])
    expect(result.get(6)).toBeCloseTo(7.0 * 1.08, 10)
    expect(result.get(43)).toBeCloseTo(0.5, 10)
  })

  it('keeps the penalty side flat, with no lab term', () => {
    // The Improve Trade-off Perks lab raises the benefit only.
    expect(computePerkBenefitDown(40)).toBeCloseTo(8, 6)
    expect(computePerkBenefitDown(43)).toBeCloseTo(0.5, 6)
    expect(computePerkBenefitDown(0)).toBeNull()
  })

  it('agrees with the catalog on which indices exist', () => {
    for (const index of [0, 7, 14, 20, 28, 40, 49]) {
      expect(perkMaxLevel(index), `perk ${index}`).toBe(findPerkCatalogRow(index)?.maxLevel)
    }
  })
})
