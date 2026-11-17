import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { BOT_PLUS_UNLOCK_COST, BOT_UPGRADES_DATA, botStatValueAt } from '../../src/data/bots/data'

/**
 * The bot tables, compared against the versioned numeric fixture.
 *
 * `facts/<version>/bots.json` pins the expected stat curves, slot grouping and
 * cost ladders. Agreement is a regression check, not independent validation.
 *
 * WHAT THIS IS GUARDING. The twenty stat slots are not laid out four-per-bot, and the four
 * columns are NOT the same four stats for every bot:
 *
 *     Flame    Damage    Range  Cooldown  Damage Reduction
 *     Thunder  Duration  Range  Cooldown  Linger
 *     Golden   Bonus     Range  Cooldown  Duration
 *     Amplify  Bonus     Range  Cooldown  Duration
 *     Bot      Bonus     Range  Cooldown  Duration
 *
 * Only Range and Cooldown are common to all five. Flame has neither a Duration nor a Bonus.
 * Anything that reads the columns positionally — and a per-bot allocator is exactly the kind
 * of thing that wants to — gets Flame and Thunder wrong while every number it reads stays
 * individually plausible. So this asserts the stat NAMES per bot, not just the values.
 *
 * Amplify's Bot+ ladder steps 200 a level where every other bot steps 50. That is a real
 * difference and it is easy to lose to a shared constant, so it is checked by name.
 */

const FACTS = path.resolve(__dirname, '../../facts/v29.0.0')

interface BotFact {
  gameVersion: string
  levelUpCost: { formula: string; base: number; perLevel: number; costs: number[] }
  botPlus: { unlockCost: number; upgradeCostFormula: string }
  synchronicity: { unlockCost: number; upgradeCosts: number[]; maxBotsFormula: string }
  bots: {
    botType: number
    key: string
    name: string
    statSlots: number[]
    stats: {
      slot: number
      statName: string
      maxLevel: number
      baseBenefit: number
      benefitPerLevel: number
      benefitAtMaxLevel: number
    }[]
    plus: {
      maxLevel: number
      baseBenefit: number
      benefitPerLevel: number
      upgradeCostBase: number
      upgradeCostPerLevel: number
    }
  }[]
}

const fact = JSON.parse(readFileSync(path.join(FACTS, 'bots.json'), 'utf8')) as BotFact

/** Readings of a stored value this package legitimately uses. */
function readings(stored: number): number[] {
  return [stored, stored * 100]
}

const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(5e-3, Math.abs(b) * 2e-3)

