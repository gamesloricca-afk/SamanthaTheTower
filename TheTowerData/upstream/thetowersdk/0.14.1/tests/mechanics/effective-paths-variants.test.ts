import { describe, expect, it } from 'vitest'
import {
  DAMAGE_PLAN_VARIANTS,
  planEffectiveDamagePath,
} from '../../src/mechanics/effective-paths/edamage-plan'
import {
  ECONOMY_PLAN_VARIANTS,
  planEffectiveEconomyPath,
} from '../../src/mechanics/effective-paths/eecon-plan'
import {
  HEALTH_PATH_VARIANTS,
  planEffectiveHealthPath,
} from '../../src/mechanics/effective-paths/ehp-plan'
import {
  planEffectiveRegenPath,
  REGEN_PATH_VARIANTS,
} from '../../src/mechanics/effective-paths/regen-plan'
import { assertPathVariant } from '../../src/mechanics/effective-paths/planner'
import { zeroEffectiveDamageConfig } from '../../src/mechanics/effective-paths/edamage-config'
import { ZERO_EFFECTIVE_DAMAGE_LEVELS } from '../../src/mechanics/effective-paths/edamage-levels'
import { ZERO_EFFECTIVE_ECONOMY_LEVELS } from '../../src/mechanics/effective-paths/eecon-levels'
import { ZERO_EFFECTIVE_HEALTH_LEVELS } from '../../src/mechanics/effective-paths/ehp-model'

/**
 * Every planner's refusal to plan a path it does not publish.
 *
 * ## The shape of the bug
 *
 * All four decide eligibility by asking whether an upgrade lists the requested
 * variant. A variant nothing lists is therefore not an error: every candidate
 * is skipped and the answer is a path with no steps, no exclusions and no
 * issues — identical to a player who has bought everything, and rendered as an
 * empty table with no clue why.
 *
 * It was reachable. `lab` is a damage *band* and `lab-time` is a damage
 * *variant*, and passing the band planned nothing at every account profile
 * before this existed. The compiler objects only where the argument is typed,
 * which excludes fixtures and any value that arrives as a string.
 */

const damage = { config: zeroEffectiveDamageConfig(), levels: ZERO_EFFECTIVE_DAMAGE_LEVELS }

/** Each planner, with the minimum it needs and the variants it publishes. */
const PLANNERS = [
  {
    family: 'damage',
    allowed: DAMAGE_PLAN_VARIANTS,
    plan: (variant: string) => planEffectiveDamagePath({
      ...damage, variant: variant as never, steps: 1,
    }),
  },
  {
    family: 'eHP',
    allowed: HEALTH_PATH_VARIANTS,
    plan: (variant: string) => planEffectiveHealthPath({
      config: {} as never, levels: ZERO_EFFECTIVE_HEALTH_LEVELS, variant: variant as never, steps: 1,
    }),
  },
  {
    family: 'eRegen',
    allowed: REGEN_PATH_VARIANTS,
    plan: (variant: string) => planEffectiveRegenPath({
      config: {} as never,
      eHealth: {} as never,
      levels: ZERO_EFFECTIVE_HEALTH_LEVELS as never,
      variant: variant as never,
      steps: 1,
    }),
  },
  {
    family: 'eEcon',
    allowed: ECONOMY_PLAN_VARIANTS,
    plan: (variant: string) => planEffectiveEconomyPath({
      config: {} as never, levels: ZERO_EFFECTIVE_ECONOMY_LEVELS, variant: variant as never, steps: 1,
    }),
  },
]

describe('a variant a planner does not publish', () => {
  for (const planner of PLANNERS) {
    it(`${planner.family} refuses one outright`, () => {
      expect(() => planner.plan('not-a-path')).toThrow(/unknown .* path variant "not-a-path"/)
    })

    it(`${planner.family} names what it does publish`, () => {
      // So the message is actionable. A bare rejection leaves the caller to
      // find the list, which is how `lab` was passed in the first place.
      expect(() => planner.plan('not-a-path')).toThrow(planner.allowed.join(', '))
    })

    it(`${planner.family} rejects the band name, not just nonsense`, () => {
      /*
       * The near miss that actually happened, and the one a typo check would
       * miss: `lab` reads like a variant, is a real word in this codebase, and
       * is wrong in all four families.
       */
      expect(() => planner.plan('lab')).toThrow(/unknown/)
    })
  }
})

describe('the discount path keeps its own message', () => {
  it('points at the planner that does plan it', () => {
    /*
     * `discount` is a real econ path with a separate planner, so it is in
     * `ECONOMY_PLAN_VARIANTS` deliberately — it passes the unknown-variant
     * guard and reaches the message that names the right function, rather than
     * being reported as a typo.
     */
    expect(() => planEffectiveEconomyPath({
      config: {} as never, levels: ZERO_EFFECTIVE_ECONOMY_LEVELS, variant: 'discount', steps: 1,
    })).toThrow(/planEffectiveEconomyDiscountPath/)
  })
})

describe('the guard itself', () => {
  it('passes anything in the list', () => {
    expect(() => assertPathVariant('stone', ['stone', 'coin'], 'test')).not.toThrow()
  })

  it('is case sensitive, since the variants are', () => {
    // `Stone` is not `stone`, and quietly accepting it would put the caller on
    // a path they did not ask for.
    expect(() => assertPathVariant('Stone', ['stone'], 'test')).toThrow(/unknown test path variant/)
  })

  it('rejects an empty variant rather than treating it as a default', () => {
    // An unset setting arrives as `''`, and defaulting it would silently plan
    // somebody else's path.
    expect(() => assertPathVariant('', ['stone'], 'test')).toThrow()
  })
})
