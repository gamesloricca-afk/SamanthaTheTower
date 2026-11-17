/**
 * `UnityRandom` checked against committed reference vectors.
 *
 * `unity-random.vectors.json` pins seeding, floating-point output, and range behavior
 * for Unity 6000.3.15f1 and game v29.0.0/v29.0.1. Fixed expectations catch changes
 * that a same-seed reproducibility assertion cannot detect.
 *
 * Each block below fails on the pre-2026-09-01 implementation. That is deliberate — four
 * separate defects lived here, and none of them broke a bound, so nothing caught them:
 *
 *   seeding      float64 lost the low bits of `s * 0x8f371e7d`, wrong for 99.5% of seeds,
 *                and the constants were invented rather than Unity's chained MT19937.
 *   value        31 bits over 2^31 and half-open, where Unity uses 23 bits scaled by
 *                0x34000001 and CAN return exactly 1.0.
 *   rangeInt     `floor(value() * n)` instead of a modulus.
 *   rangeFloat   did not exist.
 */
import { describe, expect, it } from 'vitest'

import { initUnityRandom, UnityRandom } from '../../src/mechanics/primitives/unity-random'
import { type UnityRandomState } from '../../src/mechanics/primitives/types'
import vectors from './unity-random.vectors.json'

const asArray = (s: UnityRandomState) => [s.s0, s.s1, s.s2, s.s3]

describe('initUnityRandom', () => {
  it('matches Unity InitState for every reference seed', () => {
    for (const { seed, state } of vectors.seeds) {
      expect(asArray(initUnityRandom(seed)), `seed ${seed}`).toEqual(state)
    }
  })

  it('keeps x as the seed, with no non-zero fallback for 0', () => {
    // An all-zero state is absorbing for xorshift, so substituting a "safe" seed looks
    // defensive. Unity does not do it, and doing it changes every draw for seed 0.
    expect(initUnityRandom(0).s0).toBe(0)
  })

  it('does not lose the low bits of the seeding multiply', () => {
    // 0xDEADBEEF * 1812433253 is far past 2^53, so a float64 multiply drops low bits
    // before the int32 truncation. Math.imul is exact.
    const exact = Number((BigInt(0xdeadbeef) * 1_812_433_253n + 1n) & 0xffffffffn)
    const asInt32 = exact > 0x7fffffff ? exact - 0x1_0000_0000 : exact
    expect(initUnityRandom(0xdeadbeef).s1).toBe(asInt32)
  })
})

describe('UnityRandom streams', () => {
  for (const stream of vectors.streams) {
    describe(`seed ${stream.seed}`, () => {
      const fresh = () => UnityRandom.fromSeed(stream.seed)
      const take = <T,>(n: number, f: (r: UnityRandom) => T): T[] => {
        const r = fresh()
        return Array.from({ length: n }, () => f(r))
      }

      it('nextUint matches the engine step', () => {
        expect(take(stream.nextUint.length, r => r.nextUint())).toEqual(stream.nextUint)
      })

      it('value matches Random.value bit for bit', () => {
        expect(take(stream.value.length, r => r.value())).toEqual(stream.value)
      })

      it('rangeFloat matches Range(float, float)', () => {
        expect(take(stream.rangeFloat.length, r => r.rangeFloat(0, 100)))
          .toEqual(stream.rangeFloat)
        expect(take(stream.rangeFloatNeg.length, r => r.rangeFloat(-3.5, 7.25)))
          .toEqual(stream.rangeFloatNeg)
      })

      it('rangeInt matches Range(int, int)', () => {
        expect(take(stream.rangeInt_0_10.length, r => r.rangeInt(0, 10)))
          .toEqual(stream.rangeInt_0_10)
        expect(take(stream.rangeInt_neg.length, r => r.rangeInt(-50, 50)))
          .toEqual(stream.rangeInt_neg)
      })

      it('rangeInt handles an inverted range the way Unity does', () => {
        // max < min divides by a negative. JS and C# both take the remainder's sign from
        // the dividend, so this needs no correction — but a port to a language that does
        // not (Python) returns a value outside the range entirely.
        expect(take(stream.rangeInt_inverted_10_4.length, r => r.rangeInt(10, 4)))
          .toEqual(stream.rangeInt_inverted_10_4)
      })
    })
  }
})

describe('value() range', () => {
  it('can return exactly 1.0', () => {
    // The whole reason Unity scales by 0x34000001 rather than 2^-23. The old
    // implementation could not produce this, and no bounds check would ever notice.
    const r = UnityRandom.fromSeed(1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(r as any).nextUint = () => 0x7fffff
    expect(r.value()).toBe(vectors.maxMantissaValue)
    expect(vectors.maxMantissaValue).toBe(1)
  })

  it('stays within [0, 1] across many seeds', () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const v = UnityRandom.fromSeed(seed).value()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
})

describe('pickIndex', () => {
  it('never returns the length itself', () => {
    // The old `floor(value() * n)` form returns n when value() is 1.0 — an out-of-range
    // index that the old half-open value() happened to hide. The two defects masked each
    // other, so fixing only one would have introduced the bug the other was covering.
    for (let seed = 0; seed < 2000; seed += 1) {
      const index = UnityRandom.fromSeed(seed).pickIndex(7)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(7)
    }
  })

  it('returns 0 for a non-positive length', () => {
    expect(UnityRandom.fromSeed(3).pickIndex(0)).toBe(0)
    expect(UnityRandom.fromSeed(3).pickIndex(-2)).toBe(0)
  })
})
