import { describe, expect, it } from 'vitest'
import { CALCULATOR_BUILDERS } from '../../src/builders'

describe('builder invariants', () => {
  it.each(CALCULATOR_BUILDERS.map(b => [b.id, b] as const))('%s: select option values are unique', (_id, b) => {
    for (const field of b.fields) {
      if (field.kind !== 'select') continue
      const values = (field.options ?? []).map(option => option.value)
      expect(new Set(values).size, `${b.id}.${field.key} has duplicate select values`).toBe(values.length)
    }
  })

  it.each(CALCULATOR_BUILDERS.map(b => [b.id, b] as const))('%s: normalize is idempotent', (_id, b) => {
    const once = b.normalize({} as never)
    const twice = b.normalize(once as never)
    expect(twice).toEqual(once)
  })

  it.each(CALCULATOR_BUILDERS.map(b => [b.id, b] as const))('%s: defaults survive normalize', (_id, b) => {
    expect(b.normalize(b.defaults as never)).toEqual(b.defaults)
  })

  it.each(CALCULATOR_BUILDERS.map(b => [b.id, b] as const))('%s: compute({}) === compute(defaults)', (_id, b) => {
    expect(b.compute({} as never)).toEqual(b.compute(b.defaults as never))
  })

  it.each(CALCULATOR_BUILDERS.map(b => [b.id, b] as const))('%s: no NaN anywhere in the result', (_id, b) => {
    const bad: string[] = []
    const walk = (v: unknown, path: string) => {
      if (typeof v === 'number' && !Number.isFinite(v)) bad.push(`${path}=${v}`)
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`))
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`)
    }
    walk(b.compute({} as never), 'result')
    expect(bad, bad.join(', ')).toEqual([])
  })
})

/** Every field name any calculator reads, each one a getter that throws when touched. */
function throwingGetters(): Record<string, unknown> {
  const object: Record<string, unknown> = {}
  for (const builder of CALCULATOR_BUILDERS) {
    for (const field of builder.fields) {
      /* Configurable, because several calculators share a field name and this runs over all of them. */
      Object.defineProperty(object, field.key, {
        get() { throw new Error('hostile') },
        enumerable: true,
        configurable: true,
      })
    }
  }
  return object
}

describe('builders survive hostile input', () => {
  /*
   * A form hands over whatever the user typed and whatever a restored preference held, so
   * `compute` is called with junk constantly: a cleared box, a stale key from an older
   * version, a string where a number belongs. The contract is that it never throws and
   * never returns a non-finite number — a UI that has to guard every keystroke has been
   * handed the problem back.
   *
   * Deterministic values, not a random generator, so a failure is reproducible.
   */
  const HOSTILE: unknown[] = [
    undefined, null, NaN, Infinity, -Infinity, '', '  ', 'abc', '12abc', '1e999',
    -1, -0, 0.5, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 1e308,
    true, false, [], {}, [NaN], ['x'],
    // A value whose own coercion throws: `Number(value)` calls into it, so accepting
    // unvetted input means calling code this package does not control.
    { toString() { throw new Error('hostile') } },
  ]

  /** Names a value for an error message without ever calling its own `toString`. */
  const describe_ = (value: unknown): string => {
    if (value === null) return 'null'
    if (Array.isArray(value)) return `array(${value.length})`
    const type = typeof value
    if (type === 'object') return 'object'
    if (type === 'string') return JSON.stringify(value)
    return String(value)
  }

  const findBad = (value: unknown, path: string, out: string[]) => {
    if (typeof value === 'number' && !Number.isFinite(value)) out.push(`${path}=${value}`)
    else if (Array.isArray(value)) value.forEach((v, i) => findBad(v, `${path}[${i}]`, out))
    else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) findBad(v, `${path}.${k}`, out)
    }
  }

  /**
   * The whole input, not just one field of it.
   *
   * This only ever passed hostile values as the VALUE of a well-formed object, so
   * `compute(null)` — which a JSON API, a form library and this package's own WebAssembly entry
   * all produce routinely — went untried, and every calculator threw on it. The builders
   * documentation promised the opposite: "takes anything and returns a complete, valid record.
   * Nothing throws."
   *
   * A property whose GETTER throws is also distinct from a value whose `toString` throws, which
   * was covered. Reading someone else's object means running their code, and three calculators
   * died on it.
   */
  const HOSTILE_WHOLE_INPUTS: [string, unknown][] = [
    ['null', null],
    ['a string', 'not an object'],
    ['a number', 42],
    ['an array', []],
    ['a __proto__ payload', JSON.parse('{"__proto__":{"polluted":true}}')],
    ['a constructor payload', JSON.parse('{"constructor":{"prototype":{"polluted":true}}}')],
    ['an object of throwing getters', throwingGetters()],
    ['a proxy that throws on read', new Proxy({}, {
      get() { throw new Error('hostile') },
      ownKeys: () => ['currentLevel', 'stat', 'tier', 'plasmaCannonMasteryLevel'],
      getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
    })],
    ['a null-prototype object', Object.assign(Object.create(null), { currentLevel: 3 })],
    ['a frozen object', Object.freeze({ currentLevel: 3 })],
  ]

  it.each(CALCULATOR_BUILDERS.map(b => [b.id, b] as const))('%s survives a hostile input object', (_id, builder) => {
    for (const [label, input] of HOSTILE_WHOLE_INPUTS) {
      expect(() => builder.normalize(input as never), `normalize(${label})`).not.toThrow()
      expect(() => builder.compute(input as never), `compute(${label})`).not.toThrow()
    }
  })

  it('leaves Object.prototype alone', () => {
    for (const builder of CALCULATOR_BUILDERS) {
      builder.compute(JSON.parse('{"__proto__":{"polluted":true}}'))
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it.each(CALCULATOR_BUILDERS.map(b => [b.id, b] as const))('%s', (_id, builder) => {
    const failures: string[] = []

    for (const field of builder.fields) {
      for (const hostile of HOSTILE) {
        const input = { [field.key]: hostile } as never
        // Built without coercing the value: one of the hostile inputs throws from its own
        // `toString`, and describing it must not be what fails the test.
        const label = `${field.key}=${describe_(hostile)}`

        let result: unknown
        try {
          result = builder.compute(input)
        }
        catch (error) {
          failures.push(`${label} threw ${(error as Error).message}`)
          continue
        }

        const bad: string[] = []
        findBad(result, 'result', bad)
        if (bad.length) failures.push(`${label} -> ${bad.join(', ')}`)

        // `notes` is how a builder explains a result it could not produce, so it has to
        // survive too — a UI renders it unconditionally.
        const notes = (result as { notes?: unknown }).notes
        if (!Array.isArray(notes)) failures.push(`${label} -> notes is not an array`)
        else if (notes.some(n => typeof n !== 'string')) failures.push(`${label} -> a note is not a string`)
      }
    }

    expect(failures.slice(0, 8), `${failures.length} failure(s): ${failures.slice(0, 8).join(' | ')}`).toEqual([])
  })
})
