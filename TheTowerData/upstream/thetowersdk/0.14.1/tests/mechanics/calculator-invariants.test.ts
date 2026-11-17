import { describe, expect, it } from 'vitest'

import { CALCULATORS } from '../../src/calculators/registry'
import { bossWaveIntervalForTier } from '../../src/data/enemies/data'
import {
  labCoinDiscount,
  labDurationDaysToReachLevel,
  labMaxCatalogLevel,
} from '../../src/mechanics/effective-paths/lab-costs'
import { assistSubstatCap, moduleLevelLimit } from '../../src/mechanics/effective-paths/generics'
import {
  ultimateWeaponStatValue,
  ultimateWeaponStoneCost,
} from '../../src/mechanics/effective-paths/edamage-costs'
import { spotlightCoverage } from '../../src/mechanics/effective-paths/damage-stats'
import { projectFundingCash } from '../../src/mechanics/effective-paths/damage-base'
import { computeEffectiveDamage } from '../../src/mechanics/effective-paths/edamage-compute'
import {
  ZERO_EFFECTIVE_DAMAGE_LEVELS,
} from '../../src/mechanics/effective-paths/edamage-levels'
import { zeroEffectiveDamageConfig } from '../../src/mechanics/effective-paths/edamage-config'

/**
 * The declared calculators' invariants, checked against the real functions.
 *
 * Each calculator states its range in prose, as an `invariants` list on its
 * registry spec. The claim under test was Hubstrate's: that such declarations
 * become generated tests run by the runner that already exists, rather than by
 * a sandbox nobody has threat-modelled. This is that claim, done by hand once,
 * to find out whether the invariants are writable and whether they are TRUE
 * before a generator is built on the idea.
 *
 * The declarations were read from `.acs/calculators.json` when this was
 * written. That file was a second, lossier copy of `calculators/registry.ts`,
 * which tower-mcp already serves through `calc_list` / `calc_describe`, and it
 * is gone — the calculators belong to the Tower MCP, not to ACS. The findings
 * below stand; only where the prose is read from changed.
 *
 * ## The answer, up front
 *
 * Writable: yes, and quickly — the range is usually the first thing you know
 * about a formula. True: **not always**, and the false ones were the point.
 * Three of the eleven had an invariant that the real function violates, and
 * every one was written from the handle's name rather than from the body:
 *
 *   - `CALC.LAB_COIN_DISCOUNT` "returns a multiplier in (0, 1]" — it returns a
 *     discount FRACTION, `level * 0.003`, which is 0 at level 0 and not a
 *     multiplier at all.
 *   - `CALC.MODULE_LEVEL_LIMIT` "returns a whole number in [0, 300]" — it
 *     returns whatever number the cell holds, so a cell reading `500` yields
 *     500.
 *   - `CALC.EFFECTIVE_DAMAGE` "is finite and at least 0 for any config the
 *     schema accepts" — a Project Funding module with zero cash produces `NaN`,
 *     through `log10(0)`. Reachable: the module equipped, before any cash.
 *
 * That is the useful outcome. An invariant written from the name and then
 * checked is a cheap way to discover you had the wrong idea of the formula —
 * which is exactly the failure the registry exists to prevent, caught one layer
 * earlier and for about a minute of work each.
 */

/**
 * The eleven this file checks, named by the SYMBOL each one calls.
 *
 * These were declared a second time in `.acs/calculators.json`, in ACS's own
 * shape, while `calculators/registry.ts` already held all eleven with the same
 * `because` and near-verbatim invariants plus params, returns, reads, produces
 * and the sheet function each mirrors. That copy is gone; this reads the
 * registry tower-mcp itself serves through `calc_list` / `calc_describe`.
 *
 * Keyed by symbol rather than by id, because the symbol is the thing this file
 * actually imports and calls — an id could be renamed without the assertions
 * below noticing, and then they would check a different formula's invariant.
 */
const CHECKED_SYMBOLS = [
  'labDurationDaysToReachLevel', 'labMaxCatalogLevel', 'labCoinDiscount',
  'assistSubstatCap', 'moduleLevelLimit', 'ultimateWeaponStatValue',
  'ultimateWeaponStoneCost', 'spotlightCoverage', 'projectFundingCash',
  'bossWaveIntervalForTier', 'computeEffectiveDamage',
] as const

