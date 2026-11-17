import { describe, expect, it } from 'vitest'
import modelFixtures from '../../fixtures/mechanics/effective-paths-ehp-model.fixtures.json'
import roiFixtures from '../../fixtures/mechanics/effective-paths-stone-roi-v5.11.08.10.fixtures.json'
import {
  ASSIST_BONUS_MAX_LEVEL,
  ASSIST_SUBSTAT_MAX_LEVEL,
  assistUpgradeStoneCost,
  cumulativeAssistStoneCost,
} from '../../src/mechanics/effective-paths/stone-costs'
import { computeEffectiveHealth, effectiveHealthPerks, ZERO_EFFECTIVE_HEALTH_LEVELS } from '../../src/mechanics/effective-paths/ehp-model'
import { type EffectiveHealthConfig, type EffectiveHealthLevels } from '../../src/mechanics/effective-paths/types'
import { EFFECTIVE_HEALTH_UPGRADES, planEffectiveHealthPath } from '../../src/mechanics/effective-paths/ehp-plan'

type ModelCase = (typeof modelFixtures.cases)[number]

/** Same mapping the model test uses; the two fixtures share their states. */
function toConfig(c: ModelCase['cfg']): EffectiveHealthConfig {
  return {
    health: { workshopValue: c.wsHealth, relicPct: c.relicHealth, vaultPct: c.vaultHealth },
    defenseAbsolute: {
      workshopValue: c.wsDabs, relicPct: c.relicDabs, vaultPct: c.vaultDabs,
      primarySubstat: c.primSubDabs, assistSubstat: c.assSubDabs,
    },
    defensePercent: {
      workshopValue: c.wsDefPct, relicPct: c.relicDefPct, vaultPct: c.vaultDefPct,
      primarySubstat: c.primSubDefPct, assistSubstat: c.assSubDefPct,
    },
    wallHealth: {
      workshopValue: c.wsWall,
      primarySubstat: c.primSubWall, assistSubstat: c.assSubWall,
    },
    maxRecovery: {
      workshopValue: c.wsRcvr, vaultPct: c.vaultRcvr,
      primarySubstat: c.primSubRcvr, assistSubstat: c.assSubRcvr,
    },
    cards: {
      health: { has: c.hasHealthCard, value: c.healthCardValue, hasMastery: c.hasHealthMastery },
      defenseAbsolute: { has: c.hasDabsCard, value: c.dabsCardValue },
      defensePercent: { has: c.hasDefPctCard, value: c.defPctCardValue, hasMastery: c.hasDefPctMastery },
    },
    armor: {
      primaryBonus: c.armorPrimary, hasAssist: c.hasArmorAssist,
      assistBonus: c.armorAssist, labBonusCap: c.armorStoneBonusCap,
    },
    labSubstatCap: { armor: c.stoneSubArmor, generator: c.stoneSubGenerator },
    wall: { has: c.hasWall, primaryEffect: c.wallPrimEffect, assistEffect: c.wallAssEffect },
    recovery: { has: c.hasRecovery },
    perks: effectiveHealthPerks({
      apply: true,
      health: c.hasPerks,
      healthRegen: c.hasPerks,
      extraDefense: c.hasPerks,
      absoluteDefense: c.hasPerks,
      enemyDamageTradeOff: c.hasPerks && c.hasTradeOff,
      coinTradeOff: c.cto,
      regenTradeOff: c.rto,
    }),
    chronoField: { unlocked: c.chronoUnlocked },
    chainThunder: { has: c.hasChainThunder, damageShare: c.chainDamageShare },
    deathWave: { hasHealth: c.hasDeathWave },
    enemiesAttackingTogether: c.enemiesAttackingTogether,
    dissonance: { active: false, tierPersonalBest: 0, allTierPersonalBests: [] },
  }
}

/**
 * The fixture predates enhancement levels living with the levels rather than
 * the config, so lift them across.
 */
function toLevels(testCase: { levels: unknown, cfg: Record<string, number> }): EffectiveHealthLevels {
  const levels = testCase.levels as EffectiveHealthLevels
  return {
    /*
     * The zero record first, because "predates" turned out to cover more than
     * the enhancements below: the fixture has no module armor levels either,
     * and lifting only the fields someone remembered left two of them
     * `undefined`. Starting from the canonical defaults means a level added to
     * the model arrives here at zero rather than as a hole.
     */
    ...ZERO_EFFECTIVE_HEALTH_LEVELS,
    ...levels,
    enhancementHealth: testCase.cfg.wseHealth,
    enhancementDefenseAbsolute: testCase.cfg.wseDabs,
    enhancementWallHealth: testCase.cfg.wseWall,
    enhancementRecoveryPackage: testCase.cfg.wseRcvr,
    // The fixture's assist levels are the sheet's lab columns; its config
    // fields are the stone side.
    assistSubstatArmorLab: levels.assistSubstatArmor,
    assistSubstatGeneratorLab: levels.assistSubstatGenerator,
    assistBonusArmorLab: levels.assistBonusArmor,
    assistSubstatArmor: testCase.cfg.stoneSubArmor,
    assistSubstatGenerator: testCase.cfg.stoneSubGenerator,
    assistBonusArmor: testCase.cfg.armorStoneBonusCap,
  }
}

