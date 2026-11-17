import { describe, expect, it } from 'vitest'
import {
  WAVE_SPAWN_CALIBRATED_ENEMIES_PER_TICK,
  WAVE_SPAWN_RANDOM_BASIC_CALL_SITES_DEFAULT,
  defaultCalibratedWaveSpawnYieldV29,
  expectedEnemiesPerSpawnTick,
  expectedEnemiesPerSpawnTickFromWaveGates,
  killsPerWaveFromSpawnContext,
} from '../../src/mechanics/waves/spawn-yield'
import { enemySpawnRateCapFromWaveAcceleratorChart } from '../../src/mechanics/waves/accelerator-spawn-rate-cap'

describe('wave-spawn-yield', () => {
  it('defaults to save-calibrated 3.25 enemies per tick', () => {
    expect(expectedEnemiesPerSpawnTick()).toBe(WAVE_SPAWN_CALIBRATED_ENEMIES_PER_TICK)
    expect(WAVE_SPAWN_CALIBRATED_ENEMIES_PER_TICK).toBe(3.25)
    expect(WAVE_SPAWN_RANDOM_BASIC_CALL_SITES_DEFAULT).toBe(3)
  })

  it('scales linearly when call-site count differs from the default', () => {
    expect(expectedEnemiesPerSpawnTick({ randomBasicCallSites: 6 })).toBeCloseTo(6.5, 5)
  })

  it('models explicit spawn gates when provided', () => {
    expect(
      expectedEnemiesPerSpawnTick({
        randomBasicCallSites: 3,
        randomBasicGatePassRate: 0.5,
        enemyDoubleSpawnChance: 0.1,
      }),
    ).toBeCloseTo(1.6, 5)
  })

  it('makes three basic-enemy spawn attempts per tick in v29', () => {
    expect(WAVE_SPAWN_RANDOM_BASIC_CALL_SITES_DEFAULT).toBe(3)
  })

  it('gate formula: 3 sites × spawnChance + doubleSpawnChance', () => {
    expect(
      expectedEnemiesPerSpawnTickFromWaveGates({
        randomBasicGatePassRate: 1,
        enemyDoubleSpawnChance: 0.25,
      }),
    ).toBe(3.25)
  })

  it('defaultCalibratedWaveSpawnYieldV29 matches save-calibrated tick yield', () => {
    expect(
      expectedEnemiesPerSpawnTick(defaultCalibratedWaveSpawnYieldV29()),
    ).toBe(WAVE_SPAWN_CALIBRATED_ENEMIES_PER_TICK)
  })

  it('combines spawn cap chart with yield for kills per wave', () => {
    const wave = 100
    const enemyBalanceMult = 1.9
    const waveAcceleratorMastery = 9
    const cap = enemySpawnRateCapFromWaveAcceleratorChart({ wave, waveAcceleratorMastery })
    const kills = killsPerWaveFromSpawnContext({
      wave,
      enemyBalanceMult,
      waveAcceleratorMastery,
    })
    expect(kills).toBeGreaterThan(0)
    expect(kills).toBeCloseTo(cap * enemyBalanceMult * WAVE_SPAWN_CALIBRATED_ENEMIES_PER_TICK, 5)
  })

  it('useSpawnGates quantum returns full-wave enemies (not cap x per-tick)', () => {
    const kills = killsPerWaveFromSpawnContext({
      wave: 1,
      enemyBalanceMult: 1,
      waveAcceleratorMastery: null,
      spawnYield: {
        useSpawnGates: true,
        spawnTickCap: 56,
        enemyDoubleSpawnThreshold: 5,
        moreEnemiesResistance: 1,
        waveLengthSeconds: 26,
      },
    })
    expect(kills).toBeCloseTo(208 * 0.56 * 1.86, 5)
  })

  it('useSpawnGates additive probe still uses chart cap as tick count', () => {
    const cap = enemySpawnRateCapFromWaveAcceleratorChart({ wave: 100, waveAcceleratorMastery: 9 })
    const kills = killsPerWaveFromSpawnContext({
      wave: 100,
      enemyBalanceMult: 1,
      waveAcceleratorMastery: 9,
      spawnYield: {
        useSpawnGates: true,
        useSpawnQuantum: false,
        spawnTickCap: 100,
        enemyDoubleSpawnChance: 0.25,
      },
    })
    expect(kills).toBeCloseTo(cap * 2.05, 5)
  })
})
