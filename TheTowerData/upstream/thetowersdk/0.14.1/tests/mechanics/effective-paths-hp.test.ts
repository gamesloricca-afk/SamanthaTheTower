import { describe, expect, it } from 'vitest'
import fixtures from '../../fixtures/mechanics/effective-paths-parity.fixtures.json'
import oracleFixtures from '../../fixtures/mechanics/effective-paths-oracle.fixtures.json'
import {
  composeEffectiveHealth,
  DEFENSE_PERCENT_CAP,
  effectiveArmor,
  effectiveDefenseAbsolute,
  effectiveDefensePercent,
  effectiveHealth,
  effectiveMaxRecovery,
  effectiveRegen,
  effectiveWallHealth,
  effectiveWallRegen,
  survivalMultiplier,
} from '../../src/mechanics/effective-paths/hp'

/**
 * The fixtures record each sheet call site positionally, in the order the
 * original LAMBDA declares its parameters. These adapters are the one place
 * that order is written down, so a mismatch shows up here rather than as a
 * silently wrong number.
 */
type Args = readonly (number | boolean)[]

const num = (args: Args, i: number): number => {
  const value = args[i]
  return typeof value === 'boolean' ? (value ? 1 : 0) : value
}
const bool = (args: Args, i: number): boolean => Boolean(args[i])

