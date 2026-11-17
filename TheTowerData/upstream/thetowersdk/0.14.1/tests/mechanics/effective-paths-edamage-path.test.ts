import { describe, expect, it } from 'vitest'
import { DAMAGE_PLAN_VARIANTS, planEffectiveDamagePath } from '../../src/mechanics/effective-paths/edamage-plan'
import { currentDamageConfig as configFromSheet, currentDamageLevels as levelsFromSheet } from './helpers/effective-paths-current-damage-sheet'
import fixture from '../../fixtures/mechanics/effective-paths-edamage-v5.11.08.10.fixtures.json'

/**
 * The eDamage path itself, against the one the sheet plans.
 *
 * Everything else checks a *value*: this account's effective damage, or what it
 * becomes if you buy one more level of something. None of that proves the
 * planner picks the same upgrades in the same order — two models can agree on
 * every number and still rank them differently, and the ranking is the product.
 *
 * The fixture captures forty steps from an owned current workbook copy, with
 * AG21=100 and P3=DO (duration only), for the same account as the compute test.
 */

interface SheetStep {
  step: number
  name: string
  level: number
  cost: number
  duration: string
  roi: number
  eDamage: number
}

const sheet = fixture.baseline as unknown as {
  runType: string
  startingEffectiveDamage: number
  steps: SheetStep[]
}

/**
 * How far in to compare.
 *
 * The tail of a hundred-step path is a long run of the same two labs, so the
 * interesting ordering is all near the front — and a shorter plan keeps the
 * test honest about what it actually proves.
 */
const COMPARED = 40

const plan = planEffectiveDamagePath({
  config: configFromSheet(),
  levels: levelsFromSheet(),
  variant: 'lab-time',
  steps: COMPARED,
})

describe('the path the sheet plans', () => {
  it('starts from the account the compute fixture describes', () => {
    expect(sheet.steps.length).toBeGreaterThanOrEqual(COMPARED)
    expect(plan.issues).toEqual([])
    const relative = Math.abs(plan.startingEffectiveDamage - sheet.startingEffectiveDamage)
      / sheet.startingEffectiveDamage
    expect(relative).toBeLessThan(1e-9)
  })

  it('buys the same upgrades in the same order', () => {
    // The comparison that matters, as one list rather than step by step so a
    // divergence shows where the two paths part company.
    const mine = plan.steps.map(step => `${step.name} L${step.level}`)
    const theirs = sheet.steps.slice(0, COMPARED).map(step => `${step.name} L${step.level}`)
    expect(mine).toEqual(theirs)
  })

  for (const [index, step] of sheet.steps.slice(0, COMPARED).entries()) {
    it(`step ${step.step} — ${step.name} to level ${step.level}`, () => {
      const mine = plan.steps[index]
      expect(mine.name).toBe(step.name)
      expect(mine.level).toBe(step.level)

      const relative = Math.abs(mine.value - step.eDamage) / step.eDamage
      expect(relative, `${step.name}: got ${mine.value}, sheet says ${step.eDamage}`)
        .toBeLessThan(1e-9)
    })
  }

  it('never goes backwards', () => {
    for (const [index, step] of plan.steps.entries()) {
      if (index === 0) continue
      expect(step.value, `step ${index + 1}`).toBeGreaterThanOrEqual(plan.steps[index - 1].value)
    }
  })

  it('ends where the sheet ends', () => {
    const last = sheet.steps[COMPARED - 1]
    const relative = Math.abs(plan.finalEffectiveDamage - last.eDamage) / last.eDamage
    expect(relative).toBeLessThan(1e-9)
  })
})

describe('a variant it does not have', () => {
  const planWith = (variant: string) => planEffectiveDamagePath({
    config: configFromSheet(), levels: levelsFromSheet(), variant: variant as never, steps: 5,
  })

  it('says so instead of returning an empty path', () => {
    /*
     * `lab` is a band and `lab-time` is a variant. Passing the band matched no
     * band's variant list, so every candidate was skipped and the result was a
     * path with no steps, no exclusions and no issues — which reads exactly
     * like a player who has bought everything.
     *
     * The types catch it wherever the argument is typed; this is for the calls
     * where it is not, which is every test fixture and every stored setting
     * read back as a string.
     */
    expect(() => planWith('lab')).toThrow(/unknown damage path variant "lab"/)
  })

  it('names the variants it does have', () => {
    // So the message is actionable rather than just a rejection.
    expect(() => planWith('nonsense')).toThrow(/lab-time, lab-coins, farm-time, stone, coin, keys/)
  })

  for (const variant of DAMAGE_PLAN_VARIANTS) {
    it(`still accepts ${variant}`, () => {
      expect(() => planWith(variant)).not.toThrow()
    })
  }
})
