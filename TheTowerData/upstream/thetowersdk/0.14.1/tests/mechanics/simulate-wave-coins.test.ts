import { describe, expect, it } from 'vitest'
import { buildResourceDropsCoinMultipliers } from '../../src/mechanics/resource-drops/coin-simulation'
import { simulateWaveCoinRows } from '../../src/mechanics/resource-drops/simulate-wave-coins'
import { accumulateWaveCoin } from '../../src/mechanics/resource-drops/simulate-wave-coins'
import { baseCoinInput } from './resource-drops-coin-simulation.test'

function coinRows(input: Parameters<typeof simulateWaveCoinRows>[0], maxRows?: number) {
  const mult = buildResourceDropsCoinMultipliers(input).coinsPerWaveMult
  return simulateWaveCoinRows(input, { maxRows, coinsPerWaveMult: mult })
}

describe('simulate-wave-coins', () => {
  it('returns rows up to maxRows', () => {
    const rows = coinRows(baseCoinInput({ targetWave: 10 }), 4)
    expect(rows).toHaveLength(4)
    expect(rows[0]?.expectedKills).toBeGreaterThan(0)
  })

  it('zeros intro sprint waves', () => {
    const rows = coinRows(baseCoinInput({ targetWave: 5, introSprintZeroCoinWaveCap: 3 }), 5)
    expect(rows[2]?.rawKillCoins).toBe(0)
    expect(rows[3]?.rawKillCoins).toBeGreaterThan(0)
  })

  it('useSpawnGates additive probe lowers expected kills vs calibrated account yield', () => {
    const input = baseCoinInput({ tier: 1, targetWave: 100, waveAcceleratorMasteryLevel: 9, useAccountSpawnYield: true })
    const calibrated = accumulateWaveCoin(input, { maxRows: 100, coinsPerWaveMult: 1 }).expectedKills
    const modeled = accumulateWaveCoin(
      { ...input, useSpawnGates: true, useSpawnQuantum: false },
      { maxRows: 100, coinsPerWaveMult: 1 },
    ).expectedKills
    expect(modeled).toBeLessThan(calibrated)
    expect(calibrated).toBeGreaterThan(0)
  })

  it('useSpawnGates quantum path differs from calibrated kills', () => {
    const input = baseCoinInput({ tier: 1, targetWave: 50, waveAcceleratorMasteryLevel: 9, useAccountSpawnYield: true })
    const calibrated = accumulateWaveCoin(input, { maxRows: 50, coinsPerWaveMult: 1 }).expectedKills
    const quantum = accumulateWaveCoin(
      { ...input, useSpawnGates: true },
      { maxRows: 50, coinsPerWaveMult: 1 },
    ).expectedKills
    expect(quantum).not.toBeCloseTo(calibrated, 2)
    expect(quantum).toBeGreaterThan(0)
  })


  it('moreEnemiesHeatLevel raises modeled expected kills compared with no More Enemies', () => {
    const base = baseCoinInput({
      tier: 1,
      targetWave: 50,
      waveAcceleratorMasteryLevel: 9,
      useAccountSpawnYield: true,
      useSpawnGates: true,
    })
    const without = accumulateWaveCoin(base, { maxRows: 50, coinsPerWaveMult: 1 }).expectedKills
    const withMe = accumulateWaveCoin(
      { ...base, moreEnemiesHeatLevel: 10 },
      { maxRows: 50, coinsPerWaveMult: 1 },
    ).expectedKills
    expect(withMe).toBeGreaterThan(without)
  })

  it('skipWaveCoins are positive when wave skip is active at mid wave', () => {
    const rows = coinRows(
      baseCoinInput({ tier: 20, targetWave: 50, waveSkipCardLevel: 7, waveSkipMasteryLevel: 9 }),
      50,
    )
    const mid = rows.find(r => r.wave === 50)
    expect(mid?.skipWaveCoins).toBeGreaterThan(0)
  })
})