describe('stone costs', () => {
  it('charges what the sheet charges — three more stones a level', () => {
    // The sheet writes it inline: COST = 12 + (level + 1) * 3
    expect(assistUpgradeStoneCost(1)).toBe(15)
    expect(assistUpgradeStoneCost(2)).toBe(18)
    expect(assistUpgradeStoneCost(69)).toBe(219)
  })

  it('refuses a level that cannot be bought', () => {
    expect(assistUpgradeStoneCost(0)).toBeNull()
    expect(assistUpgradeStoneCost(-1)).toBeNull()
    expect(assistUpgradeStoneCost(1.5)).toBeNull()
  })

  it('adds up a run of levels', () => {
    expect(cumulativeAssistStoneCost(0, 0)).toBe(0)
    expect(cumulativeAssistStoneCost(0, 3)).toBe(15 + 18 + 21)
    expect(cumulativeAssistStoneCost(2, 4)).toBe(21 + 24)
    expect(cumulativeAssistStoneCost(5, 4)).toBeNull()
  })

  it('caps substats at 69 and bonus at 99, as the sheet does', () => {
    expect(ASSIST_SUBSTAT_MAX_LEVEL).toBe(69)
    expect(ASSIST_BONUS_MAX_LEVEL).toBe(99)
  })
})

describe('stone-path ROI against the sheet', () => {
  it('matches the sheet on every captured candidate', () => {
    const mismatches: string[] = []
    let tightest = 0

    for (const testCase of roiFixtures.cases) {
      const state = modelFixtures.cases[testCase.index]
      const config = toConfig(state.cfg)
      const levels = toLevels(state)
      const key = testCase.levelKey as keyof EffectiveHealthLevels

      const now = computeEffectiveHealth(config, levels).effectiveHealth
      const next = computeEffectiveHealth(
        config, { ...levels, [key]: levels[key] + 1 },
      ).effectiveHealth
      const cost = assistUpgradeStoneCost(testCase.level + 1) as number

      // The sheet reports relative gain over cost.
      const relativeGain = next / now - 1
      const mine = relativeGain / cost
      const relative = Math.abs(mine - testCase.sheetRoi) / Math.max(Math.abs(testCase.sheetRoi), 1e-15)

      /*
       * `next / now - 1` subtracts two nearly-equal numbers, so its precision
       * depends on how big the gain is. Doubles leave roughly 1e-16 of relative
       * error in each eHP, and the subtraction amplifies that by 1/gain — a
       * generator substat worth 3e-7 of a player's eHP therefore cannot be
       * compared to better than about 3e-9, no matter how correct both sides
       * are. Scale the tolerance by that amplification rather than loosening it
       * across the board, so the tiny cases stay as tight as arithmetic allows
       * and the ordinary ones stay at 1e-9.
       */
      const tolerance = Math.max(1e-9, 1e-15 / Math.max(Math.abs(relativeGain), 1e-12))
      if (relative > tolerance) {
        mismatches.push(
          `state ${testCase.index} ${testCase.candidate}: `
          + `sheet=${testCase.sheetRoi} model=${mine} rel=${relative.toExponential(2)}`,
        )
      }
      if (Math.abs(relativeGain) > 1e-4) tightest = Math.max(tightest, relative)
    }

    expect(mismatches).toEqual([])
    expect(roiFixtures.cases.length).toBe(42)
    // Where cancellation is not a factor the agreement is two orders inside the
    // 1e-9 floor, which is what says the scaling above is not hiding a real
    // error. Observed worst case is ~1.5e-12.
    expect(tightest).toBeLessThan(1e-11)
  })

  it('covers all three stone candidates', () => {
    const candidates = new Set(roiFixtures.cases.map(c => c.candidate))
    expect([...candidates].sort()).toEqual(['armorBonus', 'armorSubstat', 'generatorSubstat'])
  })
})

describe('planning a stone path', () => {
  const state = modelFixtures.cases[0]
  const config = toConfig(state.cfg)

  it('buys only the three stone upgrades, and says why the rest are out', () => {
    const plan = planEffectiveHealthPath({
      config,
      levels: toLevels(state),
      variant: 'stone',
      steps: 30,
    })

    const chosen = new Set(plan.steps.map(step => step.name))
    for (const name of chosen) expect(name).toMatch(/^Assist Module/)

    const excluded = plan.excluded.map(entry => entry.sheetName)
    expect(excluded).toContain('Health')
    expect(excluded).toContain('Wall Health')
    // Every upgrade is accounted for: bought or explained.
    expect(plan.excluded.length + 3).toBe(EFFECTIVE_HEALTH_UPGRADES.length)
  })

  it('charges the stone price, not a lab price', () => {
    const plan = planEffectiveHealthPath({
      config,
      levels: toLevels(state),
      variant: 'stone',
      steps: 10,
    })
    for (const step of plan.steps) {
      expect(step.cost).toBe(assistUpgradeStoneCost(step.level))
    }
  })

  it('stops each upgrade at its own cap', () => {
    const nearlyDone: EffectiveHealthLevels = {
      ...toLevels(state),
      assistSubstatArmor: 68,
      assistSubstatGenerator: 68,
      assistBonusArmor: 98,
    }
    const plan = planEffectiveHealthPath({
      config, levels: nearlyDone, variant: 'stone', steps: 20,
    })

    // One level left in each: three steps and no more.
    expect(plan.steps).toHaveLength(3)
    const byName = Object.fromEntries(plan.steps.map(step => [step.name, step.level]))
    expect(byName['Assist Module Substats - Armor']).toBe(69)
    expect(byName['Assist Module Substats - Generator']).toBe(69)
    expect(byName['Assist Module Bonus - Armor']).toBe(99)
  })
})
