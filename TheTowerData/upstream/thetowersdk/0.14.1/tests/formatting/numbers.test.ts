import { describe, expect, it } from 'vitest'
import { formatCompact } from '../../src/formatting/tools/compute'

/**
 * The notation ladder, written out rather than derived from the formatter.
 *
 * Deriving it from the same source the formatter reads would make every case below agree with
 * whatever the formatter does, which is how the previous version of this file passed while three
 * notations could not be produced at all. This list is the claim: `K` is a thousand, `D` is 1e33,
 * `AZ` is 1e111, one letter per factor of a thousand.
 */
const LADDER = [
  'K', 'M', 'B', 'T', 'q', 'Q', 's', 'S', 'O', 'N', 'D',
  ...Array.from({ length: 26 }, (_, index) => `A${String.fromCharCode(65 + index)}`),
]

describe('compact notation matches how the game displays numbers', () => {
  /**
   * Every rung, not a handful.
   *
   * This is the case that was missing, and its absence hid the defect for as long as the file has
   * existed. The old suite checked five scattered values and one of them — `formatCompact(1e66)`
   * asserted to be `'1000AJ'` — was the bug written down as the specification. `1e66` is exactly
   * `1AK`; a coefficient of 1000 is the one thing a thousand-per-letter ladder can never need.
   *
   * The cause was `value /= 1000` walked repeatedly: by the eleventh step `1e33` has drifted to
   * `999.9999999999999`, the walk stops one notation early, and the coefficient rounds back up to
   * 1000 on the way out. So `D`, `AB`, `AI` and the rest were unreachable, and a reader saw a
   * number that looked a thousand times smaller than it was.
   */
  it('reaches every notation on the ladder', () => {
    const wrong: string[] = []

    LADDER.forEach((notation, tier) => {
      const exact = 10 ** (3 * (tier + 1))
      const got = formatCompact(exact)
      if (got !== `1${notation}`) wrong.push(`1e${3 * (tier + 1)} formatted as ${got}, want 1${notation}`)
    })

    expect(wrong, 'a notation nothing can produce is not on the ladder').toEqual([])
  })

  it('never prints a coefficient of 1000', () => {
    /*
     * The symptom, checked independently of the cause. A coefficient at or above 1000 means the
     * value belonged to the next notation up, whatever produced it.
     */
    const offenders: string[] = []

    for (let exponent = 3; exponent <= 113; exponent += 1) {
      for (const mantissa of [1, 1.5, 9.99, 9.999999]) {
        const value = mantissa * 10 ** exponent
        if (!Number.isFinite(value)) continue
        const got = formatCompact(value)
        if (got.includes('e+')) continue
        const coefficient = Number.parseFloat(got)
        if (coefficient >= 1000) offenders.push(`${mantissa}e${exponent} -> ${got}`)
      }
    }

    expect(offenders.slice(0, 10), 'the next notation up is the answer').toEqual([])
  })

  it('carries when rounding pushes the coefficient to the next notation', () => {
    /*
     * `999.9999` at two decimals rounds to `1000`, and `1000K` is wrong when `1M` is available.
     * The rounding has to happen before the notation is chosen, not after.
     */
    expect(formatCompact(999_999_999)).toBe('1B')
    expect(formatCompact(9.999999e35)).toBe('1AA')
  })

  it('formats mantissas and negatives within a notation', () => {
    expect(formatCompact(1.5e33)).toBe('1.5D')
    expect(formatCompact(2.25e39)).toBe('2.25AB')
    expect(formatCompact(9.87e111)).toBe('9.87AZ')
    expect(formatCompact(-1e33)).toBe('-1D')
    expect(formatCompact(-2.5e39)).toBe('-2.5AB')
  })

  it('uses toExponential(2) past the top of the ladder', () => {
    expect(formatCompact(1e114)).toBe('1.00e+114')
    expect(formatCompact(3e130)).toBe('3.00e+130')
    expect(formatCompact(2.997728057165945e130)).toBe('3.00e+130')
  })
})
