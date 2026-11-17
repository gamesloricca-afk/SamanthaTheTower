import { describe, expect, it } from 'vitest'
import {
  ATTACK_ENHANCEMENT_SPEND_UNLOCKS,
  attackEnhancementSpend,
} from '../../src/mechanics/effective-paths/enhancement-costs'

/**
 * `eDamage Coins!EF5` and the five gates that read it.
 *
 * Each gated enhancement candidate opens
 *
 *     OR(NOT(GTE(EF5, <threshold>)), …)
 *
 * and `EF5` is the running total of `WSPCOST_SINGLE_ADJUSTED_CUMULATIVE` over
 * the six ATTACK enhancements. It climbs as the coin path spends, so an
 * enhancement joins the board partway down the path rather than being on it
 * from step 1 — which a single up-front exclusion set cannot express.
 *
 * Tested here rather than through the coin sweep on purpose: the sheet blanks a
 * gated enhancement on ZERO of that fixture's 39 accounts, because the
 * generator draws levels high enough that every gate is already open. The
 * planner code would otherwise be shipped unexercised, which is the failure
 * this file exists to avoid.
 */
describe('the attack enhancement spend gate', () => {
  it('matches the sheet at the bottom of the table', () => {
    // `WSPCOST_SINGLE_ADJUSTED_CUMULATIVE(stat, 1)` summed over the six is 0 on
    // the live sheet: nothing has been spent to be at level 0.
    expect(attackEnhancementSpend({})).toBe(0)
  })

  it('matches the sheet on a mixed account', () => {
    /*
     * Evaluated on the live sheet:
     *
     *   CUMULATIVE("Damage",11) + CUMULATIVE("Rend Armor",6)
     * + CUMULATIVE("Critical Factor",4) + CUMULATIVE("Damage/Meter",8)
     * + CUMULATIVE("Super Crit Mult",3) + CUMULATIVE("Attack Speed",5)
     *   = 284,160,000,000
     *
     * The sheet's arguments are each level PLUS ONE, and ours are the levels —
     * `enhancementCoinSpend(stat, L)` is the sheet's `CUMULATIVE(stat, L + 1)`.
     * Transcribing that `+ 1` on top of an already-offset function is what made
     * an empty account read 30,000,000,000 spent against the sheet's 0.
     */
    expect(attackEnhancementSpend({
      'Damage': 10,
      'Rend Armor': 5,
      'Critical Factor': 3,
      'Damage/Meter': 7,
      'Super Crit Mult': 2,
      'Attack Speed': 4,
    })).toBe(284_160_000_000)
  })

  it('is off by a whole level if the sheet argument is transcribed literally', () => {
    /*
     * Plant the fault the note above describes. If `enhancementCoinSpend` ever
     * stops being offset, these two stop differing and the check above becomes
     * a coincidence rather than a constraint.
     */
    const atZero = attackEnhancementSpend({})
    const atOne = attackEnhancementSpend({
      'Damage': 1, 'Rend Armor': 1, 'Critical Factor': 1,
      'Damage/Meter': 1, 'Super Crit Mult': 1, 'Attack Speed': 1,
    })
    expect(atOne).toBeGreaterThan(atZero)
  })

  it('carries the five thresholds the candidate columns actually read', () => {
    /*
     * Read off `eDamage Coins!EG5:EX5`. `Damage` and `Cash Bonus` are ungated
     * and so are ABSENT rather than present at zero — absent means "no gate",
     * where a zero threshold would read as "gated, and always open".
     */
    expect(ATTACK_ENHANCEMENT_SPEND_UNLOCKS).toEqual({
      'Rend Armor': 50_000_000_000,
      'Critical Factor': 500_000_000_000,
      'Damage/Meter': 5_000_000_000_000,
      'Super Crit Mult': 50_000_000_000_000,
      'Attack Speed': 500_000_000_000_000,
    })
    expect(ATTACK_ENHANCEMENT_SPEND_UNLOCKS.Damage).toBeUndefined()
  })

  it('opens the gates in the order the thresholds imply', () => {
    /*
     * A fresh account has spent nothing, so every gate is shut. The cheapest
     * gate is Rend Armor at 5e10, and an account already past 5e14 has them
     * all open — the two ends the planner has to get right.
     */
    const shut = attackEnhancementSpend({})
    for (const unlock of Object.values(ATTACK_ENHANCEMENT_SPEND_UNLOCKS)) {
      expect(shut).toBeLessThan(unlock)
    }

    const rich = attackEnhancementSpend({
      'Damage': 60,
      'Rend Armor': 60,
      'Critical Factor': 60,
      'Damage/Meter': 60,
      'Super Crit Mult': 60,
      'Attack Speed': 60,
    })
    for (const unlock of Object.values(ATTACK_ENHANCEMENT_SPEND_UNLOCKS)) {
      expect(rich).toBeGreaterThan(unlock)
    }
  })
})
