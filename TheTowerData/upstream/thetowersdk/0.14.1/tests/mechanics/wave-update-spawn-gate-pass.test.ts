import { describe, expect, it } from 'vitest'
import {
  expectedEnemiesPerSpawnTickFromGatesV29,
  expectedEnemiesPerWaveFromQuantumV29,
  newWaveEnemyDoubleSpawnThresholdV29,
  waveUpdateFixedIntGatePassRate,
  waveUpdateFloatComplementGatePassRate,
  waveUpdateThresholdGtePassRate,
  waveUpdateTickCapGatePassRate,
} from '../../src/mechanics/waves/update-spawn-gate-pass'
import { WAVE_UPDATE_GATE2_PASS_RATE_V29 } from '../../src/mechanics/waves/spawn-gate-constants'

describe('wave-update-spawn-gate-pass', () => {
  it('the fixed spawn gate passes eighty of one hundred integer outcomes', () => {
    expect(waveUpdateFixedIntGatePassRate()).toBe(WAVE_UPDATE_GATE2_PASS_RATE_V29)
    expect(WAVE_UPDATE_GATE2_PASS_RATE_V29).toBeCloseTo(0.8, 5)
  })

  it('gate 1 pass rate scales with tick cap up to 100', () => {
    expect(waveUpdateTickCapGatePassRate(0)).toBe(0)
    expect(waveUpdateTickCapGatePassRate(50)).toBeCloseTo(0.5, 5)
    expect(waveUpdateTickCapGatePassRate(100)).toBe(1)
    expect(waveUpdateTickCapGatePassRate(200)).toBe(1)
  })

  it('spawn gates sum three sites plus double roll (gate3=0 without More Enemies)', () => {
    expect(
      expectedEnemiesPerSpawnTickFromGatesV29({
        spawnTickCap: 100,
        enemyDoubleSpawnChance: 0.25,
      }),
    ).toBeCloseTo(1 + 0.8 + 0 + 0.25, 5)
  })

  it('gate3 pass rate is 1 - GetResistanceLevel moreEnemies resistance', () => {
    expect(waveUpdateFloatComplementGatePassRate(1)).toBe(0)
    expect(waveUpdateFloatComplementGatePassRate(0.7)).toBeCloseTo(0.3, 5)
    expect(
      expectedEnemiesPerSpawnTickFromGatesV29({
        spawnTickCap: 100,
        enemyDoubleSpawnChance: 0.25,
        moreEnemiesResistance: 0.7,
      }),
    ).toBeCloseTo(1 + 0.8 + 0.3 + 0.25, 5)
  })

  it('quantum model: 26s wave, threshold 56, base double 5, no ME', () => {
    // ticks=208, master=0.56, inner=1+0.8+0+0.06=1.86 -> 208*0.56*1.86
    expect(
      expectedEnemiesPerWaveFromQuantumV29({
        waveLengthSeconds: 26,
        enemySpawnChanceThreshold: 56,
        enemyDoubleSpawnThreshold: 5,
        moreEnemiesResistance: 1,
        enemyBalanceMult: 1,
      }),
    ).toBeCloseTo(208 * 0.56 * 1.86, 5)
  })

  it('double threshold gte: F=5 -> 0.06, F=24 -> 0.25', () => {
    expect(waveUpdateThresholdGtePassRate(5)).toBeCloseTo(0.06, 5)
    expect(waveUpdateThresholdGtePassRate(24)).toBeCloseTo(0.25, 5)
  })


  it('NewWave double threshold is theme base + tier/2.85', () => {
    expect(newWaveEnemyDoubleSpawnThresholdV29({ tier: 1, themeBucketBase: 5 })).toBeCloseTo(5 + 1/2.85, 5)
    expect(newWaveEnemyDoubleSpawnThresholdV29({ tier: 21 })).toBeCloseTo(5 + 21/2.85, 5)
  })

  it('quantum wave EV at T21 uses tier-boosted double threshold', () => {
    const withTier = expectedEnemiesPerWaveFromQuantumV29({
      waveLengthSeconds: 26,
      enemySpawnChanceThreshold: 56,
      enemyDoubleSpawnThreshold: newWaveEnemyDoubleSpawnThresholdV29({ tier: 21 }),
      moreEnemiesResistance: 1,
      enemyBalanceMult: 1,
    })
    const baseOnly = expectedEnemiesPerWaveFromQuantumV29({
      waveLengthSeconds: 26,
      enemySpawnChanceThreshold: 56,
      enemyDoubleSpawnThreshold: 5,
      moreEnemiesResistance: 1,
      enemyBalanceMult: 1,
    })
    expect(withTier).toBeGreaterThan(baseOnly)
  })
})
