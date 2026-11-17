import { describe, expect, it } from 'vitest'
import { coinsPerKill, ECONOMY_PERK_STACKS, freeUpgradeChance } from '../../src/mechanics/effective-paths/eecon-stats'

/**
 * The perk terms, against the live sheet.
 *
 * Recorded from the oracle rather than reasoned about, because the perk layer
 * was the last thing wired and the sheet has a trap in it: `eEcon!AW45` and
 * `AW46` show a Quantity of five beside the Coins and Free Upgrades perks,
 * which reads like an input. It is not. `EPC_CPK` and `EPC_FUP` each take
 * exactly twelve arguments, neither has a slot for a quantity, and passing a
 * thirteenth is an arity error — the five is written inside the lambdas.
 *
 * These two cases are the ones that would have caught shipping a quantity
 * input: they pin the multiplier at `1 + 0.15 × 5` and the addend at
 * `0.05 × 5`, whatever the page shows.
 */

describe('the coins perk, against EPC_CPK', () => {
  it('matches the sheet with every term live', () => {
    // EPC_CPK(1.4, 12, 30, 20, 0.3, 0.2, 25, TRUE, 40, TRUE, 10, 0.15)
    expect(coinsPerKill({
      workshopValue: 1.4, labLevel: 12, stoneCap: 30, labCap: 20,
      primarySubstat: 0.3, assistSubstat: 0.2, enhancementLevel: 25,
      hasCoinPerk: true, standardPerksBonusLabLevel: 40,
      hasCoinTradeOffPerk: true, improveTradeOffPerksLabLevel: 10, vaultPct: 0.15,
    })).toBeCloseTo(18.63617765625, 9)
  })

  it('is worth 1.75x on its own, which is five stacks', () => {
    // EPC_CPK(1.4, 0 …, TRUE, 0, FALSE, 0, 0) is 2.45, and 2.45 / 1.4 = 1.75.
    const bare = {
      workshopValue: 1.4, labLevel: 0, stoneCap: 0, labCap: 0,
      primarySubstat: 0, assistSubstat: 0, enhancementLevel: 0,
      standardPerksBonusLabLevel: 0, hasCoinTradeOffPerk: false,
      improveTradeOffPerksLabLevel: 0, vaultPct: 0,
    }
    expect(coinsPerKill({ ...bare, hasCoinPerk: true })).toBeCloseTo(2.45, 9)
    expect(coinsPerKill({ ...bare, hasCoinPerk: false })).toBeCloseTo(1.4, 9)
    expect(1 + 0.15 * ECONOMY_PERK_STACKS).toBeCloseTo(1.75, 9)
  })
})

describe('the free upgrades perk, against EPC_FUP', () => {
  it('matches the sheet with every term live', () => {
    // EPC_FUP(0.1, TRUE, 0.05, TRUE, 25, 30, 20, 0.3, 0.2, 60, 0.1, 0.15)
    expect(freeUpgradeChance({
      workshopValue: 0.1, hasFreeUpgradesCard: true, cardValue: 0.05, hasPerk: true,
      standardPerksBonusLabLevel: 25, stoneCap: 30, labCap: 20,
      primarySubstat: 0.3, assistSubstat: 0.2, enhancementLevel: 60,
      relicPct: 0.1, vaultPct: 0.15,
    })).toBeCloseTo(1.7497480000000003, 9)
  })

  it('adds a flat 25% on its own, which is the same five stacks', () => {
    // EPC_FUP(0.1, FALSE, 0, TRUE, 0 …) is 0.35 against 0.1 without it.
    const bare = {
      workshopValue: 0.1, hasFreeUpgradesCard: false, cardValue: 0,
      standardPerksBonusLabLevel: 0, stoneCap: 0, labCap: 0,
      primarySubstat: 0, assistSubstat: 0, enhancementLevel: 0,
      relicPct: 0, vaultPct: 0,
    }
    expect(freeUpgradeChance({ ...bare, hasPerk: true })).toBeCloseTo(0.35, 9)
    expect(freeUpgradeChance({ ...bare, hasPerk: false })).toBeCloseTo(0.1, 9)
    expect(0.05 * ECONOMY_PERK_STACKS).toBeCloseTo(0.25, 9)
  })
})
