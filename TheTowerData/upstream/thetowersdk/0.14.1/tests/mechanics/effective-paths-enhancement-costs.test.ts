import { describe, expect, it } from 'vitest'
import {
  EFFECTIVE_HEALTH_ENHANCEMENTS,
  ENHANCEMENT_SPEND_UNLOCKS,
  UTILITY_ENHANCEMENT_SPEND_UNLOCKS,
  enhancementCoinCost,
  enhancementCoinSpend,
  enhancementMaxLevel,
  enhancementStats,
  WORKSHOP_ENHANCEMENT_CATEGORIES,
  workshopEnhancementSpend,
} from '../../src/mechanics/effective-paths/enhancement-costs'
import { computeEffectiveHealth, effectiveHealthPerks, ZERO_EFFECTIVE_HEALTH_LEVELS } from '../../src/mechanics/effective-paths/ehp-model'
import { type EffectiveHealthConfig } from '../../src/mechanics/effective-paths/types'
import { EFFECTIVE_HEALTH_UPGRADES, planEffectiveHealthPath } from '../../src/mechanics/effective-paths/ehp-plan'

describe('workshop enhancement costs', () => {
  it('charges what the sheet charges', () => {
    // Read back from the live sheet's WSPCOST_SINGLE_ADJUSTED with no discounts.
    expect(enhancementCoinCost('Health', 1)).toBe(5_000_000_000)
    expect(enhancementCoinCost('Health', 2)).toBe(5_040_000_000)
    expect(enhancementCoinCost('Recovery Package', 5)).toBe(5_330_000_000)
  })

  it('stacks the category lab and the vault discount multiplicatively', () => {
    const base = enhancementCoinCost('Health', 1) as number

    // Health is a defense enhancement, so only the defense lab touches it.
    expect(enhancementCoinCost('Health', 1, { defenseDiscountLabLevel: 10 }))
      .toBeCloseTo(base * 0.97, 4)
    expect(enhancementCoinCost('Health', 1, { attackDiscountLabLevel: 10 })).toBe(base)

    // 0.97 * 0.9 = 0.873, not 1 - 0.03 - 0.1 = 0.87.
    expect(enhancementCoinCost('Health', 1, {
      defenseDiscountLabLevel: 10, globalDiscountPct: 0.1,
    })).toBeCloseTo(base * 0.97 * 0.9, 4)
  })

  it('applies the right lab to each category', () => {
    expect(WORKSHOP_ENHANCEMENT_CATEGORIES['Damage']).toBe('attack')
    expect(WORKSHOP_ENHANCEMENT_CATEGORIES['Wall Health']).toBe('defense')
    expect(WORKSHOP_ENHANCEMENT_CATEGORIES['Recovery Package']).toBe('utility')

    const base = enhancementCoinCost('Recovery Package', 3) as number
    expect(enhancementCoinCost('Recovery Package', 3, { utilityDiscountLabLevel: 20 }))
      .toBeCloseTo(base * 0.94, 4)
    expect(enhancementCoinCost('Recovery Package', 3, { defenseDiscountLabLevel: 20 })).toBe(base)
  })

  it('knows where each enhancement stops, and they are not all the same', () => {
    expect(enhancementMaxLevel('Health')).toBe(600)
    expect(enhancementMaxLevel('Attack Speed')).toBe(100)
    expect(enhancementMaxLevel('Enemy Level Skips')).toBe(60)
    expect(enhancementMaxLevel('Nonsense')).toBeNull()
  })

  it('refuses a level it has no price for', () => {
    const max = enhancementMaxLevel('Attack Speed') as number
    expect(enhancementCoinCost('Attack Speed', max)).not.toBeNull()
    expect(enhancementCoinCost('Attack Speed', max + 1)).toBeNull()
    expect(enhancementCoinCost('Health', 0)).toBeNull()
    expect(enhancementCoinCost('Nonsense', 1)).toBeNull()
  })

  it('prices all eighteen', () => {
    expect(enhancementStats()).toHaveLength(18)
    for (const stat of enhancementStats()) {
      expect(WORKSHOP_ENHANCEMENT_CATEGORIES[stat], stat).toBeDefined()
      expect(enhancementCoinCost(stat, 1), stat).toBeGreaterThan(0)
    }
  })
})

