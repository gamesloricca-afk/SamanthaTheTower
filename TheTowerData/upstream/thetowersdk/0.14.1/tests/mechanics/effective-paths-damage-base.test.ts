import { describe, expect, it } from 'vitest'
import {
  ampStrike,
  damageBase,
  demonModeMastery,
  projectFundingMultiplier,
  projectFundingCash,
  shockMultiplier,
  towerDamage,
  tradeOffDamagePerk,
} from '../../src/mechanics/effective-paths/damage-base'
import fixtures from '../../fixtures/mechanics/effective-paths-damage-base.fixtures.json'
import path from '../../fixtures/mechanics/effective-paths-edamage-path.fixtures.json'

/**
 * The `Base` half of the eDamage composition.
 *
 * These are cell formulas rather than named LAMBDAs, so the fixtures hold the
 * sheet's own formula text with its cell references swapped for literals — the
 * structure under test is the spreadsheet's, and only the substitution is ours.
 *
 * The composition itself is checked a different and stronger way: against the
 * factor values captured off row 5 of the real grid.
 */

const close = (ours: number, sheet: number, digits = 12) =>
  expect(Math.abs(ours / sheet - 1)).toBeLessThan(10 ** -digits)

describe('tower damage', () => {
  for (const [index, c] of fixtures.towerDamage.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(towerDamage({
        baseDamage: c.base,
        labLevel: c.lab,
        enhancementMultiplier: c.wsPlus,
        hasDamageCard: c.hasCards && c.inPreset,
        cardValue: c.cardValue,
        hasCardMastery: c.hasMastery,
        masteryLevel: c.masteryLevel,
        dissonance: c.disco,
      }), c.sheet)
    })
  }
})

describe('the Shock multiplier', () => {
  for (const [index, c] of fixtures.shock.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(shockMultiplier({
        hasShock: c.gate, labLevel: c.lab, deathChainSubstat: c.dc,
      }), c.sheet)
    })
  }

  it('doubles the amplification when Death Chain is present, and scales it', () => {
    // The substat enters twice: once deciding Death Chain is there at all, and
    // again as the size of the doubling.
    const base = { hasShock: true, labLevel: 10 }
    expect(shockMultiplier({ ...base, deathChainSubstat: 0 })).toBeCloseTo(1.5, 12)
    expect(shockMultiplier({ ...base, deathChainSubstat: 1 })).toBeCloseTo(2, 12)
    expect(shockMultiplier({ ...base, deathChainSubstat: 2 })).toBeCloseTo(3, 12)
  })
})

describe('Project Funding', () => {
  for (const [index, c] of fixtures.projectFundingMultiplier.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(projectFundingMultiplier({ perDigitRate: c.pf, cash: c.cash }), c.sheet)
    })
  }

  it('is one without the substat, and never takes a log it would not use', () => {
    expect(projectFundingMultiplier({ perDigitRate: 0, cash: 0 })).toBe(1)
    // Formatted cash cells that the reader left as 0 must not NaN the base.
    expect(projectFundingMultiplier({ perDigitRate: 0.5, cash: 0 })).toBe(1)
    expect(projectFundingMultiplier({ perDigitRate: 0.5, cash: -1 })).toBe(1)
  })

  it('takes its cash from the run, on a Utility Dissonance', () => {
    // The path is buying Starting Cash there, so the level is the cash.
    expect(projectFundingCash('Util Disso', 12, 999)).toBe(80 + 5 * 12)
    expect(projectFundingCash('Regular', 12, 999)).toBe(999)
  })
})

describe('Amp Strike', () => {
  for (const [index, c] of fixtures.ampStrike.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(ampStrike({ share: c.share, substat: c.substat, divisor: c.divisor }), c.sheet)
    })
  }

  it('caps the share before the multiplier, so it never passes five', () => {
    expect(ampStrike({ share: 1, substat: 1e6, divisor: 1 })).toBe(5)
  })
})

describe('the two perk terms', () => {
  for (const [index, c] of fixtures.tradeOffPerk.entries()) {
    it(`matches the trade-off perk on state ${index}`, () => {
      close(tradeOffDamagePerk(c.has, c.lab), c.sheet)
    })
  }
  for (const [index, c] of fixtures.demonMode.entries()) {
    it(`matches Demon Mode on state ${index}`, () => {
      close(demonModeMastery(c.has, c.lab), c.sheet)
    })
  }
})