const DECLARED = CHECKED_SYMBOLS.map((symbol) => {
  const spec = CALCULATORS.find(c => c.symbol === symbol)
  // A missing symbol must throw here rather than yield an empty invariant list,
  // which would let every assertion below pass against nothing.
  if (!spec) throw new Error(`no calculator declared for symbol ${symbol}`)
  return { handle: spec.id, symbol, invariants: spec.invariants }
})

const invariantsOf = (symbol: string) =>
  DECLARED.find(c => c.symbol === symbol)?.invariants ?? []

describe('the declared calculators are the ones being checked', () => {
  it('has an invariant for every declaration, and a reason', () => {
    // A declaration with no invariants is a bookmark, not a claim. The registry
    // is allowed to hold those, but this file should notice if one appears.
    expect(DECLARED.length).toBe(11)
    for (const calc of DECLARED) {
      expect(calc.invariants.length, calc.handle).toBeGreaterThan(0)
    }
  })
})

describe('CALC.LAB_DURATION_DAYS', () => {
  // Real catalog slugs, read from labs-catalog.ts. `critical_chance` is a
  // STAT and not a lab, and using it here made `labMaxCatalogLevel` return 0
  // and this suite report a defect that was mine — the naming trap the repo
  // warns about, hit while writing the check for it.
  const LABS = ['damage', 'critical_chance_mastery', 'card_mastery', 'workshop_enhancements']

  it('returns null, or a strictly positive number of days', () => {
    expect(invariantsOf('labDurationDaysToReachLevel')[0]).toMatch(/strictly positive/)
    for (const lab of LABS) {
      for (let level = 0; level <= 120; level += 1) {
        const days = labDurationDaysToReachLevel(lab, level)
        if (days === null) continue
        expect(Number.isFinite(days), `${lab}@${level}`).toBe(true)
        expect(days, `${lab}@${level}`).toBeGreaterThan(0)
      }
    }
  })

  it('returns null rather than a number for a lab nobody has', () => {
    expect(labDurationDaysToReachLevel('not_a_lab', 1)).toBeNull()
  })
})

describe('CALC.LAB_MAX_LEVEL', () => {
  it('returns 0 for an unknown lab and a whole number otherwise', () => {
    expect(labMaxCatalogLevel('not_a_lab')).toBe(0)
    for (const lab of ['damage', 'critical_chance_mastery', 'card_mastery']) {
      const max = labMaxCatalogLevel(lab)
      expect(max, lab).toBeGreaterThanOrEqual(1)
      expect(Number.isInteger(max), lab).toBe(true)
    }
  })
})

describe('CALC.LAB_COIN_DISCOUNT', () => {
  /*
   * FALSIFIED. The declaration says "returns a multiplier in (0, 1]" and
   * "is 1 at level 0 — no lab, no discount".
   *
   * It returns `coinDiscountLabLevel * 0.003` — a discount FRACTION. At level 0
   * that is 0, not 1, and it is not a multiplier: a caller who used it as one
   * would price every lab at zero coins.
   *
   * The invariant was written from the handle. Checking it took under a minute
   * and corrected the reading, which is the whole argument for writing them.
   */
  it('is a fraction that starts at 0, not a multiplier that starts at 1', () => {
    expect(labCoinDiscount(0)).toBe(0)
    expect(labCoinDiscount(0)).not.toBe(1)
    for (let level = 0; level <= 30; level += 1) {
      const value = labCoinDiscount(level)
      expect(value, `level ${level}`).toBeGreaterThanOrEqual(0)
      // It rises with the level, so the declared "never increases" is backwards
      // for the same reason.
      if (level > 0) expect(value).toBeGreaterThan(labCoinDiscount(level - 1))
    }
  })
})

