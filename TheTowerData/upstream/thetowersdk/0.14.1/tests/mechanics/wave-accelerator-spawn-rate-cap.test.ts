import { describe, expect, it } from 'vitest'
import {
  enemySpawnRateCapFromWaveAcceleratorChart,
  findWaveAcceleratorMasteryForSpawnCap,
  waveAcceleratorSpawnMasteryBonusPercent,
  waveAcceleratorSpawnRateChartColumn,
} from '../../src/mechanics/waves/accelerator-spawn-rate-cap'

describe('wave-accelerator-spawn-rate-cap', () => {
  it('maps mastery level to chart reduction column', () => {
    expect(waveAcceleratorSpawnMasteryBonusPercent(0)).toBe(10)
    expect(waveAcceleratorSpawnMasteryBonusPercent(4)).toBe(50)
    expect(waveAcceleratorSpawnMasteryBonusPercent(9)).toBe(100)
    expect(findWaveAcceleratorMasteryForSpawnCap(null)).toBeNull()
    expect(findWaveAcceleratorMasteryForSpawnCap(-1)).toBeNull()
    expect(waveAcceleratorSpawnRateChartColumn(null)).toBe('normal')
    expect(waveAcceleratorSpawnRateChartColumn(-1)).toBe('normal')
    expect(waveAcceleratorSpawnRateChartColumn(0)).toBe('reduction10')
    expect(waveAcceleratorSpawnRateChartColumn(4)).toBe('reduction50')
    expect(waveAcceleratorSpawnRateChartColumn(9)).toBe('reduction100')
  })

  it('matches chart spawn caps at key waves with no mastery', () => {
    expect(enemySpawnRateCapFromWaveAcceleratorChart({ wave: 1000, waveAcceleratorMastery: null })).toBe(37)
    expect(enemySpawnRateCapFromWaveAcceleratorChart({ wave: 6500, waveAcceleratorMastery: null })).toBe(56)
    expect(enemySpawnRateCapFromWaveAcceleratorChart({ wave: 4786, waveAcceleratorMastery: null })).toBe(49)
  })

  it('WA mastery lowers wave required for each cap', () => {
    expect(enemySpawnRateCapFromWaveAcceleratorChart({ wave: 4786, waveAcceleratorMastery: 4 })).toBe(56)
    expect(enemySpawnRateCapFromWaveAcceleratorChart({ wave: 4333, waveAcceleratorMastery: 4 })).toBe(56)
    expect(enemySpawnRateCapFromWaveAcceleratorChart({ wave: 4332, waveAcceleratorMastery: 4 })).toBe(54)
  })
})
