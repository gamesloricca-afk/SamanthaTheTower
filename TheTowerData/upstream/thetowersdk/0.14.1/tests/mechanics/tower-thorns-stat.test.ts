import { describe, expect, it } from 'vitest'
import { towerThornsFraction } from '../../src/mechanics/combat/thorns'

describe('tower thorn stat source ownership', () => {
  it('multiplies relic and Vault after the workshop-plus-module sum exactly once', () => {
    expect(towerThornsFraction(0.99, 0.04, 0.14, 0.25)).toBeCloseTo(1.46775, 14)
  })

  it('keeps omitted optional bonuses neutral and permits more than 100% thorns', () => {
    expect(towerThornsFraction(0.99, 0.04)).toBeCloseTo(1.03, 14)
    expect(towerThornsFraction(0, 0)).toBe(0)
    expect(towerThornsFraction(0.99, 0.04, 0, 0)).toBeCloseTo(1.03, 14)
  })

  it('refuses each invalid input rather than manufacturing a usable thorn percentage', () => {
    for (const invalid of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      for (let index = 0; index < 4; index++) {
        const inputs: [number, number, number, number] = [0.99, 0.04, 0.14, 0.25]
        inputs[index] = invalid
        expect(() => towerThornsFraction(...inputs)).toThrow('THORNS_STAT_FINITE_NONNEGATIVE_REQUIRED')
      }
    }
  })

  it('refuses overflow from finite inputs', () => {
    expect(() => towerThornsFraction(Number.MAX_VALUE, Number.MAX_VALUE))
      .toThrow('THORNS_STAT_OVERFLOW')
  })
})
