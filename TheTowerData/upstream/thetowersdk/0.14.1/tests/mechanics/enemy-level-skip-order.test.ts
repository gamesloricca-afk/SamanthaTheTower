import { describe, expect, it } from 'vitest'
import { applyTierBattleConditionsToSkipChance, buildLevelSkipChanceRaw } from '../../src/mechanics/enemies/level-skip'

/**
 * Order of operations, checked against the shipped calculation model.
 *
 * The calculation is branch-free arithmetic (v28.3.0), so the order the terms
 * combine in IS the specification:
 *
 *   sum sources -> x enhancement -> clamp 0..1
 *     -> subtract ELS Reduction -> clamp 0
 *     -> multiply by Skip Reduction - Multiply
 *     -> subtract Skip Decay -> clamp 0
 *
 * Every step is commutative-looking and none of them are. Swapping any pair
 * still returns a number in range, which is why this needs pinning rather than
 * reviewing.
 */

describe('the reductions run in the modeled order', () => {
  it('subtracts before it multiplies', () => {
    /*
     * The distinguishing case: with both a subtract and a multiply active, the
     * two orders give different answers. If they ever agree, this test has
     * stopped discriminating and the inputs need changing, not the assertion.
     */
    const start = 0.5
    const subtractOnly = applyTierBattleConditionsToSkipChance(start, {
      elsReductionLevel: 20,
      elsReductionUseWorkshopSubtract: true,
    })
    const both = applyTierBattleConditionsToSkipChance(start, {
      elsReductionLevel: 20,
      elsReductionUseWorkshopSubtract: true,
      skipReductionMultiplyLevel: 5,
    })
    const multiplyOnly = applyTierBattleConditionsToSkipChance(start, {
      skipReductionMultiplyLevel: 5,
    })

    expect(subtractOnly).toBeLessThan(start)
    expect(multiplyOnly).toBeLessThan(start)

    // subtract-then-multiply == multiply applied to the ALREADY-subtracted value.
    const factor = multiplyOnly / start
    expect(both).toBeCloseTo(subtractOnly * factor, 10)

    // ...and that is NOT the same as subtracting from the multiplied value.
    const wrongOrder = multiplyOnly - (start - subtractOnly)
    expect(both, 'the two orders must actually differ, or this proves nothing')
      .not.toBeCloseTo(wrongOrder, 6)
  })

  it('floors at zero after the subtract, not only at the end', () => {
    /*
     * A single clamp at the end lets an over-large subtract go negative and
     * then be scaled back toward zero — or, with a multiplier above one, back
     * up into positive territory. The game clamps at each step.
     */
    const crushed = applyTierBattleConditionsToSkipChance(0.05, {
      elsReductionLevel: 200,
      elsReductionUseWorkshopSubtract: true,
      skipReductionMultiplyLevel: 5,
    })
    expect(crushed).toBe(0)
  })

  it('clamps to 0..1 BEFORE the battle conditions bite', () => {
    /*
     * So a total above 100% does not absorb the reduction. Two builds, one at
     * 100% and one far above it, land on the same post-condition value.
     */
    const atCap = applyTierBattleConditionsToSkipChance(1, {
      elsReductionLevel: 20,
      elsReductionUseWorkshopSubtract: true,
    })
    const wayOverCap = applyTierBattleConditionsToSkipChance(5, {
      elsReductionLevel: 20,
      elsReductionUseWorkshopSubtract: true,
    })
    expect(wayOverCap).toBe(atCap)
    expect(atCap).toBeLessThan(1)
  })
})

describe('every source the game adds is a source we add', () => {
  it('moves the total when the vault tech tree moves', () => {
    /*
     * Both vault and module bonuses must contribute to the total.
     * Persisting a field and reading it are different claims,
     * so assert the output moves rather than that the field exists.
     */
    const base = { kind: 'attack' as const, utilityLevel: 100 }
    const without = buildLevelSkipChanceRaw(base)
    const withVault = buildLevelSkipChanceRaw({ ...base, techTreeBenefit: 0.015 })
    const withModules = buildLevelSkipChanceRaw({ ...base, moduleClusterBenefit: 0.02 })

    expect(withVault, 'vault tech tree must change the total').toBeGreaterThan(without)
    expect(withModules, 'module cluster benefit must change the total').toBeGreaterThan(without)
    expect(withVault - without).toBeCloseTo(0.015, 10)
    expect(withModules - without).toBeCloseTo(0.02, 10)
  })

  it('applies the enhancement as a multiplier over the whole sum, not one term', () => {
    const base = { kind: 'attack' as const, utilityLevel: 100, techTreeBenefit: 0.015 }
    const plain = buildLevelSkipChanceRaw(base)
    const enhanced = buildLevelSkipChanceRaw({ ...base, enemyLevelSkipEnhancement: 2 })

    // A multiplier over the SUM doubles everything, including the vault term.
    expect(enhanced).toBeCloseTo(plain * 2, 10)
  })
})

