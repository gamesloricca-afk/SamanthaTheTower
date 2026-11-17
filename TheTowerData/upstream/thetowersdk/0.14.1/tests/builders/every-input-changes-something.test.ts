import { describe, expect, it } from 'vitest'
import { CALCULATOR_BUILDERS } from '../../src/builders'

/**
 * Every declared input has to be able to change the answer.
 *
 * This is the defect this codebase produces more than any other: a control the model supports,
 * that the wiring never passes, that nothing reports. It does not look like a bug — the page
 * renders, the number is plausible, and the only symptom is that moving a slider does nothing.
 *
 * The builders declare their own fields, so a field nothing reads is worse here than in a page:
 * every form, bot command and generated UI built on this package draws that control.
 *
 * Two traps in writing this check, both hit on the way:
 *
 * - Moving one field at a time reports fourteen false positives. Most of the damage-reduction
 *   inputs are gated: `chronoReductionPercent` does nothing until `useChronoField` is on, and
 *   `useChronoField` does nothing while the percentage is zero. Neither is dead; each is half of
 *   a pair, and a probe that moves one at a time cannot see that.
 * - A field can matter without changing the SHAPE of the result, so the comparison has to be over
 *   the whole value rather than a summary of it.
 */
describe('no calculator declares an input it does not read', () => {
  it('has calculators to check', () => {
    expect(CALCULATOR_BUILDERS.length).toBeGreaterThan(10)
  })

  it('changes its result for every field, given the gates that field needs', () => {
    const dead: string[] = []

    for (const builder of CALCULATOR_BUILDERS) {
      const defaults = builder.defaults as Record<string, unknown>
      const compute = (input: Record<string, unknown>) =>
        JSON.stringify((builder as { compute: (value: unknown) => unknown }).compute(input))

      /*
       * A baseline with everything switched on and every number meaningfully non-zero.
       *
       * Opening the boolean gates alone is not enough: `useChronoField` still changes nothing
       * while `chronoReductionPercent` is 0, and `dissonance.boost`'s type and echo do nothing
       * until some tier has a personal best. Ten of the eleven fields this reported at that stage
       * were live and merely waiting on a second input.
       */
      const gatesOpen: Record<string, unknown> = { ...defaults }
      for (const field of builder.fields) {
        if (field.kind === 'boolean') gatesOpen[field.key] = true
        else if (field.kind === 'number') {
          const low = field.min ?? 0
          const high = field.max ?? 40
          gatesOpen[field.key] = Math.min(high, Math.max(low, Math.round((low + high) / 2) || 10))
        }
        else if (field.kind === 'number-list') {
          gatesOpen[field.key] = Array.from({ length: 24 }, () => 4000)
        }
      }

      for (const field of builder.fields) {
        const candidates: unknown[] = field.kind === 'select'
          ? (field.options ?? []).map(option => option.value)
          : field.kind === 'boolean'
            ? [true, false]
            : field.kind === 'number-list'
              ? [Array.from({ length: 24 }, () => 5000), Array.from({ length: 24 }, () => 0)]
              : [field.min ?? 0, field.max ?? 60, 1, 13]

        /*
         * From both baselines: with gates as they ship, and with every gate open. A field only
         * counts as dead when neither baseline moves for any value it can take.
         */
        const moved = [defaults, gatesOpen].some((baseInput) => {
          const before = compute(baseInput)
          return candidates.some((value) => {
            try {
              return compute({ ...baseInput, [field.key]: value }) !== before
            } catch {
              /* Throwing is a different defect, and `invariants.test.ts` owns it. */
              return true
            }
          })
        })

        if (!moved) dead.push(`${builder.id}.${field.key} (${field.kind})`)
      }
    }

    expect(
      dead,
      'These are declared, drawn by every UI built on this package, and read by nothing.',
    ).toEqual([])
  })
})
