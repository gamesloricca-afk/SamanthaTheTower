import { describe, expect, it } from 'vitest'
import { GENERATED_CALCULATORS, GENERATED_IMPLEMENTATIONS } from '../../../src/calculators/specs.generated'

/**
 * The same own-keys rule as `data/untrusted-key-lookups.test.ts`, applied to every
 * registered calculator at once.
 *
 * These are reachable by id from tools, from the MCP surface and from generated UI, with
 * arguments that ultimately come from saves and user input. A lookup inside any of them
 * that indexes a record without checking own-keys can return an `Object.prototype` member,
 * which is a function where the signature promises data — and `?? fallback` does not catch
 * a function.
 *
 * Throwing is a valid response to nonsense and is not reported, and neither is a factory
 * that returns a function by design — the test asks whether the returned value *is* one of
 * `Object.prototype`'s own members, not merely whether it is a function, so
 * `wiki.createCurlFetch` passes on its merits rather than by being named an exception.
 */
describe('no registered calculator hands back a prototype member', () => {
  const PROTOTYPE_KEYS = ['constructor', '__proto__', 'toString', 'valueOf', 'hasOwnProperty']

  /*
   * Exactly the values a prototype-key lookup can hand back.
   *
   * `null` and `undefined` are excluded deliberately. `Object.prototype.__proto__` IS
   * `null`, so including it made every function that correctly returns `null` for an
   * unknown input look like a leak — 695 of them, none real. A `null` is the right answer
   * to a nonsense key, not a symptom.
   */
  const PROTOTYPE_MEMBERS = new Set<unknown>([
    Object.prototype,
    ...Object.getOwnPropertyNames(Object.prototype)
      .map(name => (Object.prototype as unknown as Record<string, unknown>)[name])
      .filter(value => value !== null && value !== undefined),
  ])

  const isPrototypeMember = (value: unknown) => PROTOTYPE_MEMBERS.has(value)

  /**
   * Walks the result, because a leak need not BE the return value.
   *
   * The sibling sweep in `data/` checked only the top level and passed while a lookup
   * returned a function inside a `string[]`. Anything that returns a row, a list or a
   * record can hide one the same way.
   */
  const findLeak = (value: unknown, depth = 0): boolean => {
    if (isPrototypeMember(value)) return true
    if (depth > 3) return false
    if (Array.isArray(value)) return value.some(entry => findLeak(entry, depth + 1))
    if (value && typeof value === 'object') {
      return Object.values(value).some(entry => findLeak(entry, depth + 1))
    }
    return false
  }

  /*
   * Argument names each spec declares, so the probe fills in what the impl actually reads.
   *
   * The field is `params`. An earlier version of this test read `spec.inputs`, which does
   * not exist, so every impl was called with `{}` and the sweep passed without probing
   * anything — the same "supported by the model, never set by the wiring" shape it exists
   * to catch. `covers the whole registry` below now asserts the names resolve, not just
   * that the registry is large.
   */
  const argNamesFor = (id: string): string[] => {
    const spec = GENERATED_CALCULATORS.find(entry => entry.id === id) as
      { params?: readonly { name?: string }[] } | undefined
    return (spec?.params ?? []).map(param => param.name ?? '').filter(Boolean)
  }

  it('covers the whole registry, with arguments that actually reach each impl', () => {
    expect(Object.keys(GENERATED_IMPLEMENTATIONS).length).toBeGreaterThan(1000)

    // Without this the sweep can call everything with `{}` and prove nothing.
    const withArgs = Object.keys(GENERATED_IMPLEMENTATIONS).filter(id => argNamesFor(id).length > 0)
    expect(withArgs.length, 'no spec declared any parameter names').toBeGreaterThan(1000)
  })

  it('sanity: the member set catches what a real prototype lookup returns', () => {
    // Without this the sweep below could pass because the set is empty.
    const record: Record<string, unknown> = {}
    expect(isPrototypeMember(record['constructor'])).toBe(true)
    expect(isPrototypeMember(record['toString'])).toBe(true)
    expect(isPrototypeMember('a real answer')).toBe(false)
    // The fixture's own trap: `Object.prototype.__proto__` is null, and null is an answer.
    expect(isPrototypeMember(null)).toBe(false)
  })

  /*
   * Impls that DO something rather than compute something.
   *
   * The registry includes save imports, retry-queue settlement and a wiki image fetch. An
   * earlier version of this sweep called all of them: the network one really did try to
   * fetch, and every rejection landed unhandled because a `try/catch` cannot catch an
   * async one. Fifteen errors in an otherwise green suite.
   *
   * The doctor and registry writers are the worst of them: they take a repo ROOT as an
   * argument and write files under it, so probing them with `'constructor'` created ten junk
   * directory trees in the working copy — `constructor/docs/mechanics-map/...` and friends —
   * on every test run. The sweep is supposed to find defects, not commit them.
   *
   * These are skipped for their side effects, not because they are believed safe, and the
   * list is asserted below so it cannot quietly grow into a place to hide a leak.
   */
  const SIDE_EFFECTING = /(^|\.)(execute|fetch|persist|settle|upload|post|delete|write|save|diagnose|repair|emit|compile|snapshot|record|ensure|append|create|mkdir|init)[A-Z]/

  it('skips only the side-effecting impls, and says which', () => {
    const skipped = Object.keys(GENERATED_IMPLEMENTATIONS).filter(id => SIDE_EFFECTING.test(id))
    expect(skipped.length, `skipped: ${skipped.join(', ')}`).toBeLessThan(40)
    expect(skipped.length).toBeGreaterThan(0)
  })

  it('across every registered calculator', () => {
    const leaks: string[] = []

    for (const key of PROTOTYPE_KEYS) {
    for (const [id, impl] of Object.entries(GENERATED_IMPLEMENTATIONS)) {
      if (SIDE_EFFECTING.test(id)) continue
      const names = argNamesFor(id)
      const args: Record<string, unknown> = {}
      for (const name of names) args[name] = key

      let result: unknown
      try {
        result = impl(args)
      }
      catch {
        continue // refusing nonsense is fine
      }

      /*
       * A promise cannot BE a prototype member, so there is nothing to check — but an
       * unattended rejection fails the whole run from outside any `catch`. Neutralise it.
       */
      if (result && typeof (result as { then?: unknown }).then === 'function') {
        void (result as Promise<unknown>).catch(() => {})
        continue
      }

      if (findLeak(result)) leaks.push(`${id} exposed Object.prototype.${key}`)
    }
    }

    expect(leaks.slice(0, 10), `${leaks.length} leak(s): ${leaks.slice(0, 10).join(', ')}`).toEqual([])
  }, 60_000)
})
