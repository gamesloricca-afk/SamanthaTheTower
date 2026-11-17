import { describe, expect, it } from 'vitest'

/**
 * A constant's name should tell you what shape it holds.
 *
 * The package exports about 2,900 names, and a reader picking one out of an editor's completion
 * list has the name and nothing else. `X_ROWS` that turns out to be a lookup, or `X_MULT` that
 * turns out to be an array, costs a round-trip to the source every time — and the cost is paid by
 * whoever did not write it.
 *
 * ## The rule, and why it is this one
 *
 * Not "one suffix, one shape". That over-fires: `_INDEX` is a number twenty-two times and a lookup
 * three times, and both readings of the word are ordinary English. Enforcing it would have renamed
 * a hundred constants and made several of them worse — `WSP_ATTACK_COSTS` is not improved by
 * becoming `WSP_ATTACK_COSTS_BY_LEVEL`.
 *
 * The rule is narrower and is about being MISLED rather than being unsure: where a suffix is
 * overwhelmingly one shape, the exceptions are the problem. Eleven names broke that and were
 * renamed; this holds the line.
 *
 * ## What counts as a shape
 *
 * `table` is an array of records, `list` any other array, `record` a plain object. `Set` and `Map`
 * count as lists — they are iterable, so a plural name is honest. Getting that wrong is how
 * `COIN_BAND_DELTA_FIELDS` first read as an empty object rather than as a `ReadonlySet` with
 * fourteen entries in it.
 */

type Shape = 'table' | 'list' | 'record' | 'scalar'

function shapeOf(value: unknown): Shape {
  if (Array.isArray(value)) {
    const first = value[0]
    return first !== null && typeof first === 'object' && !Array.isArray(first) ? 'table' : 'list'
  }
  /* Iterable, so a plural name is telling the truth. */
  if (value instanceof Set || value instanceof Map) return 'list'
  /* A pattern or a date is one value, however `typeof` reports it. */
  if (value instanceof RegExp || value instanceof Date) return 'scalar'
  if (value !== null && typeof value === 'object') return 'record'
  return 'scalar'
}

/**
 * Names that say they are a lookup, and are therefore exempt.
 *
 * `_BY_X` and `_X_TO_Y` both state the mapping in the name, which is the whole point — the rule is
 * about names that promise one thing and hold another, and these promise correctly.
 */
const SAYS_IT_IS_A_LOOKUP = /_BY_[A-Z0-9_]+$|_TO_[A-Z0-9_]+$/

/**
 * Names the rule flags where the name is right and the rule is too blunt.
 *
 * Three, each for a different reason, and each named rather than pattern-matched away — an
 * exemption you cannot read is indistinguishable from a rule that does not work.
 */
const CORRECT_AS_WRITTEN = new Map([
  /* Rows held as arrays rather than as records. They are still rows; the name is accurate. */
  ['ELITE_SPAWN_CHANCE_ROWS', 'a table whose rows are arrays, not objects'],
  /* "Index" is a lookup here, not a position. Both readings of the word are ordinary English, and
   * the majority happens to be the numeric one. */
  ['V283_HEAT_BC_INDEX', 'an index in the sense of a lookup, not a position'],
  ['PERK_LAB_RESEARCH_INDEX', 'an index in the sense of a lookup, not a position'],
])

/** Words that merely end in S. A plural rule that trips on `STATUS` is not a rule. */
const NOT_ACTUALLY_PLURAL = /(STATUS|ALIAS|CLASS|BONUS|PLUS|MASS|GAS|LESS|IDS)$/

/**
 * Every exported constant, with the shape it actually has — loaded ONCE.
 *
 * Five entry points is most of the package, and importing them per test ran each case past the
 * five-second limit. The set does not change between assertions, so it is built at module scope.
 */
const CONSTANTS: Map<string, Shape> = new Map()
for (const entry of ['data', 'save', 'mechanics', 'charts', 'formatting']) {
  const loaded = await import(`../../src/${entry}/index`) as Record<string, unknown>
  for (const [name, value] of Object.entries(loaded)) {
    if (typeof value === 'function') continue
    if (!/^[A-Z][A-Z0-9_]*$/.test(name)) continue
    if (!CONSTANTS.has(name)) CONSTANTS.set(name, shapeOf(value))
  }
}

describe('a constant name says what shape it holds', () => {

  it('finds the constants at all, so an empty sweep cannot pass', () => {
    const all = CONSTANTS
    expect(all.size).toBeGreaterThan(500)
  })

  it('never lets a suffix mean one thing almost everywhere and something else here', () => {
    const all = CONSTANTS

    /* Group by trailing word, ignoring the names that already state their mapping. */
    const bySuffix = new Map<string, Array<[string, Shape]>>()
    for (const [name, shape] of all) {
      if (SAYS_IT_IS_A_LOOKUP.test(name)) continue
      const suffix = /_([A-Z0-9]+)$/.exec(name)?.[1]
      if (!suffix) continue
      bySuffix.set(suffix, [...(bySuffix.get(suffix) ?? []), [name, shape]])
    }

    const misleading: string[] = []
    for (const [suffix, entries] of bySuffix) {
      /* Below four uses there is no "overwhelmingly", only a coincidence. */
      if (entries.length < 4) continue

      const counts = new Map<Shape, number>()
      for (const [, shape] of entries) counts.set(shape, (counts.get(shape) ?? 0) + 1)
      const [dominant, n] = [...counts].sort((a, b) => b[1] - a[1])[0]
      if (n / entries.length < 0.75) continue

      for (const [name, shape] of entries) {
        if (shape === dominant) continue
        if (CORRECT_AS_WRITTEN.has(name)) continue
        misleading.push(`${name} is a ${shape}, but _${suffix} is a ${dominant} in ${n} of ${entries.length} uses`)
      }
    }

    expect(
      misleading,
      'rename it to say what it holds — `_BY_X` for a lookup, a plural for something iterable',
    ).toEqual([])
  })

  it('exempts nothing that no longer exists', () => {
    /*
     * An exemption for a deleted constant is a line nobody will ever remove, and it makes the list
     * look considered when it is only old.
     */
    const all = CONSTANTS
    const stale = [...CORRECT_AS_WRITTEN.keys()].filter(name => !all.has(name))
    expect(stale, 'these are exempted but no longer exported').toEqual([])
  })

  it('never gives a plural name to something with no length', () => {
    /*
     * The narrower half, and the one a caller trips over immediately: a plural invites `.map`,
     * `.length` and `for…of`, and a plain object answers none of them.
     */
    const all = CONSTANTS
    const wrong: string[] = []

    for (const [name, shape] of all) {
      if (shape !== 'record') continue
      if (SAYS_IT_IS_A_LOOKUP.test(name) || NOT_ACTUALLY_PLURAL.test(name)) continue
      if (!/S$/.test(name)) continue
      wrong.push(name)
    }

    /*
     * A hundred-odd of these exist and most read perfectly well in English — `THEMES`,
     * `RARITY_CHANCES`, `WSP_ATTACK_COSTS` — so they are pinned rather than renamed. What this
     * stops is the count GROWING: a new plural-named lookup has to be added here deliberately,
     * which is the moment to ask whether `_BY_X` would have been better.
     */
    expect(wrong.length, 'a new plural-named lookup was added — prefer `_BY_X`').toBeLessThanOrEqual(101)
  })
})