const ADAPTERS: Record<string, (args: Args) => number> = {
  // LAMBDA(ws_val, lab_lvl, has_card, card_val, has_mastery, mastery_lvl, wse_lvl,
  //        has_perk, spb_lvl, has_cto, has_rto, relic_pct, vault_pct, has_dwhp, dwhp_lvl, disco)
  EPH_HEALTH: a => effectiveHealth({
    workshopValue: num(a, 0),
    labLevel: num(a, 1),
    hasHealthCard: bool(a, 2),
    cardValue: num(a, 3),
    hasCardMastery: bool(a, 4),
    masteryLevel: num(a, 5),
    workshopEnhancementLevel: num(a, 6),
    hasPerk: bool(a, 7),
    perkBonusLabLevel: num(a, 8),
    hasCoinTradeOffPerk: bool(a, 9),
    hasRegenTradeOffPerk: bool(a, 10),
    relicPct: num(a, 11),
    vaultPct: num(a, 12),
    hasDeathWaveHealth: bool(a, 13),
    deathWaveHealthLevel: num(a, 14),
    dissonance: num(a, 15),
  }),

  // LAMBDA(ws_val, lab_lvl, has_card, card_val, has_mastery, mastery_lvl, stone_sac, lab_sac,
  //        prim_sub, ass_sub, wse_lvl, has_perk, spb_lvl, has_rgnto, has_rto, ito_lvl,
  //        relic_pct, vault_pct, has_swm, swm_lvl)
  EPH_REGEN: a => effectiveRegen({
    workshopValue: num(a, 0),
    labLevel: num(a, 1),
    hasRegenCard: bool(a, 2),
    cardValue: num(a, 3),
    hasCardMastery: bool(a, 4),
    masteryLevel: num(a, 5),
    labSubstatCap: num(a, 6),
    stoneSubstatCap: num(a, 7),
    primarySubstat: num(a, 8),
    assistSubstat: num(a, 9),
    workshopEnhancementLevel: num(a, 10),
    hasPerk: bool(a, 11),
    perkBonusLabLevel: num(a, 12),
    hasEnemyHealthTradeOffPerk: bool(a, 13),
    hasRegenTradeOffPerk: bool(a, 14),
    improveTradeOffPerksLabLevel: num(a, 15),
    relicPct: num(a, 16),
    vaultPct: num(a, 17),
    hasSecondWindMastery: bool(a, 18),
    secondWindMasteryLevel: num(a, 19),
  }),

  // LAMBDA(ws_val, lab_lvl, has_card, card_val, stone_sac, lab_sac, prim_sub, ass_sub,
  //        wse_lvl, has_perk, spb_lvl, relic_pct, vault_pct)
  EPH_DABS: a => effectiveDefenseAbsolute({
    workshopValue: num(a, 0),
    labLevel: num(a, 1),
    hasDefenseAbsoluteCard: bool(a, 2),
    cardValue: num(a, 3),
    labSubstatCap: num(a, 4),
    stoneSubstatCap: num(a, 5),
    primarySubstat: num(a, 6),
    assistSubstat: num(a, 7),
    workshopEnhancementLevel: num(a, 8),
    hasPerk: bool(a, 9),
    perkBonusLabLevel: num(a, 10),
    relicPct: num(a, 11),
    vaultPct: num(a, 12),
  }),

  // LAMBDA(ws_val, lab_lvl, has_card, card_val, has_mastery, mastery_lvl, stone_sac, lab_sac,
  //        prim_sub, ass_sub, has_perk, spb_lvl, relic_pct, vault_pct)
  EPH_DEF_PCT: a => effectiveDefensePercent({
    workshopValue: num(a, 0),
    labLevel: num(a, 1),
    hasDefensePercentCard: bool(a, 2),
    cardValue: num(a, 3),
    hasCardMastery: bool(a, 4),
    masteryLevel: num(a, 5),
    labSubstatCap: num(a, 6),
    stoneSubstatCap: num(a, 7),
    primarySubstat: num(a, 8),
    assistSubstat: num(a, 9),
    hasPerk: bool(a, 10),
    perkBonusLabLevel: num(a, 11),
    relicPct: num(a, 12),
    vaultPct: num(a, 13),
  }),

  // LAMBDA(prim_bonus, has_ass, ass_bonus, stone_bac, lab_bac)
  EPH_ARMOR: a => effectiveArmor({
    primaryBonus: num(a, 0),
    hasAssist: bool(a, 1),
    assistBonus: num(a, 2),
    labBonusCap: num(a, 3),
    stoneBonusCap: num(a, 4),
  }),

  // LAMBDA(ws_val, lab_lvl, stone_sac, lab_sac, prim_sub, ass_sub, wse_lvl,
  //        prim_effect, ass_effect, fort_lvl)
  EPH_WALL_HEALTH: a => effectiveWallHealth({
    workshopValue: num(a, 0),
    labLevel: num(a, 1),
    labSubstatCap: num(a, 2),
    stoneSubstatCap: num(a, 3),
    primarySubstat: num(a, 4),
    assistSubstat: num(a, 5),
    workshopEnhancementLevel: num(a, 6),
    primaryEffect: num(a, 7),
    assistEffect: num(a, 8),
    fortressLevel: num(a, 9),
  }),

  // LAMBDA(lab_lvl, prim_effect, ass_effect)
  EPH_WALL_REGEN: a => effectiveWallRegen({
    labLevel: num(a, 0),
    primaryEffect: num(a, 1),
    assistEffect: num(a, 2),
  }),

  // LAMBDA(ws_val, lab_lvl, stone_sac, lab_sac, prim_sub, ass_sub, wse_lvl, vault_pct)
  EPH_MAX_RCVR: a => effectiveMaxRecovery({
    workshopValue: num(a, 0),
    labLevel: num(a, 1),
    labSubstatCap: num(a, 2),
    stoneSubstatCap: num(a, 3),
    primarySubstat: num(a, 4),
    assistSubstat: num(a, 5),
    workshopEnhancementLevel: num(a, 6),
    vaultPct: num(a, 7),
  }),
}

describe('effective paths eHP parity with the spreadsheet', () => {
  it('has fixtures to check', () => {
    expect(fixtures.cases.length).toBeGreaterThan(0)
  })

  for (const testCase of fixtures.cases) {
    const adapter = ADAPTERS[testCase.fn]
    it(`${testCase.fn} matches ${testCase.cell}`, () => {
      expect(adapter, `no adapter for ${testCase.fn}`).toBeDefined()
      const actual = adapter(testCase.args as Args)
      // The sheet's cached values are rounded for display in some columns, so
      // compare to a relative tolerance rather than exact equality.
      expect(actual).toBeCloseTo(testCase.expected, 6)
    })
  }
})

