import { describe, expect, it } from 'vitest'
import { computeEffectiveHealth, effectiveHealthPerks, ZERO_EFFECTIVE_HEALTH_LEVELS } from '../../src/mechanics/effective-paths/ehp-model'
import { type EffectiveHealthConfig } from '../../src/mechanics/effective-paths/types'
import { planEffectiveHealthPath } from '../../src/mechanics/effective-paths/ehp-plan'
import {
  CARD_MASTERY_MAX_LEVEL,
  cardMasteryCoinCost,
  isModuleCoinPathCandidate,
  MODULE_COIN_PATH_MAX_LEVEL,
  MODULE_COIN_PATH_MIN_LEVEL,
  moduleUpgradeCoinCost,
  moduleUpgradeMaxFromLevel,
} from '../../src/mechanics/effective-paths/coin-costs'

/**
 * Expected values were read from the live sheet — `LABCOST_SINGLE_ADJUSTED`
 * for masteries and `INDEX(Data_Val_Tables!$EV$4:$EV150, …)` for modules — so
 * these check the extraction and the indexing together. The indexing is the
 * part worth pinning: both tables are keyed by the level you are leaving, and
 * an off-by-one would still produce plausible numbers.
 */
describe('card mastery coin costs', () => {
  it('charges what the sheet charges', () => {
    expect(cardMasteryCoinCost(0)).toBe(1_100_000_000_000_000.1)
    expect(cardMasteryCoinCost(1)).toBe(1_300_000_000_000_000)
    expect(cardMasteryCoinCost(8)).toBe(10_000_000_000_000_000)
  })

  it('runs out after the last mastery level', () => {
    expect(CARD_MASTERY_MAX_LEVEL).toBe(9)
    expect(cardMasteryCoinCost(CARD_MASTERY_MAX_LEVEL - 1)).not.toBeNull()
    expect(cardMasteryCoinCost(CARD_MASTERY_MAX_LEVEL)).toBeNull()
  })

  it('refuses a level that is not one', () => {
    expect(cardMasteryCoinCost(-1)).toBeNull()
    expect(cardMasteryCoinCost(1.5)).toBeNull()
  })

  it('gets more expensive as it goes', () => {
    for (let level = 1; level < CARD_MASTERY_MAX_LEVEL; level++) {
      const previous = cardMasteryCoinCost(level - 1) as number
      const current = cardMasteryCoinCost(level) as number
      expect(current, `mastery ${level}`).toBeGreaterThan(previous)
    }
  })
})

describe('module upgrade coin costs', () => {
  it('charges what the sheet charges', () => {
    // INDEX(EV4:EV150, 1) and INDEX(EV4:EV150, 147) on the live sheet.
    expect(moduleUpgradeCoinCost(1)).toBe(10_000)
    expect(moduleUpgradeCoinCost(147)).toBe(500_000_000_000)
  })

  it('covers the whole range the eHP path asks about', () => {
    // The sheet's own range errors at level 160 on the first path row; the
    // full table has it, which is the point of reading all of it.
    expect(moduleUpgradeCoinCost(MODULE_COIN_PATH_MIN_LEVEL)).toBe(10_000_000_000_000)
    for (let level = MODULE_COIN_PATH_MIN_LEVEL; level < MODULE_COIN_PATH_MAX_LEVEL; level++) {
      expect(moduleUpgradeCoinCost(level), `module ${level}`).toBeGreaterThan(0)
    }
  })

  it('takes 1% off a level for the module discount lab', () => {
    const base = moduleUpgradeCoinCost(200) as number
    expect(moduleUpgradeCoinCost(200, { discountLabLevel: 25 })).toBeCloseTo(base * 0.75, 0)
    expect(moduleUpgradeCoinCost(200, { discountLabLevel: 0 })).toBe(base)
  })

  it('stops at the end of the table rather than extrapolating', () => {
    const max = moduleUpgradeMaxFromLevel()
    expect(max).toBe(299)
    expect(moduleUpgradeCoinCost(max)).not.toBeNull()
    expect(moduleUpgradeCoinCost(max + 1)).toBeNull()
    expect(moduleUpgradeCoinCost(0)).toBeNull()
  })

  it('knows which levels the path would consider', () => {
    expect(isModuleCoinPathCandidate(159)).toBe(false)
    expect(isModuleCoinPathCandidate(160)).toBe(true)
    expect(isModuleCoinPathCandidate(299)).toBe(true)
    expect(isModuleCoinPathCandidate(300)).toBe(false)
  })

  it('gets more expensive as it goes', () => {
    let previous = 0
    for (let level = 1; level <= 299; level++) {
      const cost = moduleUpgradeCoinCost(level) as number
      expect(cost, `module ${level}`).toBeGreaterThanOrEqual(previous)
      previous = cost
    }
  })
})

