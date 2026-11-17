import { describe, expect, it } from 'vitest'
import * as data from '../../src/data'

/**
 * Names reach this package from saves, from the community sheet, from URLs and from tool
 * input — none of which this package controls. Plain `record[key]` resolves `constructor`,
 * `toString`, `valueOf` and `__proto__` to `Object.prototype` members, so a lookup that
 * indexes without checking own-keys can hand back a **function** from a signature that
 * promises a string, or an empty object from one that promises a table or `null`.
 *
 * Two live examples, both fixed:
 *   - `canonicalBattleConditionName('constructor')` returned `function Object()`.
 *   - `getWorkshopCostLevelsByKey('__proto__')` returned `{}` — an empty cost curve, which
 *     prices every level at zero and reads as a real answer rather than a missing one.
 *
 * Use `Object.prototype.hasOwnProperty.call`, not `Object.hasOwn` — this package targets
 * ES2020 and `Object.hasOwn` is ES2022.
 */
const PROTOTYPE_KEYS = ['constructor', '__proto__', 'toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf']

/** Values a prototype-key lookup can produce. `null` is excluded — it is a real answer. */
const PROTOTYPE_MEMBERS = new Set<unknown>([
  Object.prototype,
  ...Object.getOwnPropertyNames(Object.prototype)
    .map(key => (Object.prototype as unknown as Record<string, unknown>)[key])
    .filter(value => value !== null && value !== undefined),
])

/** Records every prototype member found anywhere in `value`, however deeply nested. */
function findLeaks(value: unknown, path: string, out: string[], depth = 0): void {
  if (depth > 4 || out.length > 20) return
  if (PROTOTYPE_MEMBERS.has(value)) {
    out.push(`${path} -> ${typeof value === 'function' ? 'function' : 'Object.prototype'}`)
    return
  }
  if (Array.isArray(value)) {
    value.forEach((entry, i) => findLeaks(entry, `${path}[${i}]`, out, depth + 1))
  }
  else if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) findLeaks(entry, `${path}.${key}`, out, depth + 1)
  }
}

/**
 * Every exported lookup, at any arity.
 *
 * An earlier version of this only checked one-argument functions, which quietly excluded
 * every lookup that takes a name plus something else — a stat and a tier, a module type and
 * a rarity. The restriction was invisible in a passing result, which is the same shape of
 * gap the sweep exists to find, so arity is no longer a filter: each parameter is filled
 * with the prototype key.
 */
const LOOKUPS = Object.entries(data as Record<string, unknown>)
  .filter(([name, value]) =>
    typeof value === 'function'
    && (value as (...a: unknown[]) => unknown).length >= 1
    // No name filter. `isLabUnlockedAt` and `labLevelTableLookupNames` both leaked while a
    // prefix list was in place, precisely because neither starts with `find`/`get`. A
    // curated list of what to check is a list of what not to check.
    && !/^(create|make)/.test(name))

describe('lookups keyed by an untrusted name', () => {
  it('there are lookups to check, including multi-argument ones', () => {
    // A real floor, not a token one: the export surface is large, and a sweep that
    // silently narrowed to a handful would still report green.
    expect(LOOKUPS.length).toBeGreaterThan(100)
    // Without this the arity widening could silently revert and still look healthy.
    const multiArg = LOOKUPS.filter(([, fn]) => (fn as (...a: unknown[]) => unknown).length > 1)
    expect(multiArg.length, 'no multi-argument lookup is being probed').toBeGreaterThan(3)
  })

  it.each(PROTOTYPE_KEYS)('no exported lookup returns a prototype member for %j', key => {
    const leaks: string[] = []
    for (const [name, fn] of LOOKUPS) {
      const arity = (fn as (...a: unknown[]) => unknown).length
      const args = Array.from({ length: arity }, () => key)

      let result: unknown
      try {
        result = (fn as (...a: unknown[]) => unknown)(...args)
      }
      catch {
        // Throwing on a nonsense key is a valid answer; returning one is not.
        continue
      }
      // Walk the result. A leak does not have to BE the return value: the first version of
      // this test checked only the top level and passed with `labLevelTableLookupNames`
      // returning `[slug, Object]` — a function sitting inside a `string[]`. Planting that
      // fault back is what exposed the gap; the check now looks inside.
      findLeaks(result, name, leaks)
    }
    expect(leaks, leaks.join('; ')).toEqual([])
  })

  it('the two known cases answer honestly', () => {
    // Named directly so the generic sweep above cannot go quietly vacuous.
    expect(data.canonicalBattleConditionName('constructor')).toBe('constructor')
    expect(data.getWorkshopCostLevelsByKey('__proto__')).toBeNull()

    // And still work for real input.
    expect(data.canonicalBattleConditionName('Boss Ultimate')).toBe("Boss's Ultimate")
    expect(data.getWorkshopCostLevelsByKey('WSP_ATTACK_SPEED')).toBeTruthy()
  })
})
