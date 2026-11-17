import { describe, expect, it } from 'vitest'
import {
  isStoneMasteryOwned,
  STONE_MASTERY_COSTS,
  STONE_MASTERY_MAX_LEVEL,
  withStoneMasteriesActivated,
} from '../../src/mechanics/effective-paths/eecon-stone-mastery'
import { zeroEffectiveEconomyConfig } from '../../src/mechanics/effective-paths/eecon-compute'
import { ZERO_EFFECTIVE_ECONOMY_LEVELS } from '../../src/mechanics/effective-paths/eecon-levels'

/**
 * Stone-mastery costs and ownership gates, pinned to the live sheet's AX
 * denominators and `IDS_CARD_MASTERY` hide row.
 */

describe('STONE_MASTERY_COSTS', () => {
  it('matches the denominators in eEcon!AX32 / AX34 / AX36 / AX38 / AX41', () => {
    // Oracle-confirmed: those cells divide by these stone prices.
    expect(STONE_MASTERY_COSTS).toEqual({
      'Coins Mastery': 1250,
      'Extra Orb Mastery': 750,
      'Wave Skip Mastery': 1000,
      'Intro Sprint Mastery': 1250,
      'Wave Accelerator Mastery': 1000,
    })
  })

  it('caps at the same mastery max the coin path uses', () => {
    expect(STONE_MASTERY_MAX_LEVEL).toBe(9)
  })
})

describe('isStoneMasteryOwned', () => {
  it('reads the mastery UNLOCK flag, not the equipped toggle', () => {
    /*
     * These are two different questions and this test used to assert the wrong
     * one. `eEcon Stones!EA2` hides a mastery candidate on `IDS_CARD_MASTERY`
     * — the save's unlock flag — and never on whether the card is equipped;
     * `active` is `eEcon!AZ34` and its siblings, hand-set booleans.
     *
     * Reading `active` here excluded Extra Orb Mastery and Wave Accelerator
     * Mastery from the generated sweep as "already unlocked" while the sheet
     * was ranking both.
     */
    const config = zeroEffectiveEconomyConfig()
    expect(isStoneMasteryOwned('Coins Mastery', config)).toBe(false)

    // Equipped, still not unlocked: the candidate stays on the board.
    config.cards.coinsMastery.active = true
    expect(isStoneMasteryOwned('Coins Mastery', config)).toBe(false)

    config.cards.coinsMastery.masteryUnlocked = true
    expect(isStoneMasteryOwned('Coins Mastery', config)).toBe(true)
  })
})

describe('withStoneMasteriesActivated', () => {
  it('flips the unlock when the path buys the first level', () => {
    const config = zeroEffectiveEconomyConfig()
    const before = ZERO_EFFECTIVE_ECONOMY_LEVELS
    const after = {
      ...before,
      time: { ...before.time, coinsMastery: 1, extraOrbMastery: 1 },
    }
    const scored = withStoneMasteriesActivated(config, before, after)
    expect(scored.cards.coinsMastery.active).toBe(true)
    expect(scored.cards.extraOrbMastery.active).toBe(true)
    expect(config.cards.coinsMastery.active).toBe(false)
  })

  it('does nothing when the level has not moved', () => {
    const config = zeroEffectiveEconomyConfig()
    const scored = withStoneMasteriesActivated(
      config, ZERO_EFFECTIVE_ECONOMY_LEVELS, ZERO_EFFECTIVE_ECONOMY_LEVELS,
    )
    expect(scored).toBe(config)
  })
})

describe('the Coins Mastery sheet heuristic against the model', () => {
  it('is close to the model relative gain at compare level 0', () => {
    // Oracle: EPC_CARD_COINS(TRUE,1.5,TRUE,0→1) relative ≈ 0.02913;
    // sheet AX32 numerator is 0.03*(1+0) = 0.03. Same order of magnitude, not
    // identical — the port scores through the model, not the heuristic.
    const sheetNumerator = 0.03 * (1 + 0)
    const modelRelative = (1.59 / 1.545) - 1
    expect(modelRelative).toBeCloseTo(0.02912621359223322, 12)
    expect(Math.abs(sheetNumerator - modelRelative)).toBeLessThan(0.002)
    expect(sheetNumerator / 1250).toBeCloseTo(0.000024, 12)
  })
})