/**
 * The exported workbook only cached the input state it was saved in — an empty
 * template — which yields barely a handful of distinct vectors. These cases were
 * asked of the live sheet through the oracle MCP, so they cover combinations the
 * snapshot could never reach.
 */
describe('effective paths eHP parity with the live sheet', () => {
  for (const testCase of oracleFixtures.cases) {
    const adapter = ADAPTERS[testCase.fn]
    it(`${testCase.fn}: ${testCase.why}`, () => {
      expect(adapter, `no adapter for ${testCase.fn}`).toBeDefined()
      const actual = adapter(testCase.args as Args)
      // The sheet answers in IEEE doubles, so compare relatively rather than
      // demanding the same accumulated floating-point error.
      expect(actual).toBeCloseTo(testCase.expected, 6)
      expect(Math.abs(actual - testCase.expected) / Math.abs(testCase.expected || 1))
        .toBeLessThan(1e-12)
    })
  }
})

describe('composeEffectiveHealth', () => {
  it('reproduces the sheet\'s eHP cell', () => {
    // eHP!CJ5:CS5 on the live sheet — health 1.2, armor 1.012, no defense
    // absolute, defense % worth 1.25x, no wall or recovery, trade-off worth 2x.
    expect(composeEffectiveHealth({
      health: 1.2000000000000002,
      armor: 1.012,
      defenseAbsolute: 0,
      defensePercent: 0.2,
      wallHealth: null,
      maxRecovery: null,
      chronoFieldReduction: 0,
      chainThunderReduction: 0,
      tradeOffReduction: 0.5,
    })).toBeCloseTo(3.0360000000000005, 12)
  })

  it('adds defense absolute to the pool instead of scaling it', () => {
    const withoutFlat = composeEffectiveHealth({
      health: 100, armor: 1, defenseAbsolute: 0, defensePercent: 0.5,
    })
    const withFlat = composeEffectiveHealth({
      health: 100, armor: 1, defenseAbsolute: 10, defensePercent: 0.5,
    })
    // The flat 10 is added before the 2x survival multiplier, not after.
    expect(withoutFlat).toBeCloseTo(200, 9)
    expect(withFlat).toBeCloseTo(220, 9)
  })

  it('adds wall and recovery together, and drops the term when neither applies', () => {
    const base = { health: 100, armor: 1, defenseAbsolute: 0, defensePercent: 0 }
    expect(composeEffectiveHealth(base)).toBeCloseTo(100, 9)
    expect(composeEffectiveHealth({ ...base, wallHealth: 3 })).toBeCloseTo(300, 9)
    expect(composeEffectiveHealth({ ...base, wallHealth: 3, maxRecovery: 2 }))
      .toBeCloseTo(500, 9)
  })

  it('turns a reduction into the health it is worth', () => {
    expect(survivalMultiplier(0)).toBe(1)
    expect(survivalMultiplier(0.5)).toBe(2)
    expect(survivalMultiplier(0.98)).toBeCloseTo(50, 9)
    expect(survivalMultiplier(1)).toBe(Infinity)
  })
})

/**
 * The snapshot fixtures come from the public template, where most inputs are
 * blank. These cases cover the branches that a blank sheet never reaches.
 */
