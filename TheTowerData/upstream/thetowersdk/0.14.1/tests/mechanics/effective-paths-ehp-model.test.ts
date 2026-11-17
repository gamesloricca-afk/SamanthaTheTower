import { describe, expect, it } from 'vitest'
import historical from '../../fixtures/mechanics/effective-paths-ehp-model.fixtures.json'
import fixtures from '../../fixtures/mechanics/effective-paths-ehp-model-v5.11.08.10.fixtures.json'
import { chainThunderReduction, chronoFieldReduction, computeEffectiveHealth, dissonantBoost, effectiveHealthPerks, tradeOffReduction, ZERO_EFFECTIVE_HEALTH_LEVELS } from '../../src/mechanics/effective-paths/ehp-model'
import { type EffectiveHealthConfig, type EffectiveHealthLevels } from '../../src/mechanics/effective-paths/types'

/**
 * The whole eHP model against the sheet's own composition.
 *
 * The forty historical synthetic inputs are replayed through the current
 * workbook's exact EPH/EPG expressions in Google Sheets. Expected values are
 * captured independently of the SDK, with the full evaluated formulas retained.
 * So this compares against the sheet's arithmetic rather than
 * against our reading of it, across states where walls, recovery, perks,
 * Chrono Field, Chain Thunder, Death Wave, tournament overrides and card
 * mastery are independently on or off.
 */

type FixtureCase = (typeof fixtures.cases)[number]

function toConfig(c: FixtureCase['cfg']): EffectiveHealthConfig {
  return {
    health: {
      workshopValue: c.wsHealth,
      relicPct: c.relicHealth,
      vaultPct: c.vaultHealth,
    },
    defenseAbsolute: {
      workshopValue: c.wsDabs,
      relicPct: c.relicDabs,
      vaultPct: c.vaultDabs,
      primarySubstat: c.primSubDabs,
      assistSubstat: c.assSubDabs,
    },
    defensePercent: {
      workshopValue: c.wsDefPct,
      relicPct: c.relicDefPct,
      vaultPct: c.vaultDefPct,
      primarySubstat: c.primSubDefPct,
      assistSubstat: c.assSubDefPct,
    },
    wallHealth: {
      workshopValue: c.wsWall,
      primarySubstat: c.primSubWall,
      assistSubstat: c.assSubWall,
    },
    maxRecovery: {
      workshopValue: c.wsRcvr,
      vaultPct: c.vaultRcvr,
      primarySubstat: c.primSubRcvr,
      assistSubstat: c.assSubRcvr,
    },
    cards: {
      health: { has: c.hasHealthCard, value: c.healthCardValue, hasMastery: c.hasHealthMastery },
      defenseAbsolute: { has: c.hasDabsCard, value: c.dabsCardValue },
      defensePercent: { has: c.hasDefPctCard, value: c.defPctCardValue, hasMastery: c.hasDefPctMastery },
    },
    armor: {
      primaryBonus: c.armorPrimary,
      hasAssist: c.hasArmorAssist,
      assistBonus: c.armorAssist,
    },
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
 * The fixture predates two things: enhancement levels living with the levels
 * rather than the config, and assist capacity being split into a lab half and
 * a stone half. Its `assist*` levels are the sheet's lab columns and its
 * `*Cap`/`stoneSub*` config fields are the stone side, so both are lifted onto
 * the levels here. They are summed inside every stat, so the split is a naming
 * question rather than a numeric one.
 */
function toLevels(testCase: { levels: unknown, cfg: Record<string, number> }): EffectiveHealthLevels {
  const levels = testCase.levels as EffectiveHealthLevels
  return {
    ...levels,
    enhancementHealth: testCase.cfg.wseHealth,
    enhancementDefenseAbsolute: testCase.cfg.wseDabs,
    enhancementWallHealth: testCase.cfg.wseWall,
    enhancementRecoveryPackage: testCase.cfg.wseRcvr,
    assistSubstatArmorLab: levels.assistSubstatArmor,
    assistSubstatGeneratorLab: levels.assistSubstatGenerator,
    assistBonusArmorLab: levels.assistBonusArmor,
    assistSubstatArmor: testCase.cfg.stoneSubArmor,
    assistSubstatGenerator: testCase.cfg.stoneSubGenerator,
    assistBonusArmor: testCase.cfg.armorStoneBonusCap,
  }
}

describe('the eHP model against the sheet', () => {
  it('replays every historical input against the current workbook', () => {
    expect(fixtures.source.version).toBe('v5.11.08.10')
    expect(fixtures.source.driveVersion).toBe('82842')
    expect(fixtures.evaluation.engine).toBe('Google Sheets')
    expect(fixtures.cases.map(({ cfg, levels }) => ({ cfg, levels })))
      .toEqual(historical.cases.map(({ cfg, levels }) => ({ cfg, levels })))
    expect(fixtures.cases.every(testCase => testCase.formula.startsWith('=LAMBDA('))).toBe(true)
  })
  it('has states worth checking, not forty of the same one', () => {
    expect(fixtures.cases.length).toBe(40)
    const varied = (pick: (c: FixtureCase['cfg']) => boolean) =>
      new Set(fixtures.cases.map(testCase => pick(testCase.cfg))).size
    // Every toggle must appear both on and off somewhere in the set, or it is
    // not actually being tested.
    expect(varied(c => c.hasWall)).toBe(2)
    expect(varied(c => c.hasRecovery)).toBe(2)
    expect(varied(c => c.hasPerks)).toBe(2)
    expect(varied(c => c.chronoUnlocked)).toBe(2)
    expect(varied(c => c.hasChainThunder)).toBe(2)
    expect(varied(c => c.hasDeathWave)).toBe(2)
    expect(varied(c => c.hasArmorAssist)).toBe(2)
    expect(varied(c => c.cto)).toBe(2)
  })

  for (const [index, testCase] of fixtures.cases.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      const actual = computeEffectiveHealth(
        toConfig(testCase.cfg),
        toLevels(testCase),
      ).effectiveHealth

      const scale = Math.max(Math.abs(testCase.sheetValue), 1e-9)
      expect(
        Math.abs(actual - testCase.sheetValue) / scale,
        `state ${index}: sheet=${testCase.sheetValue} model=${actual}`,
      ).toBeLessThan(1e-9)
    })
  }
})

