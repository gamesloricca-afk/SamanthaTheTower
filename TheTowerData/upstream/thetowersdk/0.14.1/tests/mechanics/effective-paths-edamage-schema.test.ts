import { describe, expect, it } from 'vitest'
import {
  assertEffectiveDamageInputs,
  checkEffectiveDamageInputs,
} from '../../src/mechanics/effective-paths/edamage-schema'
import {
  DAMAGE_WORKSHOP_STATS,
  zeroEffectiveDamageConfig,
} from '../../src/mechanics/effective-paths/edamage-config'
import { ZERO_EFFECTIVE_DAMAGE_LEVELS } from '../../src/mechanics/effective-paths/edamage-levels'
import { planEffectiveDamagePath } from '../../src/mechanics/effective-paths/edamage-plan'
import { configFromSheet, levelsFromSheet } from './helpers/effective-paths-damage-sheet'
import type { SheetCells } from './helpers/effective-paths-damage-sheet'
import states from '../../fixtures/mechanics/effective-paths-edamage-states.fixtures.json'

/**
 * The damage model's input boundary.
 *
 * The point of this layer is the failures that do *not* throw: a `NaN` where a
 * level should be, or a record rebuilt from a partial payload. Both compute
 * fine and produce a confident, wrong path. So the tests that matter are the
 * ones that plant exactly those.
 */

const config = () => zeroEffectiveDamageConfig()
const levels = () => structuredClone(ZERO_EFFECTIVE_DAMAGE_LEVELS)

describe('what the boundary accepts', () => {
  it('accepts the zeroed config, which is what every caller spreads over', () => {
    expect(checkEffectiveDamageInputs(config(), levels())).toEqual({ ok: true, issues: [] })
  })

  it('accepts all ten sheet-driven accounts', () => {
    // A schema that rejects a real account is worse than no schema: it blocks
    // the page for the exact players it was meant to protect.
    for (const [index, state] of (states as unknown as Array<{ cells: SheetCells }>).entries()) {
      const result = checkEffectiveDamageInputs(
        configFromSheet(state.cells), levelsFromSheet(state.cells),
      )
      expect(result.issues, `state ${index}`).toEqual([])
    }
  })

  it('accepts a vault level that is not a whole number', () => {
    // A keys level is a bonus divided by a per-level percentage, so 12% of a
    // 5% node is 2.4 levels. The sheet does not round and neither does this.
    const fractional = levels()
    fractional.keys.damage = 2.4
    expect(checkEffectiveDamageInputs(config(), fractional).ok).toBe(true)
  })

  it('accepts values a cautious validator would reject', () => {
    // Lenient about ranges on purpose: an unusual account is not an invalid
    // one, and guessing at limits blocks legitimate players.
    const odd = config()
    odd.stats.Damage.relicPct = 4
    odd.substats['Attack Speed'].primary = -1
    odd.cash = 1e30
    expect(checkEffectiveDamageInputs(odd, levels()).ok).toBe(true)
  })
})

describe('what it catches', () => {
  it.each(['framesPerSecond', 'lightSpeedShots', 'amplifyBot'])(
    'rejects missing %s rather than validating a default that compute never receives', field => {
      const broken = { ...config() } as Record<string, unknown>
      delete broken[field]
      const result = checkEffectiveDamageInputs(broken, levels())
      expect(result.ok).toBe(false)
      expect(result.issues.map(issue => issue.path)).toContain(`config.${field}`)
    },
  )

  it('catches a NaN level, which otherwise computes silently', () => {
    const broken = levels()
    broken.lab.damage = Number.NaN
    const { ok, issues } = checkEffectiveDamageInputs(config(), broken)
    expect(ok).toBe(false)
    expect(issues[0].path).toBe('levels.lab.damage')
  })

  it('catches an Infinity in the config', () => {
    const broken = config()
    broken.towerDamageBase = Number.POSITIVE_INFINITY
    const { ok, issues } = checkEffectiveDamageInputs(broken, levels())
    expect(ok).toBe(false)
    expect(issues.map(issue => issue.path)).toContain('config.towerDamageBase')
  })

  it('catches a record rebuilt with keys missing', () => {
    // The failure mode a plain `z.record` would wave through, and the one a
    // store restored from a partial payload actually produces.
    const broken = config() as unknown as { stats: Record<string, unknown> }
    broken.stats = { Damage: config().stats.Damage }
    const { ok, issues } = checkEffectiveDamageInputs(broken, levels())
    expect(ok).toBe(false)
    expect(issues.length).toBe(DAMAGE_WORKSHOP_STATS.length - 1)
  })

  it('catches a run type that is not one', () => {
    const broken = { ...config(), runType: 'Farming' as never }
    expect(checkEffectiveDamageInputs(broken, levels()).ok).toBe(false)
  })

  it('catches a zero cooldown, which would divide by it', () => {
    const broken = config()
    broken.ultimateWeapons['Death Wave'] = {
      ...broken.ultimateWeapons['Death Wave'], cooldown: 0,
    }
    const { ok, issues } = checkEffectiveDamageInputs(broken, levels())
    expect(ok).toBe(false)
    expect(issues[0].message).toMatch(/cooldown cannot be zero/)
  })

  it('keeps a locked weapon’s null `plus`, which is a real answer', () => {
    // `null` is the sheet's `"Locked"`. Rejecting it would reject every player
    // who has not bought a weapon's `+`.
    expect(checkEffectiveDamageInputs(config(), levels()).ok).toBe(true)
    expect(config().ultimateWeapons['Death Wave'].plus).toBeNull()
  })

  it('names every problem, not just the first', () => {
    const broken = config()
    broken.cash = Number.NaN
    broken.gameSpeed = Number.NaN
    expect(checkEffectiveDamageInputs(broken, levels()).issues.length).toBeGreaterThanOrEqual(2)
  })
})

describe('the planner refuses to plan against bad inputs', () => {
  it('returns no steps and says why', () => {
    const broken = levels()
    broken.lab.damage = Number.NaN

    const plan = planEffectiveDamagePath({
      config: config(), levels: broken, variant: 'lab-time', steps: 10,
    })

    expect(plan.steps).toEqual([])
    expect(plan.issues.length).toBeGreaterThan(0)
    expect(plan.issues[0].path).toBe('levels.lab.damage')
    // A ranking built on a NaN would be confident and meaningless, so there is
    // no starting figure to report either.
    expect(plan.finalEffectiveDamage).toBe(0)
  })

  it('reports nothing on a plan it could make', () => {
    const plan = planEffectiveDamagePath({
      config: config(), levels: levels(), variant: 'lab-time', steps: 3,
    })
    expect(plan.issues).toEqual([])
  })
})

describe('the throwing form', () => {
  it('names the problems it found', () => {
    const broken = levels()
    broken.stone.deathWaveDamage = Number.NaN
    expect(() => assertEffectiveDamageInputs(config(), broken))
      .toThrow(/levels\.stone\.deathWaveDamage/)
  })

  it('says nothing when there is nothing to say', () => {
    expect(() => assertEffectiveDamageInputs(config(), levels())).not.toThrow()
  })
})
