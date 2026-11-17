import { describe, expect, it } from 'vitest'
import { sentryProtocolCardOrbFireInterval, sentryProtocolWorkshopOrbFireInterval } from '../../src/mechanics'

describe('Sentry Protocol orb intervals', () => {
  it.each([[1, 0.2], [2, 0.1], [8, 0.025]] as const)('workshop speed %i fires every %f seconds', (speed, interval) => {
    expect(sentryProtocolWorkshopOrbFireInterval(speed)).toBeCloseTo(interval, 7)
  })
  it('uses the Extra Orb speed plus its additive lab bonus', () => {
    expect(sentryProtocolCardOrbFireInterval(1, 0)).toBe(0.5)
    expect(sentryProtocolCardOrbFireInterval(1, 1)).toBe(0.25)
    expect(sentryProtocolCardOrbFireInterval(1, 3)).toBe(0.125)
  })
  it('reports zero speed as no shots', () => {
    expect(sentryProtocolWorkshopOrbFireInterval(0)).toBe(Infinity)
    expect(sentryProtocolCardOrbFireInterval(0, 0)).toBe(Infinity)
  })
  it.each([-1, NaN, Infinity])('rejects invalid speed %s', speed => {
    expect(() => sentryProtocolWorkshopOrbFireInterval(speed)).toThrow(RangeError)
    expect(() => sentryProtocolCardOrbFireInterval(speed, 0)).toThrow(RangeError)
    expect(() => sentryProtocolCardOrbFireInterval(1, speed)).toThrow(RangeError)
  })
})