describe('the pieces the composition is built from', () => {
  it('leaves Chrono Field inert until the unlock lab is taken', () => {
    // The 10% base only exists once unlocked — levels alone do nothing.
    expect(chronoFieldReduction(false, 30)).toBe(0)
    expect(chronoFieldReduction(true, 0)).toBeCloseTo(0.1, 12)
    expect(chronoFieldReduction(true, 30)).toBeCloseTo(0.25, 12)
  })

  it('caps Chain Thunder by the damage it is actually responsible for', () => {
    // 3% a level, but never more than the share of damage it does allows.
    // 100% of your damage being Chain Lightning would be 166% reduction, so
    // the lab caps it: 3 points a level, and never past 90%.
    expect(chainThunderReduction(true, 30, 1)).toBeCloseTo(0.9, 12)
    // The lab's own wording — 10% off for every 6% of health lost to it.
    expect(chainThunderReduction(true, 30, 0.06)).toBeCloseTo(0.1, 12)
    expect(chainThunderReduction(true, 30, 0.3)).toBeCloseTo(0.5, 12)
    // Level 19 is the 57% the game's description quotes.
    expect(chainThunderReduction(true, 19, 1)).toBeCloseTo(0.57, 12)
    // A share handed in out of range cannot invert `1 / (1 - reduction)`.
    expect(chainThunderReduction(true, 30, 42)).toBeCloseTo(0.9, 12)
    expect(chainThunderReduction(true, 30, -1)).toBe(0)
    expect(chainThunderReduction(true, 30, 0.01)).toBeCloseTo(0.016666666666666666, 12)
    expect(chainThunderReduction(false, 30, 1)).toBe(0)
  })

  it('gives the trade-off perk nothing when perks are off', () => {
    expect(tradeOffReduction(false, true, 10)).toBe(0)
    expect(tradeOffReduction(true, false, 10)).toBe(0)
    expect(tradeOffReduction(true, true, 0)).toBeCloseTo(0.5, 12)
    expect(tradeOffReduction(true, true, 10)).toBeCloseTo(0.55, 12)
  })

  it('counts the played tier in full and other tiers only through the echo', () => {
    const tiers = [5000, 5000, 5000]
    // With no echo levels, the other tiers still contribute at 0.5%.
    const withoutEcho = dissonantBoost(5000, tiers, 0)
    const withEcho = dissonantBoost(5000, tiers, 10)
    expect(withEcho).toBeGreaterThan(withoutEcho)

    // A single tier at its cap: others contribute nothing.
    expect(dissonantBoost(5000, [5000], 0)).toBeCloseTo(5, 12)
    // Past the cap changes nothing — the wave term saturates at 5000.
    expect(dissonantBoost(9999, [9999], 0)).toBeCloseTo(5, 12)
  })
})

describe('what the model does with an empty account', () => {
  const emptyConfig: EffectiveHealthConfig = {
    health: { workshopValue: 5 },
    defenseAbsolute: { workshopValue: 0 },
    defensePercent: { workshopValue: 0 },
    wallHealth: { workshopValue: 0 },
    maxRecovery: { workshopValue: 0 },
    cards: {
      health: { has: false, value: 1 },
      defenseAbsolute: { has: false, value: 1 },
      defensePercent: { has: false, value: 0 },
    },
    armor: { primaryBonus: 1.012, hasAssist: false, assistBonus: 1 },
    wall: { has: false, primaryEffect: 0, assistEffect: 0 },
    recovery: { has: false },
    perks: effectiveHealthPerks({
      apply: true,
      health: true,
      healthRegen: true,
      extraDefense: true,
      absoluteDefense: true,
      enemyDamageTradeOff: true,
      // A fresh account in the sheet has both health trade-off perks taken.
      coinTradeOff: true,
      regenTradeOff: true,
    }),
    chronoField: { unlocked: false },
    chainThunder: { has: false, damageShare: 0 },
    deathWave: { hasHealth: false },
    enemiesAttackingTogether: 1,
    dissonance: { active: false, tierPersonalBest: 0, allTierPersonalBests: [] },
  }

  it('reproduces the starting eHP the sheet shows a fresh account', () => {
    const result = computeEffectiveHealth(emptyConfig, ZERO_EFFECTIVE_HEALTH_LEVELS)
    // The same 3.036 the eHP grid opens on, from the path fixture.
    expect(result.effectiveHealth).toBeCloseTo(3.0360000000000005, 9)
    expect(result.wallHealth).toBeNull()
    expect(result.maxRecovery).toBeNull()
    expect(result.dissonance).toBe(1)
  })

  it('reports a breakdown, so a path can say what actually moved', () => {
    const result = computeEffectiveHealth(emptyConfig, {
      ...ZERO_EFFECTIVE_HEALTH_LEVELS, health: 10,
    })
    expect(result.health).toBeGreaterThan(0)
    expect(result.armor).toBeCloseTo(1.012, 12)
    expect(result.defenseAbsolute).toBe(0)
  })
})
