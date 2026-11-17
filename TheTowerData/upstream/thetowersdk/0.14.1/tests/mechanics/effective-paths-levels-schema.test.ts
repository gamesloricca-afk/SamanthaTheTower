import { describe, expect, it } from 'vitest'
import {
  checkEffectiveEconomyLevels,
  checkEffectiveHealthLevels,
  checkEffectiveRegenLevels,
} from '../../src/mechanics/effective-paths/levels-schema'
import { ZERO_EFFECTIVE_ECONOMY_LEVELS } from '../../src/mechanics/effective-paths/eecon-levels'
import { ZERO_EFFECTIVE_HEALTH_LEVELS } from '../../src/mechanics/effective-paths/ehp-model'
import { ZERO_EFFECTIVE_REGEN_LEVELS } from '../../src/mechanics/effective-paths/regen-plan'

/**
 * The level contract, and the three ways levels actually arrive broken.
 *
 * Every case here is a shape this port has seen, not an invented one: a record
 * rebuilt from a partial payload with half its keys, a number field the player
 * emptied parsing to `NaN`, a key added to a model that some caller's copy does
 * not have yet. None of them throw — they produce a number, and the path is
 * confidently wrong.
 */

const CHECKS = [
  { model: 'economy', check: checkEffectiveEconomyLevels, zero: ZERO_EFFECTIVE_ECONOMY_LEVELS, banded: true },
  { model: 'eHP', check: checkEffectiveHealthLevels, zero: ZERO_EFFECTIVE_HEALTH_LEVELS, banded: false },
  { model: 'eRegen', check: checkEffectiveRegenLevels, zero: ZERO_EFFECTIVE_REGEN_LEVELS, banded: false },
] as const

describe.each(CHECKS)('$model levels', ({ check, zero, banded }) => {
  /** A copy of the zero record with one key removed. */
  const missingOne = () => {
    const copy: Record<string, unknown> = JSON.parse(JSON.stringify(zero))
    if (!banded) {
      delete copy[Object.keys(copy)[0]]
      return copy
    }
    const band = Object.keys(copy)[0]
    const inner = { ...(copy[band] as Record<string, number>) }
    delete inner[Object.keys(inner)[0]]
    return { ...copy, [band]: inner }
  }

  /** The same, with one key set to a bad value. */
  const withValue = (value: unknown) => {
    const copy: Record<string, unknown> = JSON.parse(JSON.stringify(zero))
    if (!banded) return { ...copy, [Object.keys(copy)[0]]: value }
    const band = Object.keys(copy)[0]
    const inner = { ...(copy[band] as Record<string, number>) }
    inner[Object.keys(inner)[0]] = value as number
    return { ...copy, [band]: inner }
  }

  it('accepts the model’s own zero', () => {
    // The precondition. A schema that rejects the shipped zero rejects
    // everything, and every "it catches X" below would pass for the wrong
    // reason.
    expect(check(zero)).toEqual({ ok: true, issues: [] })
  })

  it('catches a missing key, and says which', () => {
    /*
     * The one that matters most. A missing key reads as `undefined`, arithmetic
     * on it gives `NaN`, and `NaN` spreads silently through every term it
     * touches — so the path ranks against nothing and still renders.
     */
    const result = check(missingOne())
    expect(result.ok).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues[0].path, 'the issue does not name the field').toBeTruthy()
  })

  it('catches NaN, which is what an emptied number field parses to', () => {
    expect(check(withValue(Number.NaN)).ok).toBe(false)
  })

  it('catches Infinity', () => {
    expect(check(withValue(Number.POSITIVE_INFINITY)).ok).toBe(false)
  })

  it('allows a negative level, because the sheet has one', () => {
    /*
     * This asserted the opposite, on the reasoning that a negative level
     * prices something a player cannot un-buy. The sheet disagreed: the
     * `eEcon` oracle fixture carries a negative Golden Combo stone level, so
     * the bound rejected the authority being ported — and it rejected it by
     * returning an empty plan, which is the failure mode this whole file
     * exists to prevent.
     *
     * Magnitude is the caller's business. Finiteness is not.
     */
    expect(check(withValue(-1)).ok).toBe(true)
  })

  it('allows a fractional level', () => {
    // Same reasoning: unusual, but it is somebody's data and it computes.
    expect(check(withValue(2.5)).ok).toBe(true)
  })

  it('catches a level that is a string', () => {
    // Stored settings round-trip through JSON, and a number read back as text
    // concatenates instead of adding.
    expect(check(withValue('12')).ok).toBe(false)
  })

  it('accepts a level above any cap', () => {
    /*
     * Deliberately lenient about magnitude. Caps move between game versions and
     * a validator that second-guesses the catalog blocks a legitimate account —
     * the planner clamps to the cap anyway.
     */
    expect(check(withValue(99_999)).ok).toBe(true)
  })

  it('rejects a null, an array and a string outright', () => {
    for (const bad of [null, undefined, [], 'levels', 42]) {
      expect(check(bad).ok, String(bad)).toBe(false)
    }
  })
})

describe('the economy schema knows its bands', () => {
  it('rejects a record missing a whole band', () => {
    // Economy levels are `time`, `stone` and `discount`. Losing one is what
    // happens when a caller spreads only the band they were working on.
    const { time } = ZERO_EFFECTIVE_ECONOMY_LEVELS
    expect(checkEffectiveEconomyLevels({ time }).ok).toBe(false)
  })

  it('names the band and the field in the path', () => {
    const broken = {
      ...ZERO_EFFECTIVE_ECONOMY_LEVELS,
      time: { ...ZERO_EFFECTIVE_ECONOMY_LEVELS.time, coinsPerKillBonus: Number.NaN },
    }
    const result = checkEffectiveEconomyLevels(broken)
    expect(result.ok).toBe(false)
    expect(result.issues.some(issue => issue.path === 'time.coinsPerKillBonus')).toBe(true)
  })

  it('ignores a key it does not know rather than rejecting it', () => {
    /*
     * Deliberate, and load-bearing. The regen planner is handed
     * `{ ...healthLevels, ...regenLevels }` — one object carrying two models'
     * keys — so a strict schema would reject the very shape the planner
     * expects. Unknown keys are somebody else's business.
     *
     * The first version of the test above spelled a key `coinsKillBonus`
     * instead of `coinsPerKillBonus`, and this leniency is why it passed while
     * asserting nothing.
     */
    const extra = { ...ZERO_EFFECTIVE_ECONOMY_LEVELS, somethingElse: 'ignored' }
    expect(checkEffectiveEconomyLevels(extra).ok).toBe(true)
  })
})