describe('planning a coin path', () => {
  const config: EffectiveHealthConfig = {
    health: { workshopLevel: 400 },
    defenseAbsolute: { workshopLevel: 200 },
    defensePercent: { workshopLevel: 50 },
    wallHealth: { workshopLevel: 100 },
    maxRecovery: { workshopLevel: 50 },
    cards: {
      health: { has: true, value: 2 },
      defenseAbsolute: { has: false, value: 1 },
      defensePercent: { has: false, value: 0 },
    },
    armor: { primaryBonus: 1.5, hasAssist: true, assistBonus: 1.3, labBonusCap: 20 },
    labSubstatCap: { armor: 20, generator: 20 },
    wall: { has: true, primaryEffect: 2, assistEffect: 1 },
    recovery: { has: true },
    perks: effectiveHealthPerks({
      apply: true,
      health: true,
      healthRegen: true,
      extraDefense: true,
      absoluteDefense: true,
      enemyDamageTradeOff: true,
    }),
    chronoField: { unlocked: false },
    chainThunder: { has: false, damageShare: 0 },
    deathWave: { hasHealth: false },
    enemiesAttackingTogether: 2,
    dissonance: { active: false, tierPersonalBest: 0, allTierPersonalBests: [] },
  }

  it('buys only enhancements, and prices them in coins', () => {
    const plan = planEffectiveHealthPath({
      config, levels: ZERO_EFFECTIVE_HEALTH_LEVELS, variant: 'coin', steps: 25,
    })

    expect(plan.steps.length).toBeGreaterThan(0)
    for (const step of plan.steps) {
      expect(step.name).toMatch(/\+$/)
      expect(step.cost).toBeGreaterThan(1e9)
    }
    const excluded = plan.excluded.map(entry => entry.sheetName)
    expect(excluded).toContain('Health')
    expect(excluded).toContain('Assist Module Substats - Armor')
  })

  it('spreads across the enhancements a player actually benefits from', () => {
    const plan = planEffectiveHealthPath({
      config, levels: ZERO_EFFECTIVE_HEALTH_LEVELS, variant: 'coin', steps: 40,
    })
    const chosen = new Set(plan.steps.map(step => step.name))
    expect(chosen.size).toBeGreaterThan(1)
    expect(plan.finalEffectiveHealth).toBeGreaterThan(plan.startingEffectiveHealth)
  })

  it('leaves out an enhancement whose stat the player does not have', () => {
    const noWall = { ...config, wall: { has: false, primaryEffect: 0, assistEffect: 0 } }
    const plan = planEffectiveHealthPath({
      config: noWall, levels: ZERO_EFFECTIVE_HEALTH_LEVELS, variant: 'coin', steps: 40,
    })
    // Wall Health + is still a candidate, but with no wall it gains nothing,
    // so a greedy path should never pick it.
    expect(plan.steps.some(step => step.name === 'Wall Health +')).toBe(false)
  })

  it('passes the discounts through to what it charges', () => {
    const full = planEffectiveHealthPath({
      config, levels: ZERO_EFFECTIVE_HEALTH_LEVELS, variant: 'coin', steps: 1,
    })
    const discounted = planEffectiveHealthPath({
      config,
      levels: ZERO_EFFECTIVE_HEALTH_LEVELS,
      variant: 'coin',
      steps: 1,
      enhancementDiscounts: { defenseDiscountLabLevel: 50, utilityDiscountLabLevel: 50 },
    })
    expect(discounted.steps[0].cost).toBeCloseTo(full.steps[0].cost * 0.85, 4)
  })

  it('stops at each enhancement\'s own cap', () => {
    const plan = planEffectiveHealthPath({
      config,
      levels: { ...ZERO_EFFECTIVE_HEALTH_LEVELS, enhancementHealth: 599 },
      variant: 'coin',
      steps: 2,
      excludeKeys: EFFECTIVE_HEALTH_UPGRADES.filter(upgrade => upgrade.key !== 'enhancementHealth').map(upgrade => upgrade.key),
    })
    const healthSteps = plan.steps.filter(step => step.name === 'Health +')
    expect(healthSteps).toHaveLength(1)
    expect(healthSteps[0].level).toBe(600)
  })

  it('names an enhancement for every eHP stat that has one', () => {
    for (const [levelKey, stat] of Object.entries(EFFECTIVE_HEALTH_ENHANCEMENTS)) {
      expect(enhancementMaxLevel(stat), stat).toBeGreaterThan(0)
      const upgrade = EFFECTIVE_HEALTH_UPGRADES.find(entry => entry.key === levelKey)
      expect(upgrade?.enhancementStat, levelKey).toBe(stat)
    }
  })
})