const config: EffectiveHealthConfig = {
  health: { workshopLevel: 600 },
  defenseAbsolute: { workshopLevel: 300 },
  defensePercent: { workshopLevel: 60 },
  wallHealth: { workshopLevel: 150 },
  maxRecovery: { workshopLevel: 60 },
  cards: {
    // Masteries only do anything through a card that is actually equipped.
    health: { has: true, value: 2.4, hasMastery: true },
    defenseAbsolute: { has: false, value: 1 },
    defensePercent: { has: true, value: 0.05, hasMastery: true },
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
describe('masteries on the coin path', () => {

  it('offers masteries alongside enhancements', () => {
    const plan = planEffectiveHealthPath({
      config, levels: ZERO_EFFECTIVE_HEALTH_LEVELS, variant: 'coin', steps: 40,
    })
    const excluded = plan.excluded.map(entry => entry.sheetName)
    expect(excluded).not.toContain('Health Mastery')
    expect(excluded).not.toContain('Extra Defense Mastery')
    // Labs and stone upgrades are still out.
    expect(excluded).toContain('Health')
    // The *stone* assist upgrade is out; its lab twin is on the coin path.
    expect(excluded).toContain('Assist Module Bonus - Armor')
  })

  it('charges the mastery table, keyed by the level being left', () => {
    const plan = planEffectiveHealthPath({
      config,
      levels: ZERO_EFFECTIVE_HEALTH_LEVELS,
      variant: 'coin',
      steps: 60,
    })
    for (const step of plan.steps.filter(entry => entry.name.endsWith('Mastery'))) {
      expect(step.cost).toBe(cardMasteryCoinCost(step.level - 1))
    }
  })

  it('stops masteries at their cap', () => {
    const plan = planEffectiveHealthPath({
      config,
      levels: {
        ...ZERO_EFFECTIVE_HEALTH_LEVELS,
        healthMastery: CARD_MASTERY_MAX_LEVEL - 1,
        extraDefenseMastery: CARD_MASTERY_MAX_LEVEL - 1,
      },
      variant: 'coin',
      steps: 80,
      maxLevels: {
        enhancementHealth: 0,
        enhancementDefenseAbsolute: 0,
        enhancementWallHealth: 0,
        enhancementRecoveryPackage: 0,
        // The coin path buys the Assist Module labs too; pin them so only the
        // masteries are left to run out.
        assistSubstatArmorLab: 0,
        assistSubstatGeneratorLab: 0,
      },
    })
    const masterySteps = plan.steps.filter(entry => entry.name.endsWith('Mastery'))
    expect(masterySteps).toHaveLength(2)
    for (const step of masterySteps) expect(step.level).toBe(CARD_MASTERY_MAX_LEVEL)
  })
})

describe('module levels on the coin path', () => {
  const withModules = {
    ...config,
    armor: {
      ...config.armor,
      hasAssist: true,
      primaryRarity: 'Ancestral 5',
      assistRarity: 'Mythic',
    },
  }
  const at = (primary: number, assist: number) => ({
    ...ZERO_EFFECTIVE_HEALTH_LEVELS,
    primaryModuleArmor: primary,
    assistModuleArmor: assist,
  })

  /** Pin everything else so only the module levels are left to buy. */
  const MODULES_ONLY = {
    enhancementHealth: 0,
    enhancementDefenseAbsolute: 0,
    enhancementWallHealth: 0,
    enhancementRecoveryPackage: 0,
    healthMastery: 0,
    extraDefenseMastery: 0,
    assistSubstatArmorLab: 0,
    assistSubstatGeneratorLab: 0,
    assistBonusArmorLab: 0,
    dissonantEchoDefense: 0,
  }

  it('leaves a module below 160 out, and says why', () => {
    const plan = planEffectiveHealthPath({
      config: withModules, levels: at(159, 100), variant: 'coin', steps: 5,
    })
    const reason = plan.excluded.find(entry => entry.sheetName === 'Primary Module - Armor')?.reason
    expect(reason).toMatch(/below level 160/)
  })

  it("charges the sheet's own module table", () => {
    const plan = planEffectiveHealthPath({
      config: withModules,
      levels: at(160, 160),
      variant: 'coin',
      steps: 4,
      maxLevels: MODULES_ONLY,
    })
    const first = plan.steps.find(step => step.name === 'Primary Module - Armor')
    // INDEX(Data_Val_Tables!$EV$4:$EV, 160) on the live sheet.
    expect(first?.level).toBe(161)
    expect(first?.cost).toBe(10_000_000_000_000)
  })

  it('takes the module discount off that price', () => {
    const plan = planEffectiveHealthPath({
      config: withModules,
      levels: at(160, 160),
      variant: 'coin',
      steps: 4,
      moduleDiscountPercent: 25,
      maxLevels: MODULES_ONLY,
    })
    const first = plan.steps.find(step => step.name === 'Primary Module - Armor')
    expect(first?.cost).toBe(10_000_000_000_000 * 0.75)
  })

  it('is worth more the rarer the module, because the bonus is recomputed', () => {
    const armorAt = (rarity: string) => computeEffectiveHealth(
      { ...withModules, armor: { ...withModules.armor, primaryRarity: rarity } },
      at(200, 160),
    ).armor
    expect(armorAt('Ancestral 5')).toBeGreaterThan(armorAt('Mythic'))
  })

  it('recomputes the bonus as the level moves, rather than holding it fixed', () => {
    const armorAt = (level: number) =>
      computeEffectiveHealth(withModules, at(level, 160)).armor
    expect(armorAt(200)).toBeGreaterThan(armorAt(160))
  })
})
