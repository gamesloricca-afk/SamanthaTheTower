import { describe, expect, it } from 'vitest'
import { DAMAGE_PLAN_VARIANTS, planEffectiveDamagePath } from '../../src/mechanics/effective-paths/edamage-plan'
import { ECONOMY_PLAN_VARIANTS, planEffectiveEconomyPath } from '../../src/mechanics/effective-paths/eecon-plan'
import { HEALTH_PATH_VARIANTS, planEffectiveHealthPath } from '../../src/mechanics/effective-paths/ehp-plan'
import {
  planEffectiveRegenPath,
  REGEN_PATH_VARIANTS,
  ZERO_EFFECTIVE_REGEN_LEVELS,
} from '../../src/mechanics/effective-paths/regen-plan'
import { zeroEffectiveDamageConfig } from '../../src/mechanics/effective-paths/edamage-config'
import { ZERO_EFFECTIVE_DAMAGE_LEVELS } from '../../src/mechanics/effective-paths/edamage-levels'
import { ZERO_EFFECTIVE_ECONOMY_LEVELS } from '../../src/mechanics/effective-paths/eecon-levels'
import { zeroEffectiveEconomyConfig } from '../../src/mechanics/effective-paths/eecon-compute'
import {
  ZERO_EFFECTIVE_HEALTH_LEVELS,
  zeroEffectiveHealthConfig,
  zeroEffectiveRegenConfigSource,
} from '../../src/mechanics/effective-paths/ehp-model'

/**
 * Random accounts, not chosen ones.
 *
 * ## What this adds
 *
 * Every other test here picks its account: a zero, a midpoint, three profiles
 * along a curve. Chosen accounts share a blind spot — they are the states
 * somebody thought of, and a greedy loop over a hundred candidates has more
 * states than anybody thinks of. A level exactly on a cap. A level one past a
 * threshold the cost table changes at. Everything maxed but one thing. Nothing
 * at all except the one upgrade that gates six others.
 *
 * So this generates them instead, and asserts only what must be true of *any*
 * account — the planner never throws, never returns a step it cannot price,
 * never goes backwards, and gives the same answer twice.
 *
 * ## Why the randomness is seeded
 *
 * A fuzz test that fails once and passes on re-run is worse than no test: it
 * teaches the reader to re-run rather than to look. The generator is a fixed
 * sequence, so a failure names an account that can be reproduced by index —
 * and the run is identical on every machine and every CI attempt.
 */

/** A small deterministic PRNG. Same seed, same sequence, everywhere. */
function mulberry32(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6D2B79F5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A level, weighted towards the values that break things.
 *
 * Not uniform: zero, one and "very large" are where the interesting behaviour
 * lives — a cap reached, a table exhausted, a candidate that has nothing left.
 * A uniform draw over 0–100 would spend nearly all its time in the middle,
 * which is the part that already works.
 */
function levelFrom(random: () => number): number {
  const roll = random()
  if (roll < 0.2) return 0
  if (roll < 0.3) return 1
  if (roll < 0.4) return Math.floor(random() * 5)
  if (roll < 0.85) return Math.floor(random() * 120)
  return Math.floor(random() * 5000)
}

/** Fill every numeric leaf of a zero record with a generated level. */
function randomise<T>(zero: T, random: () => number): T {
  if (typeof zero === 'number') return levelFrom(random) as unknown as T
  if (Array.isArray(zero)) return zero as unknown as T
  if (zero && typeof zero === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(zero)) out[key] = randomise(value, random)
    return out as T
  }
  return zero
}

const RUNS = 60

/** Each family, its variants, and how to plan one from generated levels. */
const FAMILIES = [
  {
    name: 'damage',
    variants: DAMAGE_PLAN_VARIANTS,
    plan: (variant: string, random: () => number, steps: number) => {
      const config = zeroEffectiveDamageConfig()
      if (variant === 'stone') {
        // Exercise stone costs and levels with owned weapons.
        for (const weapon of Object.values(config.ultimateWeapons)) weapon.unlocked = true
        config.chronoFieldEnabled = true
      }
      return planEffectiveDamagePath({
        config,
        levels: randomise(ZERO_EFFECTIVE_DAMAGE_LEVELS, random),
        variant: variant as never,
        coinsPerHour: 5_000_000,
        steps,
      })
    },
  },
  {
    name: 'economy',
    // `discount` is planned elsewhere and refuses this entry point by design.
    variants: ECONOMY_PLAN_VARIANTS.filter(variant => variant !== 'discount'),
    plan: (variant: string, random: () => number, steps: number) => planEffectiveEconomyPath({
      config: zeroEffectiveEconomyConfig(),
      levels: randomise(ZERO_EFFECTIVE_ECONOMY_LEVELS, random),
      variant: variant as never,
      steps,
      workshopEnhancementsUnlocked: random() > 0.5,
      daysOnly: random() > 0.5,
      coinsPerHour: random() > 0.9 ? 0 : Math.floor(random() * 5_000_000),
    }),
  },
  {
    name: 'eHP',
    variants: HEALTH_PATH_VARIANTS,
    plan: (variant: string, random: () => number, steps: number) => planEffectiveHealthPath({
      config: zeroEffectiveHealthConfig(),
      levels: randomise(ZERO_EFFECTIVE_HEALTH_LEVELS, random),
      variant: variant as never,
      steps,
    }),
  },
  {
    name: 'eRegen',
    variants: REGEN_PATH_VARIANTS,
    plan: (variant: string, random: () => number, steps: number) => {
      const regen = zeroEffectiveRegenConfigSource()
      return planEffectiveRegenPath({
        config: {
          healthRegen: regen.healthRegen,
          card: regen.card,
          hasSecondWindMastery: regen.hasSecondWindMastery,
        },
        eHealth: zeroEffectiveHealthConfig(),
        levels: randomise(
          { ...ZERO_EFFECTIVE_HEALTH_LEVELS, ...ZERO_EFFECTIVE_REGEN_LEVELS },
          random,
        ),
        variant: variant as never,
        steps,
      })
    },
  },
]