describe('workshop levels resolve through the table', () => {
  it('takes a level and finds the value, in the sheet\'s units', () => {
    const base: EffectiveHealthConfig = {
      health: { workshopLevel: 1 },
      defenseAbsolute: { workshopLevel: 0 },
      defensePercent: { workshopLevel: 0 },
      wallHealth: { workshopLevel: 0 },
      maxRecovery: { workshopLevel: 0 },
      cards: {
        health: { has: false, value: 1 },
        defenseAbsolute: { has: false, value: 1 },
        defensePercent: { has: false, value: 0 },
      },
      armor: { primaryBonus: 1, hasAssist: false, assistBonus: 1, labBonusCap: 0 },
      labSubstatCap: { armor: 0, generator: 0 },
      wall: { has: false, primaryEffect: 0, assistEffect: 0 },
      recovery: { has: false },
      perks: effectiveHealthPerks(),
      chronoField: { unlocked: false },
      chainThunder: { has: false, damageShare: 0 },
      deathWave: { hasHealth: false },
      enemiesAttackingTogether: 1,
      dissonance: { active: false, tierPersonalBest: 0, allTierPersonalBests: [] },
    }

    // Workshop health level 1 is 10 in the table.
    expect(computeEffectiveHealth(base, ZERO_EFFECTIVE_HEALTH_LEVELS).health).toBeCloseTo(10, 9)
  })

  it('lets an explicit value override a level', () => {
    const config = {
      health: { workshopLevel: 1, workshopValue: 999 },
    } as unknown as EffectiveHealthConfig
    const full = {
      ...config,
      defenseAbsolute: { workshopValue: 0 },
      defensePercent: { workshopValue: 0 },
      wallHealth: { workshopValue: 0 },
      maxRecovery: { workshopValue: 0 },
      cards: {
        health: { has: false, value: 1 },
        defenseAbsolute: { has: false, value: 1 },
        defensePercent: { has: false, value: 0 },
      },
      armor: { primaryBonus: 1, hasAssist: false, assistBonus: 1, labBonusCap: 0 },
      labSubstatCap: { armor: 0, generator: 0 },
      wall: { has: false, primaryEffect: 0, assistEffect: 0 },
      recovery: { has: false },
      perks: effectiveHealthPerks(),
      chronoField: { unlocked: false },
      chainThunder: { has: false, damageShare: 0 },
      deathWave: { hasHealth: false },
      enemiesAttackingTogether: 1,
      dissonance: { active: false, tierPersonalBest: 0, allTierPersonalBests: [] },
    } as EffectiveHealthConfig

    expect(computeEffectiveHealth(full, ZERO_EFFECTIVE_HEALTH_LEVELS).health).toBeCloseTo(999, 9)
  })

  it('counts an enhancement level as 1% of its stat', () => {
    const config: EffectiveHealthConfig = {
      health: { workshopValue: 100 },
      defenseAbsolute: { workshopValue: 0 },
      defensePercent: { workshopValue: 0 },
      wallHealth: { workshopValue: 0 },
      maxRecovery: { workshopValue: 0 },
      cards: {
        health: { has: false, value: 1 },
        defenseAbsolute: { has: false, value: 1 },
        defensePercent: { has: false, value: 0 },
      },
      armor: { primaryBonus: 1, hasAssist: false, assistBonus: 1, labBonusCap: 0 },
      labSubstatCap: { armor: 0, generator: 0 },
      wall: { has: false, primaryEffect: 0, assistEffect: 0 },
      recovery: { has: false },
      perks: effectiveHealthPerks(),
      chronoField: { unlocked: false },
      chainThunder: { has: false, damageShare: 0 },
      deathWave: { hasHealth: false },
      enemiesAttackingTogether: 1,
      dissonance: { active: false, tierPersonalBest: 0, allTierPersonalBests: [] },
    }

    const plain = computeEffectiveHealth(config, ZERO_EFFECTIVE_HEALTH_LEVELS).health
    const enhanced = computeEffectiveHealth(config, {
      ...ZERO_EFFECTIVE_HEALTH_LEVELS, enhancementHealth: 25,
    }).health
    expect(enhanced).toBeCloseTo(plain * 1.25, 9)
  })
})

