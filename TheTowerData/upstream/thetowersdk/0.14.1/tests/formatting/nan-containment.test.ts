import { describe, expect, it } from 'vitest'
import { parseValueWithUnit, sortByUnit } from '../../src/formatting/numbers/compute'
import { coerceSaveNumber } from '../../src/save/access/values'

/**
 * NaN must not leave a parser.
 *
 * The repo's established contract is `coerceSaveNumber`: absence is `null`, and
 * a number that comes back is a number. `parseValueWithUnit` broke it — the
 * bare-number branch was `parseFloat(x) / 1000` with no guard, so any
 * unreadable string returned `{ value: NaN, unit: 'K' }`.
 *
 * That mattered most through `sortByUnit`, which subtracted two of those. A
 * comparator that returns NaN leaves `Array.prototype.sort` free to do
 * anything, and what it did was nothing — the array came back in input order.
 * `sortByUnit` is the comparator behind nine columns of the runs table, so one
 * malformed cell silently disabled sorting for an entire column while the page
 * rendered perfectly.
 */

const UNREADABLE = ['abc', '', '   ', '-', '.', ',', '$', 'xyz', 'NaN', '--5']
const READABLE: Array<[string, number]> = [
  ['1.5K', 1.5],
  ['2M', 2],
  ['1500', 1.5],
]

describe('parseValueWithUnit never returns NaN', () => {
  it.each(UNREADABLE)('%j is reported as unparsed, not as NaN', input => {
    const result = parseValueWithUnit(input)
    expect(Number.isNaN(result.value), `${input} produced NaN`).toBe(false)
    expect(Number.isFinite(result.value)).toBe(true)
    expect(result.parsed).toBe(false)
  })

  it.each(READABLE)('%j still parses to %d', (input, expected) => {
    const result = parseValueWithUnit(input)
    expect(result.value).toBeCloseTo(expected, 10)
    expect(result.parsed).toBe(true)
  })

  it('distinguishes an unreadable value from a genuine zero', () => {
    expect(parseValueWithUnit('abc')).toMatchObject({ value: 0, parsed: false })
    expect(parseValueWithUnit('0K')).toMatchObject({ value: 0, parsed: true })
  })

  it('agrees with the repo-wide contract that absence is not a number', () => {
    // coerceSaveNumber is the pattern parseValueWithUnit now follows.
    expect(coerceSaveNumber('abc')).toBeNull()
    expect(coerceSaveNumber('1.5')).toBe(1.5)
  })
})

describe('sortByUnit is a total order', () => {
  it('never returns NaN, whatever it is given', () => {
    for (const left of [...UNREADABLE, '1K', '2M']) {
      for (const right of [...UNREADABLE, '1K', '2M']) {
        expect(Number.isNaN(sortByUnit(left, right)), `${left} vs ${right}`).toBe(false)
      }
    }
  })

  it('actually sorts a list containing an unreadable value', () => {
    const sorted = ['5K', 'abc', '1K', '10K', 'xyz', '2K'].sort(sortByUnit)
    // The readable values must be in ascending order, and come first.
    expect(sorted.slice(0, 4)).toEqual(['1K', '2K', '5K', '10K'])
    expect(sorted.slice(4).sort()).toEqual(['abc', 'xyz'])
  })

  it('is antisymmetric and reflexive on readable values', () => {
    // `|| 0` normalises negative zero: Math.sign(0) is +0 and -Math.sign(0) is
    // -0, which Object.is (and so toBe) treats as different numbers.
    const sign = (n: number): number => Math.sign(n) || 0
    const values = ['1K', '2K', '1M', '3.5K']
    for (const left of values) {
      expect(sign(sortByUnit(left, left))).toBe(0)
      for (const right of values) {
        expect(sign(sortByUnit(left, right))).toBe(-sign(sortByUnit(right, left)) || 0)
      }
    }
  })

  it('orders across units, not just within one', () => {
    expect(['1M', '900K', '2K'].sort(sortByUnit)).toEqual(['2K', '900K', '1M'])
  })
})
