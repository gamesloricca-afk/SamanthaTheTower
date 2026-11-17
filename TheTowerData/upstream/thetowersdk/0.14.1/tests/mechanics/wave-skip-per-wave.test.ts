import { describe, expect, it } from 'vitest'
import { waveSkipExpectedSkipsPerProc } from '../../src/mechanics/enemies/drops-simulation'
import {
  waveSkipChainIncomeFactor,
  waveSkipIncomeEv,
  waveSkipSpawnFraction,
} from '../../src/mechanics/resource-drops/wave-skip-per-wave'

describe('wave-skip-per-wave', () => {
  it('spawn fraction is 1 when skip chance is zero', () => {
    expect(waveSkipSpawnFraction(0, waveSkipExpectedSkipsPerProc(9))).toBe(1)
  })

  it('spawn fraction drops when expected skips per proc rises', () => {
    const shallow = waveSkipSpawnFraction(0.19, waveSkipExpectedSkipsPerProc(0))
    const deep = waveSkipSpawnFraction(0.19, waveSkipExpectedSkipsPerProc(9))
    expect(deep).toBeLessThan(shallow)
    expect(deep).toBeGreaterThan(0)
    expect(deep).toBeLessThan(1)
  })

  it('chain income factor exceeds single 1.1 when extra skips exist', () => {
    expect(waveSkipChainIncomeFactor(1)).toBe(0)
    expect(waveSkipChainIncomeFactor(2)).toBeCloseTo(1.1, 6)
    expect(waveSkipChainIncomeFactor(waveSkipExpectedSkipsPerProc(9))).toBeGreaterThan(1.1)
  })

  it('wave skip income EV exceeds linear-only at high mastery depth', () => {
    const prevTotal = 1000
    const anchor = 800
    const skipChance = 0.19
    const expectedSkips = waveSkipExpectedSkipsPerProc(9)
    const spawnFraction = waveSkipSpawnFraction(skipChance, expectedSkips)
    const compound = waveSkipIncomeEv(prevTotal, anchor, skipChance, expectedSkips, spawnFraction)
    const linearOnly = (1 - spawnFraction) * 1.1 * prevTotal
    expect(compound).toBeGreaterThan(linearOnly)
  })

  it('returns zero skip income when spawn fraction is 1', () => {
    expect(waveSkipIncomeEv(1000, 800, 0, 2.85, 1)).toBe(0)
  })
})
