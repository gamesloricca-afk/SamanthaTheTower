import { describe, expect, it } from 'vitest'
import { planEffectiveDamagePath } from '../../src/mechanics/effective-paths/edamage-plan'
import { planEffectiveEconomyPath } from '../../src/mechanics/effective-paths/eecon-plan'
import { planEffectiveHealthPath } from '../../src/mechanics/effective-paths/ehp-plan'
import { planEffectiveRegenPath } from '../../src/mechanics/effective-paths/regen-plan'
import { zeroEffectiveDamageConfig } from '../../src/mechanics/effective-paths/edamage-config'
import { ZERO_EFFECTIVE_DAMAGE_LEVELS } from '../../src/mechanics/effective-paths/edamage-levels'
import { ZERO_EFFECTIVE_ECONOMY_LEVELS } from '../../src/mechanics/effective-paths/eecon-levels'
import { zeroEffectiveEconomyConfig } from '../../src/mechanics/effective-paths/eecon-compute'
import {
  ZERO_EFFECTIVE_HEALTH_LEVELS,
  zeroEffectiveHealthConfig,
  zeroEffectiveRegenConfigSource,
} from '../../src/mechanics/effective-paths/ehp-model'
import { ZERO_EFFECTIVE_REGEN_LEVELS } from '../../src/mechanics/effective-paths/regen-levels'

/**
 * The four plan families, held to each other rather than to the sheet.
 *
 * ## Why this file exists
 *
 * Every defect found in the last few rounds was invisible from inside the file
 * that had it and obvious beside its sibling: one builder indexing `slots`
 * where three others guarded it, one card lookup checking the store but not its
 * array, one family checking its levels before planning while three planned on
 * whatever they were handed.
 *
 * That last one was mine. The level schemas were written, tested, documented
 * with "check levels before planning against them" — and called by nothing but
 * their own tests, for three of the four families. Supported by the model,
 * never set by the wiring, reported by nothing: the exact shape this codebase
 * keeps producing, written by someone who had just spent a week finding it.
 *
 * A per-family test cannot catch that, because each family passes its own
 * tests. Only a test that asks *the same question of all four* can.
 */

const plans = {
  damage: (levels: unknown) => planEffectiveDamagePath({
    config: zeroEffectiveDamageConfig(),
    levels: levels as never,
    variant: 'lab-time',
    steps: 3,
  }),
  economy: (levels: unknown) => planEffectiveEconomyPath({
    config: zeroEffectiveEconomyConfig(),
    levels: levels as never,
    variant: 'time',
    steps: 3,
  }),
  health: (levels: unknown) => planEffectiveHealthPath({
    config: zeroEffectiveHealthConfig(),
    levels: levels as never,
    variant: 'lab-time',
    steps: 3,
  }),
  regen: (levels: unknown) => planEffectiveRegenPath({
    config: zeroEffectiveRegenConfigSource(),
    eHealth: zeroEffectiveHealthConfig(),
    levels: levels as never,
    variant: 'lab-time',
    steps: 3,
  }),
} as const

/** A good set of levels for each family, and one key worth breaking in it. */
const levelsFor = {
  damage: () => structuredClone(ZERO_EFFECTIVE_DAMAGE_LEVELS),
  economy: () => structuredClone(ZERO_EFFECTIVE_ECONOMY_LEVELS),
  health: () => structuredClone(ZERO_EFFECTIVE_HEALTH_LEVELS),
  regen: () => ({
    ...structuredClone(ZERO_EFFECTIVE_HEALTH_LEVELS),
    ...structuredClone(ZERO_EFFECTIVE_REGEN_LEVELS),
  }),
} as const

type Family = keyof typeof plans

const FAMILIES = Object.keys(plans) as Family[]

/** Set the first leaf key, wherever the family happens to keep it. */
function breakFirstLevel(levels: Record<string, unknown>, value: unknown): Record<string, unknown> {
  for (const [key, held] of Object.entries(levels)) {
    if (typeof held === 'number') return { ...levels, [key]: value }
    if (held && typeof held === 'object') {
      return { ...levels, [key]: breakFirstLevel(held as Record<string, unknown>, value) }
    }
  }
  throw new Error('no level to break — the fixture is wrong, not the model')
}

describe('every plan family answers the same questions the same way', () => {
  it.each(FAMILIES)('%s plans from levels it accepts, and says so', family => {
    const plan = plans[family](levelsFor[family]())
    expect(plan.issues, 'a clean zero record was rejected').toEqual([])
  })

  it.each(FAMILIES)('%s refuses to plan on a NaN level', family => {
    const broken = breakFirstLevel(levelsFor[family]() as Record<string, unknown>, Number.NaN)
    const plan = plans[family](broken)

    expect(plan.issues.length, 'planned on a NaN level without complaint').toBeGreaterThan(0)
    expect(plan.steps, 'a path was planned from levels it called invalid').toEqual([])
  })

  it.each(FAMILIES)('%s refuses to plan on a missing level', family => {
    const levels = levelsFor[family]() as Record<string, unknown>
    const broken = breakFirstLevel(levels, undefined)
    const plan = plans[family](broken)

    expect(plan.issues.length, 'planned on a missing level without complaint').toBeGreaterThan(0)
    expect(plan.steps).toEqual([])
  })

  it.each(FAMILIES)('%s names the key it objected to', family => {
    // An issue with no path is barely better than no issue: the page shows it
    // to a player who then has no idea which of a hundred levels is wrong.
    const broken = breakFirstLevel(levelsFor[family]() as Record<string, unknown>, Number.NaN)
    for (const issue of plans[family](broken).issues) {
      expect(issue.path, `${family} reported an issue with no path`).toBeTruthy()
      expect(issue.message, `${family} reported an issue with no message`).toBeTruthy()
    }
  })

  it('checks levels in all four families, not three of them', () => {
    /*
     * The assertion that would have failed before this round. Stated as a
     * count rather than per-family so that a fifth family cannot be added
     * without either wiring its check or deliberately editing this line.
     */
    const checked = FAMILIES.filter(family => {
      const broken = breakFirstLevel(levelsFor[family]() as Record<string, unknown>, Number.NaN)
      return plans[family](broken).issues.length > 0
    })

    expect(checked).toEqual(FAMILIES)
  })
})