describe('effective paths eHP branches the template does not exercise', () => {
  it('stacks health multipliers independently', () => {
    const base = {
      workshopValue: 100,
      labLevel: 0,
      hasHealthCard: false,
      cardValue: 1,
      hasCardMastery: false,
      masteryLevel: 0,
      workshopEnhancementLevel: 0,
      hasPerk: false,
      perkBonusLabLevel: 0,
      hasCoinTradeOffPerk: false,
      hasRegenTradeOffPerk: false,
      relicPct: 0,
      vaultPct: 0,
      hasDeathWaveHealth: false,
      deathWaveHealthLevel: 0,
      dissonance: 1,
    }
    expect(effectiveHealth(base)).toBe(100)
    // Lab adds 3% a level.
    expect(effectiveHealth({ ...base, labLevel: 10 })).toBeCloseTo(130, 9)
    // Card mastery scales the card, not the base.
    expect(effectiveHealth({ ...base, hasHealthCard: true, cardValue: 2 })).toBeCloseTo(200, 9)
    expect(effectiveHealth({
      ...base, hasHealthCard: true, cardValue: 2, hasCardMastery: true, masteryLevel: 0,
    })).toBeCloseTo(2 * (1 + 0.2) * 100, 9)
    // Death Wave health starts at 500%, not 0.
    expect(effectiveHealth({ ...base, hasDeathWaveHealth: true, deathWaveHealthLevel: 0 }))
      .toBeCloseTo(500, 9)
  })

  it('caps defense percent at 98%', () => {
    const capped = effectiveDefensePercent({
      workshopValue: 0.9,
      labLevel: 100,
      hasDefensePercentCard: true,
      cardValue: 0.5,
      hasCardMastery: false,
      masteryLevel: 0,
      labSubstatCap: 0,
      stoneSubstatCap: 0,
      primarySubstat: 0,
      assistSubstat: 0,
      hasPerk: false,
      perkBonusLabLevel: 0,
      relicPct: 0,
      vaultPct: 0,
    })
    expect(capped).toBe(DEFENSE_PERCENT_CAP)
  })

  it('scales an assist substat by its capacity, and ignores it without an assist', () => {
    const withAssist = effectiveMaxRecovery({
      workshopValue: 1,
      labLevel: 0,
      labSubstatCap: 50,
      stoneSubstatCap: 50,
      primarySubstat: 0,
      assistSubstat: 2,
      workshopEnhancementLevel: 0,
      vaultPct: 0,
    })
    // capacity = (1 + 50 + 50) * 0.01 = 1.01, so the assist contributes 2 * 1.01
    expect(withAssist).toBeCloseTo(1 + 2 * 1.01, 9)

    expect(effectiveArmor({
      primaryBonus: 1.5, hasAssist: false, assistBonus: 99, labBonusCap: 99, stoneBonusCap: 99,
    })).toBe(1.5)
  })

  it('falls back to a factor of 1 when no module supplies a wall effect', () => {
    const noModule = effectiveWallRegen({ labLevel: 10, primaryEffect: 0, assistEffect: 0 })
    expect(noModule).toBeCloseTo(1, 9)
    const withModule = effectiveWallRegen({ labLevel: 10, primaryEffect: 2, assistEffect: 0 })
    expect(withModule).toBeCloseTo(2, 9)
  })
})

describe('perk quantity', () => {
  const base = {
    workshopValue: 100,
    labLevel: 0,
    hasHealthCard: false,
    cardValue: 1,
    hasCardMastery: false,
    masteryLevel: 0,
    workshopEnhancementLevel: 0,
    hasPerk: true,
    perkBonusLabLevel: 0,
    hasCoinTradeOffPerk: false,
    hasRegenTradeOffPerk: false,
    relicPct: 0,
    vaultPct: 0,
    hasDeathWaveHealth: false,
    deathWaveHealthLevel: 0,
    dissonance: 1,
  }

  it('defaults to the five the sheet assumes', () => {
    // (1 + 0.2 * 5) = 2
    expect(effectiveHealth(base)).toBeCloseTo(200, 9)
    expect(effectiveHealth({ ...base, perkQuantity: 5 })).toBeCloseTo(200, 9)
  })

  it('scales with how many of the perk the run took', () => {
    expect(effectiveHealth({ ...base, perkQuantity: 1 })).toBeCloseTo(120, 9)
    expect(effectiveHealth({ ...base, perkQuantity: 0 })).toBeCloseTo(100, 9)
    expect(effectiveHealth({ ...base, perkQuantity: 10 })).toBeCloseTo(300, 9)
  })

  it('is inert when the perk is not taken', () => {
    expect(effectiveHealth({ ...base, hasPerk: false, perkQuantity: 10 })).toBeCloseTo(100, 9)
  })

  it('still takes the Standard Perks Bonus lab on top', () => {
    // (1 + 0.2 * 3) * (1 + 0.01 * 20) = 1.6 * 1.2
    expect(effectiveHealth({ ...base, perkQuantity: 3, perkBonusLabLevel: 20 }))
      .toBeCloseTo(192, 9)
  })
})
