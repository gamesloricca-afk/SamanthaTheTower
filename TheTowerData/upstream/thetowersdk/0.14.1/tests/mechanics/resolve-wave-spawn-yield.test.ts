import { describe, expect, it } from 'vitest'
import {
  expectedEnemiesPerSpawnTickFromAccount,
  resolveWaveSpawnYieldFromAccount,
  waveSpawnDoubleChanceFromEliteChart,
} from '../../src/mechanics/waves/resolve-wave-spawn-yield'

describe('resolve-wave-spawn-yield', () => {
  it('resolveWaveSpawnYieldFromAccount returns undefined for null input', () => {
    expect(resolveWaveSpawnYieldFromAccount(null)).toBeUndefined()
    expect(resolveWaveSpawnYieldFromAccount(undefined)).toBeUndefined()
  })

  it('expectedEnemiesPerSpawnTickFromAccount at tier 1 wave 100 with EB mastery 0 gives 3 + chart double', () => {
    const double = waveSpawnDoubleChanceFromEliteChart({ tier: 1, wave: 100, enemyBalanceMastery: 0 })
    expect(
      expectedEnemiesPerSpawnTickFromAccount({
        tier: 1,
        wave: 100,
        enemyBalanceMastery: 0,
        randomBasicGatePassRate: 1,
      }),
    ).toBeCloseTo(3 + double, 5)
  })

  it('gate formula still 3.25 with explicit randomBasicGatePassRate 1 and double 0.25', () => {
    expect(
      expectedEnemiesPerSpawnTickFromAccount({
        tier: 1,
        wave: 1,
        randomBasicGatePassRate: 1,
        enemyDoubleSpawnChance: 0.25,
      }),
    ).toBe(3.25)
  })

  it('useSpawnGates sums heterogeneous gate EVs at explicit tick cap 100', () => {
    expect(
      expectedEnemiesPerSpawnTickFromAccount({
        tier: 1,
        wave: 1,
        useSpawnGates: true,
        useSpawnQuantum: false,
        spawnTickCap: 100,
        enemyDoubleSpawnChance: 0.25,
      }),
    ).toBeCloseTo(2.05, 5)
  })

  it('useSpawnGates with More Enemies heat raises yield via gate3', () => {
    const none = expectedEnemiesPerSpawnTickFromAccount({
      tier: 1,
      wave: 1,
      useSpawnGates: true,
      useSpawnQuantum: false,
      spawnTickCap: 100,
      enemyDoubleSpawnChance: 0.25,
    })
    const withMe = expectedEnemiesPerSpawnTickFromAccount({
      tier: 1,
      wave: 1,
      useSpawnGates: true,
      useSpawnQuantum: false,
      spawnTickCap: 100,
      enemyDoubleSpawnChance: 0.25,
      moreEnemiesHeatLevel: 10,
    })
    expect(none).toBeCloseTo(2.05, 5)
    expect(withMe).toBeGreaterThan(none)
  })

  it('useSpawnGates additive probe differs from calibrated default at mid chart cap', () => {
    const calibrated = expectedEnemiesPerSpawnTickFromAccount({
      tier: 1,
      wave: 5000,
      waveAcceleratorMastery: 9,
      enemyDoubleSpawnChance: 0.25,
      randomBasicGatePassRate: 1,
    })
    const modeled = expectedEnemiesPerSpawnTickFromAccount({
      tier: 1,
      wave: 5000,
      waveAcceleratorMastery: 9,
      useSpawnGates: true,
      useSpawnQuantum: false,
      enemyDoubleSpawnChance: 0.25,
    })
    expect(calibrated).toBeCloseTo(3.25, 5)
    expect(modeled).toBeLessThan(calibrated)
  })

  it('useSpawnGates quantum returns per-quantum EV (master x cluster)', () => {
    const perQuantum = expectedEnemiesPerSpawnTickFromAccount({
      tier: 1,
      wave: 1,
      useSpawnGates: true,
      spawnTickCap: 56,
      enemyDoubleSpawnThreshold: 5,
      moreEnemiesResistance: 1,
    })
    // master 0.56 * (1 + 0.8 + 0 + 0.06) = 0.56 * 1.86
    expect(perQuantum).toBeCloseTo(0.56 * 1.86, 5)
  })


  it('useSpawnGates derives double threshold from tier when omitted', () => {
    const resolved = resolveWaveSpawnYieldFromAccount({
      tier: 21,
      wave: 100,
      useSpawnGates: true,
    })
    expect(resolved?.enemyDoubleSpawnThreshold).toBeCloseTo(5 + 21/2.85, 5)
  })
})
