import { describe, expect, it } from 'vitest'
import { formatLargeNumber, formatNumberForDisplay, normalizeDecimalSeparator, parseResource } from '../../src/formatting'

/**
 * `parseResource` is what a pasted amount goes through — players copy figures straight off
 * their screen into whatever is built on this SDK.
 *
 * It used to hand back `parseFloat`'s answer whenever its own pattern missed, and
 * `parseFloat` keeps a leading number and discards the rest. So `"12abc"` parsed as `12` and
 * `"abc"` as `0`, both reported as successes. A stray character silently became a confidently
 * wrong number, and garbage became a zero no caller could tell from a real one.
 */
describe('parseResource', () => {
  const ACCEPTED: Array<[string, number]> = [
    ['950', 950],
    ['0', 0],
    ['0.5', 0.5],
    ['1k', 1_000],
    ['2.5M', 2_500_000],
    ['10B', 1e10],
    ['1.4Q', 1.4e18],
    ['  7.7s  ', 7.7e21],
    ['3.3D', 3.3e33],
    ['1.4e21', 1.4e21],
  ]

  it.each(ACCEPTED)('accepts %s', (input, expected) => {
    const parsed = parseResource(input)
    expect(parsed.error, `${input} was rejected`).toBeUndefined()
    expect(parsed.value).toBeCloseTo(expected, -Math.max(0, Math.floor(Math.log10(expected || 1)) - 6))
  })

  const REJECTED = ['12abc', 'abc', 'not a number', '1.2.3', '12 apples', 'K', '', '   ', '-5']

  it.each(REJECTED)('rejects %j instead of guessing a number', input => {
    const parsed = parseResource(input)
    expect(parsed.error, `${JSON.stringify(input)} was accepted as ${parsed.value}`).toBe(true)
    expect(parsed.value).toBeUndefined()
  })

  it('never reports a partial parse as a success', () => {
    // The specific regression: a leading number with trailing text.
    for (const input of ['12abc', '3.5xyz', '1kk', '100 coins']) {
      expect(parseResource(input).value, input).toBeUndefined()
    }
  })

  it('round-trips everything formatLargeNumber produces', () => {
    // If the two disagree, a player copying a number the tool printed cannot paste it back.
    const mismatches: string[] = []
    for (const value of [950, 12_500, 4.2e6, 8.9e9, 1.4e15, 7.7e21, 5.5e24, 6.6e27, 3.3e33]) {
      const text = formatLargeNumber(value)
      const back = parseResource(text).value
      if (back === undefined || Math.abs(back - value) / value > 0.01) {
        mismatches.push(`${value} -> "${text}" -> ${back}`)
      }
    }
    expect(mismatches, mismatches.join('\n')).toEqual([])
  })

  it('distinguishes a real zero from unparseable text', () => {
    expect(parseResource('0')).toEqual({ value: 0 })
    expect(parseResource('abc')).toEqual({ error: true })
  })
})

describe('separator policy: a period is the decimal point, a comma groups thousands', () => {
  it('round-trips what the display side actually renders', () => {
    /*
     * The display side has always grouped with commas; the parse side used to turn every
     * comma into a period. So a number this package printed did not survive being pasted
     * back into it — "1,234,567" read as 1.234567, a factor of a million, silently.
     */
    const mismatches: string[] = []
    for (const value of [950, 1234.5, 1_234_567, 1e6, 12_345_678]) {
      const shown = formatNumberForDisplay(value, 'Period (.)', {
        mode: 'grouped',
        smallNumberMaxFractionDigits: 2,
      })
      const back = parseResource(String(shown)).value
      if (back !== value) mismatches.push(`${value} -> "${shown}" -> ${back}`)
    }
    expect(mismatches, mismatches.join('; ')).toEqual([])
  })

  it('reads grouped input', () => {
    expect(parseResource('1,234')).toEqual({ value: 1234 })
    expect(parseResource('12,345,678')).toEqual({ value: 12345678 })
    expect(parseResource('1,234.5')).toEqual({ value: 1234.5 })
  })

  it('refuses a comma that groups nothing rather than guessing', () => {
    // 1.5 (European decimal) and 15 (stripped group) are both defensible, so neither is
    // returned. A wrong number presented as right is worse than a rejection.
    for (const input of ['1,5', '1,23', '1,2345']) {
      expect(parseResource(input).error, input).toBe(true)
    }
  })

  it('mirrors cleanly for a caller whose user chose Comma', () => {
    expect(normalizeDecimalSeparator('1.234.567,5', 'Comma (,)')).toBe('1234567.5')
    expect(normalizeDecimalSeparator('1,5', 'Comma (,)')).toBe('1.5')
  })
})

describe('the comma convention, for players who set it', () => {
  const comma = (raw: string) => parseResource(raw, 'Comma (,)')

  it('reads a comma as the decimal point and a period as the group separator', () => {
    expect(comma('1,5')).toEqual({ value: 1.5 })
    expect(comma('1.234')).toEqual({ value: 1234 })
    expect(comma('1.234.567,5')).toEqual({ value: 1234567.5 })
  })

  it('normalises exactly once', () => {
    /*
     * `standardizeNotation` normalises internally, so a caller that normalised first ran
     * the grouping rules twice: "1,234" — one point two three four — came back as 1234.
     * A thousandfold error, in the one function whose job is to prevent it.
     */
    expect(comma('1,234')).toEqual({ value: 1.234 })
  })

  it('keeps the suffix ladder working', () => {
    expect(comma('7,7s')).toEqual({ value: 7.7e21 })
    expect(comma('950')).toEqual({ value: 950 })
  })

  it('is the mirror of the period convention, not a different parser', () => {
    // The same text means opposite things under the two conventions, and both are right.
    expect(parseResource('1,234', 'Period (.)')).toEqual({ value: 1234 })
    expect(parseResource('1,234', 'Comma (,)')).toEqual({ value: 1.234 })
    expect(parseResource('1.234', 'Period (.)')).toEqual({ value: 1.234 })
    expect(parseResource('1.234', 'Comma (,)')).toEqual({ value: 1234 })
  })

  it('still refuses text it cannot read', () => {
    for (const input of ['12abc', 'abc', '']) expect(comma(input).error, input).toBe(true)
  })
})
