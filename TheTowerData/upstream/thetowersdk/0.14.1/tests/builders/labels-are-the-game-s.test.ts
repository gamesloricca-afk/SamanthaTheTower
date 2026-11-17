import { describe, expect, it } from 'vitest'
import { CALCULATOR_BUILDERS } from '../../src/builders'

/**
 * Every control a player sees is named the way the game and the community name it.
 *
 * The builders declare their own fields, so whatever is written here is what a form, a bot
 * command and the documentation site all render. That made a private naming habit public: fields
 * were labelled `Cost curve` with options reading `WSP_SUPER_CRIT_MULTI`, and one calculator
 * asked for an "Enemy factor" and a "Module benefit" — the parameters of a formula, not anything
 * a player can read off their screen.
 *
 * None of it failed a test. Each calculator computed the right number and rendered perfectly,
 * and the only symptom was that nobody could tell what to type into it.
 */
describe('calculator fields are named the way players name them', () => {
  const fields = CALCULATOR_BUILDERS.flatMap(builder =>
    builder.fields.map(field => ({ builder: builder.id, ...field })),
  )

  it('never shows an internal identifier as a label or an option', () => {
    /* SCREAMING_SNAKE, camelCase and dotted keys are all identifiers escaping into the UI. */
    const looksInternal = (text: string) =>
      /^[A-Z][A-Z0-9_]{2,}$/.test(text) || /^[a-z]+[A-Z]/.test(text) || /^[a-z]+\.[a-z]/.test(text)

    const leaked = fields.flatMap(field => {
      const found: string[] = []
      if (looksInternal(field.label)) found.push(`${field.builder}.${field.key}: "${field.label}"`)
      for (const option of field.options ?? []) {
        if (looksInternal(option.label)) {
          found.push(`${field.builder}.${field.key} option: "${option.label}"`)
        }
      }
      return found
    })

    expect(leaked).toEqual([])
  })

  it('starts every label with a capital, the way the game titles its own controls', () => {
    const lowercase = fields
      .filter(field => /^[a-z]/.test(field.label))
      .map(field => `${field.builder}.${field.key}: "${field.label}"`)

    expect(lowercase).toEqual([])
  })

  it('marks a percentage as a percentage, so nobody types 0.5 for half', () => {
    /*
     * A field named `somethingPercent` that does not say so is the ambiguity that makes a
     * calculator wrong rather than confusing: 50 and 0.5 are both plausible readings of "Discount".
     */
    const unmarked = fields
      .filter(field => /Percent$/.test(field.key) && field.kind === 'number')
      .filter(field => !/%|\bpercent\b/i.test(field.label))
      .map(field => `${field.builder}.${field.key}: "${field.label}"`)

    expect(unmarked).toEqual([])
  })

  it('marks a duration in seconds as seconds', () => {
    const unmarked = fields
      .filter(field => /Seconds$/.test(field.key) && field.kind === 'number')
      .filter(field => !/\(s\)|second/i.test(field.label))
      .map(field => `${field.builder}.${field.key}: "${field.label}"`)

    expect(unmarked).toEqual([])
  })

  it('uses one spelling of the level fields every calculator shares', () => {
    /* "Current level" in one calculator and "Current Level" in the next reads as two things. */
    const shared = new Map([
      ['currentLevel', 'Current Level'],
      ['targetLevel', 'Target Level'],
    ])

    const inconsistent = fields
      .filter(field => shared.has(field.key) && field.label !== shared.get(field.key))
      .map(field => `${field.builder}.${field.key}: "${field.label}" (expected "${shared.get(field.key)}")`)

    expect(inconsistent).toEqual([])
  })
})