describe('the enhancement spend gate', () => {
  it('counts nothing at level zero, and the first level at level one', () => {
    // `WSPCOST_SINGLE_ADJUSTED_CUMULATIVE("Health", 1)` is 0 and `(…, 2)` is
    // 5e9 on the live sheet, so the sum runs up to but not past the level.
    expect(enhancementCoinSpend('Health', 0)).toBe(0)
    expect(enhancementCoinSpend('Health', 1)).toBe(5_000_000_000)
    expect(enhancementCoinSpend('Health', 5)).toBe(25_680_000_000)
    expect(enhancementCoinSpend('Health', 10)).toBe(55_540_000_000)
    expect(enhancementCoinSpend('Orb Size', 10)).toBe(1_420_900_000_000)
  })

  it('takes the vault discount, and not the category lab', () => {
    // The sheet's cumulative variant applies only `1 - AY25`, unlike its
    // single-level twin, so a category lab must not change it.
    expect(enhancementCoinSpend('Health', 5, { globalDiscountPct: 0.1 }))
      .toBeCloseTo(25_680_000_000 * 0.9, 3)
    expect(enhancementCoinSpend('Health', 5, { defenseDiscountLabLevel: 50 }))
      .toBe(25_680_000_000)
  })

  it('sums the six defensive enhancements, including the three eHP ignores', () => {
    const levels = { 'Health': 5, 'Orb Size': 10 }
    expect(workshopEnhancementSpend(levels))
      .toBe(25_680_000_000 + 1_420_900_000_000)
  })

  it('gates only the two enhancements the sheet gates', () => {
    expect(ENHANCEMENT_SPEND_UNLOCKS['Defense Absolute']).toBe(500_000_000_000)
    expect(ENHANCEMENT_SPEND_UNLOCKS['Wall Health']).toBe(50_000_000_000_000)
    expect(ENHANCEMENT_SPEND_UNLOCKS['Health']).toBeUndefined()
    expect(ENHANCEMENT_SPEND_UNLOCKS['Recovery Package']).toBeUndefined()
  })

  it('pins the utility spend unlocks the econ path shares with the wiki', () => {
    // Wiki: Coin Bonus 50B Utility spend; Free Upgrades 5T. Sheet EO2/EP2 use
    // `<=`, so unlocking is strictly above those figures.
    expect(UTILITY_ENHANCEMENT_SPEND_UNLOCKS['Coin Bonus']).toBe(50_000_000_000)
    expect(UTILITY_ENHANCEMENT_SPEND_UNLOCKS['Free Upgrades']).toBe(5_000_000_000_000)
  })

  it('reads tracker WSP_* codes when summing defensive spend', () => {
    expect(workshopEnhancementSpend({ WSP_HEALTH: 5, WSP_ORB_SIZE: 10 }))
      .toBe(25_680_000_000 + 1_420_900_000_000)
  })
})