describe.each(FAMILIES)('$name, against $RUNS generated accounts', ({ variants, plan }) => {
  for (const variant of variants) {
    it(`holds every invariant on ${variant}`, () => {
      for (let run = 0; run < RUNS; run += 1) {
        /*
         * The seed is the run index, so a failure below names one account and
         * `mulberry32(n)` reproduces it exactly — on any machine, on any
         * attempt. The `at` prefix on every message is what makes that usable.
         */
        const at = `${variant} run ${run}`
        const steps = 1 + (run % 12)

        let result: ReturnType<typeof plan>
        expect(() => { result = plan(variant, mulberry32(run), steps) }, at).not.toThrow()

        const steps_ = result!.steps
        expect(steps_.length, `${at}: planned more than asked`).toBeLessThanOrEqual(steps)

        const seen = new Map<string, number>()
        let running = 0
        let previousValue = Number.NEGATIVE_INFINITY

        for (const step of steps_) {
          const where = `${at}: ${step.name}@${step.level}`

          // Priced, and priced with a real number.
          expect(Number.isFinite(step.cost), where).toBe(true)
          expect(step.cost, where).toBeGreaterThan(0)
          expect(Number.isFinite(step.value), where).toBe(true)
          expect(Number.isFinite(step.roi), where).toBe(true)

          // One level at a time, per upgrade, never a gap.
          const previous = seen.get(step.id)
          if (previous !== undefined) expect(step.level, where).toBe(previous + 1)
          seen.set(step.id, step.level)

          // The running total is the running total.
          running += step.cost
          expect(step.cumulativeCost, where).toBeCloseTo(running, 4)

          // And a purchase never makes the player worse off.
          // A frame-capped Rapid Fire upgrade can be mathematically neutral;
          // different multiplication order leaves sub-ulp noise in the total.
          const rounding = Number.isFinite(previousValue)
            ? Math.max(Math.abs(previousValue), Math.abs(step.value)) * Number.EPSILON * 4 : 0
          expect(step.value + rounding, where).toBeGreaterThanOrEqual(previousValue)
          previousValue = step.value
        }

        // Everything not planned is explained, by id.
        const planned = new Set(steps_.map(step => step.id))
        for (const entry of result!.excluded) {
          expect(entry.reason, `${at}: ${entry.sheetName}`).toBeTruthy()
          if (entry.id !== undefined) expect(planned.has(entry.id), `${at}: ${entry.id}`).toBe(false)
        }
      }
    })

    it(`actually plans something on ${variant}`, () => {
      /*
       * The guard on the guard. Every invariant above holds trivially for an
       * empty path, so if the generated accounts all came out maxed — or if a
       * variant quietly stopped offering anything — the checks would pass while
       * exercising nothing at all.
       */
      let planned = 0
      for (let run = 0; run < RUNS; run += 1) planned += plan(variant, mulberry32(run), 6).steps.length
      expect(planned, `${variant} planned nothing across ${RUNS} accounts`).toBeGreaterThan(0)
    })

    it(`is reproducible on ${variant}`, () => {
      /*
       * The property the whole file rests on. If planning were not
       * deterministic, every failure above would be unreproducible and this
       * would be a random-number generator that occasionally fails a build.
       */
      for (let run = 0; run < 10; run += 1) {
        const once = plan(variant, mulberry32(run), 8).steps.map(s => `${s.id}@${s.level}:${s.cost}`)
        const twice = plan(variant, mulberry32(run), 8).steps.map(s => `${s.id}@${s.level}:${s.cost}`)
        expect(twice, `${variant} run ${run}`).toEqual(once)
      }
    })
  }
})

describe('the generator itself', () => {
  it('produces the same sequence for the same seed', () => {
    // Without this the reproducibility above is a claim rather than a fact.
    const a = Array.from({ length: 20 }, mulberry32(7))
    const b = Array.from({ length: 20 }, mulberry32(7))
    expect(a).toEqual(b)
  })

  it('produces different accounts for different seeds', () => {
    // A generator that ignored its seed would run the same account 60 times
    // and every assertion above would still pass.
    const a = randomise(ZERO_EFFECTIVE_DAMAGE_LEVELS, mulberry32(1))
    const b = randomise(ZERO_EFFECTIVE_DAMAGE_LEVELS, mulberry32(2))
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b))
  })

  it('reaches the values that break things', () => {
    // Zero, one, and something far past any cap — the states a uniform draw
    // would almost never visit.
    const drawn = Array.from({ length: 400 }, mulberry32(3)).map(() => 0)
    const random = mulberry32(3)
    const levels = drawn.map(() => levelFrom(random))
    expect(levels.some(level => level === 0)).toBe(true)
    expect(levels.some(level => level === 1)).toBe(true)
    expect(levels.some(level => level > 1000)).toBe(true)
  })
})