describe('bot stat tables match the versioned reference', () => {
  it('has every bot the game defines', () => {
    expect(fact.bots.map(b => b.name).sort()).toEqual(BOT_UPGRADES_DATA.map(b => b.name).sort())
  })

  it('the five bots partition the twenty stat slots exactly once', () => {
    // The grouping must cover each of the twenty slots exactly once.
    const flat = fact.bots.flatMap(b => b.statSlots).sort((a, b) => a - b)
    expect(flat).toEqual(Array.from({ length: 20 }, (_, i) => i))
  })

  it.each(fact.bots.map(b => [b.name, b] as const))('%s stat names', (_name, gameBot) => {
    const sdkBot = BOT_UPGRADES_DATA.find(b => b.name === gameBot.name)!
    expect(sdkBot).toBeTruthy()
    // Order differs — the game's slot order is not the display order — so compare as sets.
    expect(Object.keys(sdkBot.stats).sort()).toEqual(gameBot.stats.map(s => s.statName).sort())
    expect(sdkBot.statOrder.slice().sort()).toEqual(gameBot.stats.map(s => s.statName).sort())
  })

  it.each(fact.bots.map(b => [b.name, b] as const))('%s stat curves', (_name, gameBot) => {
    const sdkBot = BOT_UPGRADES_DATA.find(b => b.name === gameBot.name)!
    for (const stat of gameBot.stats) {
      const sdkStat = sdkBot.stats[stat.statName]
      expect(sdkStat, `${gameBot.name} has no ${stat.statName}`).toBeTruthy()

      expect(sdkStat.maxLevel, `${gameBot.name} ${stat.statName} max level`).toBe(stat.maxLevel)
      const levels = Array.from({ length: sdkStat.maxLevel + 1 }, (_, level) => level)

      // One unit convention has to explain EVERY level. Allowing a different reading per
      // level would let a single wrong entry through as a unit change.
      const consistent = [0, 1].some(which =>
        levels.every(level => close(
          botStatValueAt(sdkStat, level),
          readings(stat.baseBenefit + stat.benefitPerLevel * level)[which],
        )),
      )
      expect(
        consistent,
        `${gameBot.name} ${stat.statName} does not follow ${stat.baseBenefit} + `
        + `${stat.benefitPerLevel} * level under any single unit convention`,
      ).toBe(true)
    }
  })

  it('base is the value at level 0, never level 1', () => {
    // Adding `base` to a level-0 benefit double-counts, and both numbers look right.
    for (const gameBot of fact.bots) {
      const sdkBot = BOT_UPGRADES_DATA.find(b => b.name === gameBot.name)!
      for (const stat of gameBot.stats) {
        const sdkStat = sdkBot.stats[stat.statName]
        // `base` IS the level-0 value now, by construction rather than by convention.
        expect(sdkStat.base).toBe(botStatValueAt(sdkStat, 0))
      }
    }
  })

  it('cooldown improves as it levels, and nothing else regresses', () => {
    // `benefitPerLevel` is negative for Cooldown alone. A consumer that assumes "higher is
    // better" inverts exactly one stat, on every bot.
    for (const gameBot of fact.bots) {
      for (const stat of gameBot.stats) {
        const shouldFall = stat.statName === 'Cooldown'
        expect(
          stat.benefitPerLevel < 0,
          `${gameBot.name} ${stat.statName} per-level is ${stat.benefitPerLevel}`,
        ).toBe(shouldFall)
      }
    }
  })
})

describe('bot cost ladders match the game', () => {
  it('level-up cost is 100 + 40 * level', () => {
    expect(fact.levelUpCost.base).toBe(100)
    expect(fact.levelUpCost.perLevel).toBe(40)
    // The SDK's arrays are 1-indexed: entry n is the cost of the nth upgrade, which the
    // game charges at level n-1.
    for (const sdkBot of BOT_UPGRADES_DATA) {
      for (let upgrade = 1; upgrade < sdkBot.costs.length; upgrade++) {
        expect(sdkBot.costs[upgrade], `${sdkBot.name} upgrade ${upgrade}`)
          .toBe(100 + 40 * (upgrade - 1))
      }
    }
  })

  it('Bot+ unlock cost matches', () => {
    expect(BOT_PLUS_UNLOCK_COST).toBe(fact.botPlus.unlockCost)
  })

  it.each(fact.bots.map(b => [b.name, b] as const))('%s Bot+ ladder', (_name, gameBot) => {
    const sdkBot = BOT_UPGRADES_DATA.find(b => b.name === gameBot.name)!
    expect(sdkBot.plus, `${gameBot.name} has no Bot+`).toBeTruthy()
    const step = gameBot.plus.upgradeCostPerLevel
    // Amplify steps 200; everyone else steps 50. Applying one shared ladder to all five
    // underprices a maxed Amplify Bot+ by 5,400 — and every entry still looks like a cost.
    expect(step, `${gameBot.name} Bot+ cost step`).toBe(gameBot.key === 'Amplify' ? 200 : 50)
    for (let upgrade = 1; upgrade <= gameBot.plus.maxLevel; upgrade++) {
      expect(sdkBot.plus!.costs[upgrade], `${gameBot.name} Bot+ upgrade ${upgrade}`)
        .toBe(100 + step * (upgrade - 1))
    }
  })
})

describe('synchronicity', () => {
  it('the first two bot slots are free and the rest cost the same', () => {
    // `SynchronicityMaxBots = synchronicityLevel + 2`, so the base level already carries two
    // slots and only the slots past them are paid for.
    expect(fact.synchronicity.upgradeCosts.slice(0, 2)).toEqual([0, 0])
    for (const cost of fact.synchronicity.upgradeCosts.slice(2)) {
      expect(cost).toBe(fact.synchronicity.unlockCost)
    }
  })
})