describe('the Base composition', () => {
  const factors = path.factors

  it('reproduces DI5 from the grid’s own factors', () => {
    const ours = damageBase({
      runType: 'Regular',
      towerDamage: factors.damage.value as number,
      damagePerk: factors.standardPerksBonus.value as number,
      tradeOffPerk: factors.tradeOffPerks.value as number,
      shock: factors.shock.value as number,
      demonModeMastery: factors.damageMastery.value as number,
      cannonAssist: factors.cannon.value as number,
      shockwave: factors.acp.value as number,
      projectFundingMultiplier: factors.projectFundingMultiplier.value as number,
      ampStrike: factors.ampStrike.value as number,
    })
    close(ours, factors.base.value as number)
  })

  it('keeps only the shockwave and Amp Strike on an Attack Dissonance run', () => {
    const inputs = {
      towerDamage: 1000,
      damagePerk: 2,
      tradeOffPerk: 1.5,
      shock: 1.4,
      demonModeMastery: 3,
      cannonAssist: 1.2,
      shockwave: 1.3,
      projectFundingMultiplier: 1.6,
      ampStrike: 2.5,
    }
    expect(damageBase({ ...inputs, runType: 'Attack Disso' })).toBeCloseTo(1.3 * 2.5, 12)
    expect(damageBase({ ...inputs, runType: 'Regular' })).toBeGreaterThan(1000)
  })

  it('does not let Project Funding cancel out of the damage', () => {
    // The base arrives with the current Project Funding divided out and the
    // modelled one multiplied back in. They cancel only when the two agree —
    // which is the point, because Starting Cash moves the modelled one.
    const withFreeze = damageBase({
      runType: 'Regular',
      towerDamage: 100,
      damagePerk: 1,
      tradeOffPerk: 1,
      shock: 1,
      demonModeMastery: 1,
      cannonAssist: 1,
      shockwave: 1,
      projectFundingMultiplier: 2,
      ampStrike: 1,
    })
    expect(withFreeze).toBe(200)
  })
})

describe('the Base composition under each run type', () => {
  /*
   * `DI5` is
   *
   *   IF($AX$19 = "Attack Disso",
   *      Acp * AmpStrike,
   *      DMG * PerkDMG * TODMG * Shock * CardDMMastery * CannonAssist * Acp * PF * AmpStrike)
   *
   * so Attack Dissonance drops seven of the nine factors — the tower is not
   * firing, and only the shockwave and Amp Strike remain. The other four run
   * types take the full product.
   *
   * Two of these six states repeat the inputs of the state above with only the
   * run type changed, so the collapse shows up as a difference between two rows
   * rather than as two unrelated numbers. Each `sheet` value was evaluated on
   * the sheet itself with the cell references swapped for literals.
   *
   * This block exists because the run-type rules were reported as unimplemented
   * for a long time while two of the three were in fact wired — the note was
   * written from intent rather than from the code, and nothing measured either.
   */
  for (const [index, c] of fixtures.baseByRunType.entries()) {
    it(`matches the sheet on ${c.runType} (state ${index})`, () => {
      close(damageBase({
        runType: c.runType as never,
        towerDamage: c.towerDamage,
        damagePerk: c.damagePerk,
        tradeOffPerk: c.tradeOffPerk,
        shock: c.shock,
        demonModeMastery: c.demonModeMastery,
        cannonAssist: c.cannonAssist,
        shockwave: c.shockwave,
        projectFundingMultiplier: c.projectFundingMultiplier,
        ampStrike: c.ampStrike,
      }), c.sheet)
    })
  }

  it('drops the other seven factors only on Attack Dissonance', () => {
    const full = fixtures.baseByRunType[0]
    const collapsed = fixtures.baseByRunType[1]
    // Same inputs, different run type: the sheet's own two answers differ by
    // the seven factors, so a model that ignored run type would fail here.
    expect(collapsed.sheet).toBeLessThan(full.sheet)
    expect(collapsed.sheet).toBeCloseTo(full.shockwave * full.ampStrike, 9)
  })
})