describe('CALC.ASSIST_SUBSTAT_CAP', () => {
  it('is exactly 0 with no assist module, whatever the capacities', () => {
    for (const stone of [0, 1, 40, 69]) {
      for (const lab of [0, 1, 30]) {
        expect(assistSubstatCap(false, stone, lab), `${stone}/${lab}`).toBe(0)
      }
    }
  })

  it('is at least 0.01 with one, and never decreases', () => {
    expect(assistSubstatCap(true, 0, 0)).toBeCloseTo(0.01, 10)
    let previous = -Infinity
    for (let stone = 0; stone <= 69; stone += 1) {
      const value = assistSubstatCap(true, stone, 0)
      expect(value, `stone ${stone}`).toBeGreaterThanOrEqual(0.01)
      expect(value, `stone ${stone}`).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })
})

describe('CALC.MODULE_LEVEL_LIMIT', () => {
  it('reads the sheet\'s words', () => {
    expect(moduleLevelLimit('none')).toBe(0)
    expect(moduleLevelLimit('all')).toBe(300)
    expect(moduleLevelLimit(null)).toBe(0)
    expect(moduleLevelLimit('nonsense')).toBe(0)
  })

  /*
   * FALSIFIED. The declaration says "returns a whole number in [0, 300]".
   *
   * It returns whatever number the cell parses to, so a cell holding 500 gives
   * 500 and one holding 12.5 gives 12.5. Neither is in range and neither is
   * whole. The function is not wrong — the invariant claimed a clamp that the
   * function never promised, and only the check told them apart.
   */
  it('does not clamp, and does not round', () => {
    expect(moduleLevelLimit(500)).toBe(500)
    expect(moduleLevelLimit('12.5')).toBe(12.5)
    expect(Number.isInteger(moduleLevelLimit('12.5'))).toBe(false)
  })
})

describe('CALC.UW_STAT_VALUE', () => {
  it('returns null or a finite number, across every weapon and stat it prices', () => {
    const weapons: Array<[string, string]> = [
      ['Death Wave', 'Damage'], ['Chain Lightning', 'Quantity'],
      ['Smart Missiles', 'Cooldown'], ['Spotlight', 'Angle'],
      ['Poison Swamp', 'Duration'], ['Inner Land Mines', 'Damage'],
      ['Chrono Field', 'Speed Reduction'],
    ]
    for (const [weapon, stat] of weapons) {
      for (let level = 0; level <= 40; level += 1) {
        const value = ultimateWeaponStatValue(weapon, stat, level)
        if (value === null) continue
        expect(Number.isFinite(value), `${weapon}/${stat}@${level}`).toBe(true)
      }
    }
  })

  it('returns null for a stat the chart does not price, rather than guessing', () => {
    expect(ultimateWeaponStatValue('Death Wave', 'Not A Stat', 1)).toBeNull()
    expect(ultimateWeaponStatValue('Not A Weapon', 'Damage', 1)).toBeNull()
  })

  it('returns a percentage as a fraction', () => {
    // Chrono Field's Speed Reduction is written "20%" in the chart; a model
    // multiplying by 20 instead of 0.2 is off by a hundred and looks plausible.
    const value = ultimateWeaponStatValue('Chrono Field', 'Speed Reduction', 1)
    if (value !== null) expect(value).toBeLessThanOrEqual(1)
  })
})

describe('CALC.UW_STONE_COST', () => {
  it('returns null at level 0 — the chart prices it as the word Unlock', () => {
    expect(ultimateWeaponStoneCost('Death Wave', 'Damage', 0)).toBeNull()
  })

  it('returns null or a strictly positive cost', () => {
    for (let level = 0; level <= 40; level += 1) {
      const cost = ultimateWeaponStoneCost('Death Wave', 'Damage', level)
      if (cost === null) continue
      expect(cost, `level ${level}`).toBeGreaterThan(0)
    }
  })
})

describe('CALC.SPOTLIGHT_COVERAGE', () => {
  it('is a fraction in [0, 1] over the reachable domain, and saturates', () => {
    for (let quantity = 0; quantity <= 12; quantity += 1) {
      for (let angle = 0; angle <= 90; angle += 1) {
        const value = spotlightCoverage(quantity, angle)
        expect(value, `${quantity}/${angle}`).toBeGreaterThanOrEqual(0)
        expect(value, `${quantity}/${angle}`).toBeLessThanOrEqual(1)
      }
    }
    // Saturation is not a curiosity: it is what silently flattened the Angle
    // upgrade to worthless on a real account this month.
    expect(spotlightCoverage(12, 90)).toBe(1)
    expect(spotlightCoverage(1, 30)).toBeLessThan(1)
  })

  it('is 0 only when there are no Spotlights', () => {
    expect(spotlightCoverage(0, 90)).toBe(0)
    expect(spotlightCoverage(1, 0)).toBeGreaterThan(0)
  })
})

describe('CALC.PERFECT_FREEZE_CASH', () => {
  it('on Util Disso depends only on the Starting Cash level', () => {
    for (const observed of [0, 1_000, 1e12]) {
      expect(projectFundingCash('Util Disso', 3, observed)).toBe(80 + 5 * 3)
    }
  })

  it('on any other run type returns the observed cash unchanged', () => {
    for (const runType of ['Regular', 'Tourney', 'Attack Disso', 'UW Disso'] as const) {
      expect(projectFundingCash(runType, 3, 4242)).toBe(4242)
    }
  })

  /*
   * PARTLY FALSIFIED, and worth keeping as the check rather than the claim.
   *
   * "returns a strictly positive number of cash" holds on Util Disso, where the
   * floor is 80. Off it, the function returns the observed cash, so a config
   * with 0 cash returns 0 — and `projectFundingMultiplier` then takes `log10` of it.
   */
  it('is positive on Util Disso, and only passes through elsewhere', () => {
    expect(projectFundingCash('Util Disso', 0, 0)).toBe(80)
    expect(projectFundingCash('Regular', 0, 0)).toBe(0)
  })
})

describe('CALC.BOSS_WAVE_INTERVAL', () => {
  it('returns a strictly positive whole number of waves for any tier', () => {
    for (let tier = -5; tier <= 25; tier += 1) {
      const interval = bossWaveIntervalForTier(tier)
      expect(Number.isInteger(interval), `tier ${tier}`).toBe(true)
      expect(interval, `tier ${tier}`).toBeGreaterThan(0)
    }
  })
})

describe('CALC.EFFECTIVE_DAMAGE', () => {
  /*
   * FALSIFIED, and this is the one that matters.
   *
   * The declaration says "effectiveDamage is finite and at least 0 for any
   * config the schema accepts". It is not. With a Project Funding module and
   * zero cash the Project Funding term reaches `log10(0)`, `DG5` becomes
   * `-Infinity` and the whole result is `NaN`.
   *
   * That is a reachable player state, not a contrived one: the module equipped,
   * at the start of a run, before any cash is earned.
   *
   * It matters because of what consumes the number. `planPath`'s own comment
   * says it: a non-finite baseline makes `NaN > NaN` false for every candidate,
   * so the first one examined wins every step and the path is the candidate
   * list in declaration order, presented as a recommendation. Nothing throws.
   *
   * A first version of this test asserted the zero config was non-finite. It is
   * not — `zeroEffectiveDamageConfig()` has no Project Funding, so nothing calls
   * `log10` and the result is a clean 125.99. The claim was right about the
   * failure and wrong about the input, which is its own small lesson: the
   * invariant is only worth what the case behind it is worth.
   */
  it('stays finite with a Project Funding module and no cash', () => {
    /*
     * `projectFundingMultiplier` returns 1 when cash ≤ 0 so `log10(0)` cannot NaN the
     * base. PF lives in DH5 (v5.10+); DG5 is ACP / shockwave.
     */
    const zero = zeroEffectiveDamageConfig()
    const config = {
      ...zero,
      cash: 0,
      uniques: { ...zero.uniques, 'Project Funding': { primary: 1, assist: 0 } },
    }
    const result = computeEffectiveDamage(config, ZERO_EFFECTIVE_DAMAGE_LEVELS)
    expect(result.columns.DH5).toBe(1)
    expect(Number.isFinite(result.effectiveDamage)).toBe(true)

    const withCash = computeEffectiveDamage(
      { ...config, cash: 1 }, ZERO_EFFECTIVE_DAMAGE_LEVELS,
    )
    expect(Number.isFinite(withCash.effectiveDamage)).toBe(true)
    expect(withCash.columns.DH5).toBe(1)
  })

  it('is finite for the zero config, which an earlier version of this claimed otherwise', () => {
    const value = computeEffectiveDamage(
      zeroEffectiveDamageConfig(), ZERO_EFFECTIVE_DAMAGE_LEVELS,
    ).effectiveDamage
    expect(Number.isFinite(value)).toBe(true)
  })

  it('is finite and non-negative once the tower has any damage at all', () => {
    const config = { ...zeroEffectiveDamageConfig(), towerDamageBase: 3, cash: 100 }
    const value = computeEffectiveDamage(config, ZERO_EFFECTIVE_DAMAGE_LEVELS).effectiveDamage
    expect(Number.isFinite(value)).toBe(true)
    expect(value).toBeGreaterThanOrEqual(0)
  })
})
