import { describe, expect, it } from 'vitest'
import {
  foldWaveCoinRows,
  foldWaveEconRows,
  simulateWaveCoinTotals,
  simulateWaveEconTotals,
} from '../../src/mechanics/resource-drops/accumulate-wave-econ'
import { buildResourceDropsCoinMultipliers } from '../../src/mechanics/resource-drops/coin-simulation'
import { simulateWaveCoinRows } from '../../src/mechanics/resource-drops/simulate-wave-coins'
import { simulateWaveEconRows } from '../../src/mechanics/resource-drops/simulate-wave-econ'
import { baseCoinInput } from './resource-drops-coin-simulation.test'

describe('accumulate-wave-econ', () => {
  it('foldWaveEconRows matches manual sum', () => {
    const rows = simulateWaveEconRows(baseCoinInput({ tier: 20, targetWave: 50 }), { maxRows: 50 })
    const folded = foldWaveEconRows(rows)
    expect(folded.expectedKills).toBeCloseTo(
      rows.reduce((sum, row) => sum + row.expectedKills, 0),
      6,
    )
    expect(folded.cells).toBeCloseTo(
      rows.reduce((sum, row) => sum + row.cells, 0),
      6,
    )
    expect(folded.skipCells).toBeCloseTo(
      rows.reduce((sum, row) => sum + row.skipCells, 0),
      6,
    )
  })

  it('simulateWaveEconTotals equals fold of rows at high wave count', () => {
    const input = baseCoinInput({ tier: 20, targetWave: 5000, waveSkipCardLevel: 7, waveSkipMasteryLevel: 9 })
    const totals = simulateWaveEconTotals(input, { maxRows: 5000 })
    const folded = foldWaveEconRows(simulateWaveEconRows(input, { maxRows: 5000 }))
    expect(totals.cells).toBeCloseTo(folded.cells, 4)
    expect(totals.expectedKills).toBeCloseTo(folded.expectedKills, 4)
    expect(totals.skipCells).toBeCloseTo(folded.skipCells, 4)
  })

  it('simulateWaveEconTotals equals fold of rows', () => {
    const input = baseCoinInput({ tier: 20, targetWave: 100 })
    const totals = simulateWaveEconTotals(input, { maxRows: 100 })
    const folded = foldWaveEconRows(simulateWaveEconRows(input, { maxRows: 100 }))
    expect(totals.cells).toBeCloseTo(folded.cells, 6)
    expect(totals.rerollShards).toBeCloseTo(folded.rerollShards, 6)
  })

  it('simulateWaveCoinTotals matches foldWaveCoinRows', () => {
    const input = baseCoinInput({ tier: 20, targetWave: 50, waveSkipCardLevel: 7, waveSkipMasteryLevel: 9 })
    const coinsPerWaveMult = buildResourceDropsCoinMultipliers(input).coinsPerWaveMult
    const rows = simulateWaveCoinRows(input, { maxRows: 50, coinsPerWaveMult })
    expect(simulateWaveCoinTotals(input, { maxRows: 50, coinsPerWaveMult })).toEqual(foldWaveCoinRows(rows))
  })

  it('high wave skip raises per-wave cell totals vs low skip', () => {
    const low = simulateWaveEconTotals(
      baseCoinInput({
        tier: 20,
        targetWave: 100,
        waveSkipCardLevel: 1,
        waveSkipMasteryLevel: 0,
      }),
      { maxRows: 100 },
    )
    const high = simulateWaveEconTotals(
      baseCoinInput({
        tier: 20,
        targetWave: 100,
        waveSkipCardLevel: 7,
        waveSkipMasteryLevel: 9,
      }),
      { maxRows: 100 },
    )
    expect(high.cells).toBeGreaterThan(low.cells)
    expect(high.skipCells).toBeGreaterThan(low.skipCells)
    expect(high.skipCells).toBeGreaterThan(0)
  })
})
