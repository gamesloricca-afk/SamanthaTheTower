import { describe, expect, it } from 'vitest'
import { BOT_BENEFIT_COOLDOWN_LAB_INDICES, computeBotGetBenefit } from '../../src/mechanics/bots/get-benefit'
import { coinBotBonusMultiplier } from '../../src/mechanics/bots/coin-bonus'
import { botBotBoostedMultiplier, chainLightningShockMultiplier, enemyHitMultiplier } from '../../src/mechanics/bots/hit-multiplier'
import { pickBotActivationDestination } from '../../src/mechanics/bots/movement'
import { UnityRandom } from '../../src/mechanics/primitives/unity-random'

describe('computeBotGetBenefit', () => {
  it('applies base + perLevel', () => {
    expect(computeBotGetBenefit({
      baseBenefit: 50,
      benefitPerLevel: 8,
      level: 3,
      statIndex: 0,
    })).toBe(74)
  })

  it('subtracts cooldown lab for flame index 8', () => {
    expect(computeBotGetBenefit({
      baseBenefit: 75,
      benefitPerLevel: -3,
      level: 5,
      statIndex: BOT_BENEFIT_COOLDOWN_LAB_INDICES.flame,
      cooldownLab: { researchBase: 0, researchPerLevel: 1, selectedLevel: 10 },
    })).toBe(50)
  })
})

describe('enemyHitMultiplier', () => {
  it('multiplies amplify bot bonus when in range', () => {
    expect(enemyHitMultiplier({
      amplifyBot: { active: true, amplifyBonusMultiplier: 5 },
    })).toBe(5)
  })

  it('doubles for flame module debuff', () => {
    expect(enemyHitMultiplier({
      flameModuleDebuff: { active: true },
    })).toBe(2)
  })

  it('applies chain lightning shock baseline and stacks with flame debuff', () => {
    expect(chainLightningShockMultiplier(3, 2)).toBe(5)
    expect(enemyHitMultiplier({
      chainLightningShock: { active: true, shockMultiplier: 3, shockStack: 2 },
      flameModuleDebuff: { active: true },
    })).toBe(10)
  })
})

describe('coinBotBonusMultiplier', () => {
  it('returns golden bot bonus when in range', () => {
    expect(coinBotBonusMultiplier(true, 4)).toBe(4)
    expect(coinBotBonusMultiplier(true, 0.5)).toBe(1)
  })
})

describe('botBotBoostedMultiplier', () => {
  /*   * The test agreed with the code because it was written from the code. That is what let a
   * doubled multiplier sit in the planner without anything going red.
   */
  it('is the bonus alone, applied over the fraction of the time it lands', () => {
    expect(botBotBoostedMultiplier(2, 1)).toBe(2)
    expect(botBotBoostedMultiplier(2, 0.5)).toBe(1.5)
    expect(botBotBoostedMultiplier(2, 0)).toBe(1)
  })
})

describe('pickBotActivationDestination', () => {
  it('is deterministic for a fixed seed', () => {
    const rng = UnityRandom.fromSeed(42)
    const first = pickBotActivationDestination(rng, 60, 1)
    const rng2 = UnityRandom.fromSeed(42)
    const second = pickBotActivationDestination(rng2, 60, 1)
    expect(first).toEqual(second)
  })
})
