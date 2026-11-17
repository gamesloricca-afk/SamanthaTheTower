import { describe, expect, it } from 'vitest'
import {
  areaOfEffectCardBoost,
  attackRange,
  attackSpeed,
  damagePerkMultiplier,
  damagePerMeter,
  effectiveRangeMetres,
  maxRendArmourMultiplier,
  rangeDamageMultiplier,
} from '../../src/mechanics/effective-paths/damage-stats'
import { workshopStatValue } from '../../src/mechanics/effective-paths/workshop-values'
import fixtures from '../../fixtures/mechanics/effective-paths-damage-stats2.fixtures.json'

/** The rest of the `EPD_*` layer, against the live sheet. */

const close = (ours: number, sheet: number, digits = 12) =>
  expect(Math.abs(ours / sheet - 1)).toBeLessThan(10 ** -digits)

describe('EPD_ASPD', () => {
  for (const [index, a] of fixtures.attackSpeed.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(attackSpeed({
        workshopLevel: a.ws,
        enhancementLevel: a.wsp,
        labLevel: a.lab,
        hasAttackSpeedCard: a.hasCard,
        cardLevel: a.cardLevel,
        hasCardMastery: a.hasMastery,
        masteryLevel: a.masteryLevel,
        substat: a.sub,
        relicPct: a.relic,
        vaultPct: a.vault,
      }), a.sheet)
    })
  }

  it('adds the substat outside the card product, not inside it', () => {
    // The sheet's grouping, and not the obvious one: (WS × Lab × Card + Sub).
    const base = {
      workshopLevel: 10,
      enhancementLevel: 0,
      labLevel: 0,
      hasAttackSpeedCard: true,
      cardLevel: 4,
      hasCardMastery: false,
      masteryLevel: 0,
      relicPct: 0,
      vaultPct: 0,
    }
    const withSubstat = attackSpeed({ ...base, substat: 2 })
    const without = attackSpeed({ ...base, substat: 0 })
    expect(withSubstat - without).toBeCloseTo(2, 12)
  })
})

describe('EPD_DPM', () => {
  for (const [index, d] of fixtures.damagePerMeter.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      // The workshop table has to agree first, or the rest means nothing.
      const ours = workshopStatValue('Damage / Meter', d.wsLevel)
      expect(ours?.value).toBeCloseTo(d.sheetWorkshopValue, 9)

      close(damagePerMeter({
        workshopValue: d.sheetWorkshopValue,
        enhancementLevel: d.wsp,
        labLevel: d.lab,
        substat: d.sub,
        relicPct: d.relic,
        vaultPct: d.vault,
        hasRangeMastery: d.hasMastery,
        masteryLevel: d.masteryLevel,
      }), d.sheet)
    })
  }
})

describe('EPD_RANGE and FUDDSMATH_RANGE', () => {
  for (const [index, r] of fixtures.range.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(attackRange({
        workshopLevel: r.ws,
        hasRangeCard: r.hasCard,
        cardLevel: r.cardLevel,
        labLevel: r.lab,
        substat: r.sub,
      }), r.sheet)
    })
  }

  it('leaves range under 80m alone', () => {
    expect(effectiveRangeMetres(50)).toBe(50)
    expect(effectiveRangeMetres(80)).toBe(80)
  })

  it('discounts up to 16% at 220m, and stops discounting past it', () => {
    expect(effectiveRangeMetres(220)).toBeCloseTo(220 * 0.84, 9)
    // Past 220 the discount stays at 16% — it does not keep growing.
    expect(effectiveRangeMetres(400)).toBeCloseTo(400 * 0.84, 9)
  })

  it('keeps the sheet\u2019s two roundings', () => {
    // 123m is a range where they bite: the ratio is 0.30714285…, which the
    // sheet rounds to 0.3071 before taking 16% of it. Dropping the roundings
    // moves the answer in the fourth decimal — the size of error that survives
    // a spot check.
    const ratio = (123 - 80) / 140
    const unrounded = 123 * (1 - ratio * 0.16)
    expect(effectiveRangeMetres(123)).not.toBe(unrounded)
    // Close enough to look right, far enough to be wrong: half a hundredth of
    // a metre out of 117.
    expect(Math.abs(effectiveRangeMetres(123) - unrounded)).toBeGreaterThan(1e-3)
    expect(Math.abs(effectiveRangeMetres(123) - unrounded)).toBeLessThan(1e-2)
  })
})

describe('EPD_MAXREND', () => {
  for (const [index, r] of fixtures.maxRend.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(maxRendArmourMultiplier({
        hasRend: r.has, labLevel: r.lab, substat: r.sub, enhancementLevel: r.wsp,
      }), r.sheet)
    })
  }

  it('is one without the weapon, not zero', () => {
    expect(maxRendArmourMultiplier({
      hasRend: false, labLevel: 20, substat: 5, enhancementLevel: 40,
    })).toBe(1)
  })
})

describe('EPD_SPB', () => {
  for (const [index, s] of fixtures.damagePerk.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(damagePerkMultiplier(s.has, s.lab, s.qty), s.sheet)
    })
  }
})

describe('EPD_AOE_CARD_BOOST', () => {
  for (const a of fixtures.aoeCard) {
    it(`matches the sheet at level ${a.level}${a.has ? '' : ' (no card)'}`, () => {
      expect(areaOfEffectCardBoost(a.has, a.level)).toBeCloseTo(a.sheet, 12)
    })
  }

  it('steps by 3 points until the last level, which steps by 5', () => {
    const at = (level: number) => areaOfEffectCardBoost(true, level) - 1
    expect(at(6) - at(5)).toBeCloseTo(0.03, 12)
    expect(at(7) - at(6)).toBeCloseTo(0.05, 12)
  })

  it('clamps into the table rather than falling out of it', () => {
    // Level 0 is what the sheet does — `INDEX(table, 0)` yields the whole
    // table, which collapses to its first entry — and it is what the game
    // means too: an equipped card is at least level 1.
    expect(areaOfEffectCardBoost(true, 0)).toBeCloseTo(1.05, 12)
    // Cards stop at 7, so the top end is unreachable; the sheet errors there.
    expect(areaOfEffectCardBoost(true, 8)).toBeCloseTo(1.25, 12)
    // The card being absent is still the thing that switches it off.
    expect(areaOfEffectCardBoost(false, 7)).toBe(1)
  })
})

describe('EPD_RANGEDPM', () => {
  for (const [index, r] of fixtures.rangeDamage.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(rangeDamageMultiplier(r.range, r.dpm, r.kill), r.sheet)
    })
  }

  it('is inert when nothing dies away from the tower', () => {
    expect(rangeDamageMultiplier(200, 0.3, 0)).toBe(1)
  })
})
