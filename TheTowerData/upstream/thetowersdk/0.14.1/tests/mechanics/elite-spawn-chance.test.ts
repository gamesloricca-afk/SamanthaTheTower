import { describe, expect, it } from 'vitest'
import {
  computeWaveInfoBossWaveInterval,
  eliteSpawnChanceAtWave,
  isBossSpawnWave,
  isFleetSpawnWave,
  waveInfoBossSpawnColumn,
  waveInfoEliteEffectiveDoubleSpawnPct,
  waveInfoEliteSpawnChancePct,
  expectedEliteKillsPerWave,
  waveInfoEliteTwoOrMoreSpawnChancePct,
  waveInfoFleetSpawnColumn,
  wavesUntilNextBossSpawn,
  wavesUntilNextFleetSpawn,
} from '../../src/mechanics/enemies/elite-spawn-chance'
import { computeWaveInfoPanelEnemyExtras } from '../../src/mechanics/waves/info-panel-stats'

describe('elite-spawn-chance', () => {
  it('matches Elite Spawn Chance chart at T20/W100', () => {
    const row = eliteSpawnChanceAtWave(20, 100)
    expect(row.singleSpawnPct).toBe(4)
    expect(row.doubleSpawnPct).toBe(0)
    expect(waveInfoEliteSpawnChancePct(20, 100)).toBe(4)
  })

  it('reaches 100% single at T20/W4786', () => {
    expect(waveInfoEliteSpawnChancePct(20, 4786)).toBe(100)
  })

  it('expected elite kills per wave from chart slot model', () => {
    expect(expectedEliteKillsPerWave(20, 100, { enemyBalanceMastery: null })).toBeCloseTo(0.04, 4)
    expect(expectedEliteKillsPerWave(20, 4786, { enemyBalanceMastery: null })).toBeCloseTo(2, 4)
  })

  it('2+ elite chance combines chart double% and EB mastery', () => {
    // Before 100% single: only EB can create 2+ (4% single × 60% EB = 2.4% → 2%)
    expect(waveInfoEliteTwoOrMoreSpawnChancePct(20, 100, { enemyBalanceMastery: 9 })).toBe(2.4)
    expect(waveInfoEliteTwoOrMoreSpawnChancePct(20, 100, { enemyBalanceMastery: 0 })).toBe(0.2)
    expect(waveInfoEliteTwoOrMoreSpawnChancePct(20, 100, { enemyBalanceMastery: null })).toBe(0)

    // At 100% chart double: EB + chart double roll (100% double @ high wave → always 2+)
    expect(waveInfoEliteTwoOrMoreSpawnChancePct(20, 4786, { enemyBalanceMastery: null })).toBe(100)
    expect(waveInfoEliteTwoOrMoreSpawnChancePct(20, 4786, { enemyBalanceMastery: 4 })).toBe(100)

    // Mid double% row: single=100%, chart double=25%, EB=0% → 25% (T20 ≈ W1542)
    const midDouble = eliteSpawnChanceAtWave(20, 1600)
    expect(midDouble.singleSpawnPct).toBe(100)
    expect(midDouble.doubleSpawnPct).toBe(25)
    expect(waveInfoEliteTwoOrMoreSpawnChancePct(20, 1600, { enemyBalanceMastery: null })).toBe(25)

    // EB on first chart double% row (1%): 6% EB + 94% × 1% chart double ≈ 7%
    const firstDoubleRow = eliteSpawnChanceAtWave(20, 1100)
    expect(firstDoubleRow.singleSpawnPct).toBe(100)
    expect(firstDoubleRow.doubleSpawnPct).toBe(4)
    expect(waveInfoEliteTwoOrMoreSpawnChancePct(20, 1100, { enemyBalanceMastery: 0 })).toBe(9.8)
  })

  it('fleet cadence matches Spawning Behavior chart at T20', () => {
    expect(isFleetSpawnWave(20, 15)).toBe(true)
    expect(wavesUntilNextFleetSpawn(20, 7)).toEqual({ waves: 8, onSpawnWave: false })
    expect(wavesUntilNextFleetSpawn(20, 15)).toEqual({ waves: 0, onSpawnWave: true })
    expect(wavesUntilNextFleetSpawn(20, 16)).toEqual({ waves: 9, onSpawnWave: false })
  })

  it('boss cadence uses More Bosses tier interval', () => {
    expect(computeWaveInfoBossWaveInterval({ tier: 1 })).toBe(10)
    expect(computeWaveInfoBossWaveInterval({ tier: 14 })).toBe(9)
    expect(computeWaveInfoBossWaveInterval({ tier: 16 })).toBe(7)
    expect(computeWaveInfoBossWaveInterval({ tier: 17 })).toBe(6)
    expect(computeWaveInfoBossWaveInterval({ tier: 20 })).toBe(5)
    expect(computeWaveInfoBossWaveInterval({
      tier: 20,
      tournament: true,
      league: 'Legend',
    })).toBe(5)
    expect(isBossSpawnWave(10, 10)).toBe(true)
    expect(isBossSpawnWave(11, 10)).toBe(false)
    expect(wavesUntilNextBossSpawn(11, 10)).toEqual({ waves: 9, onSpawnWave: false })
    expect(waveInfoBossSpawnColumn(10, 10)).toEqual({ kind: 'percent', pct: 100 })
    expect(waveInfoBossSpawnColumn(11, 10)).toEqual({ kind: 'wavesUntil', waves: 9, onSpawnWave: false })
  })

  it('EB mastery applies to chart double lookup for elite parentheses', () => {
    expect(waveInfoEliteEffectiveDoubleSpawnPct(20, 100, { enemyBalanceMastery: null })).toBe(0)
    expect(waveInfoEliteEffectiveDoubleSpawnPct(20, 100, { enemyBalanceMastery: 9 })).toBe(60)
    expect(waveInfoEliteEffectiveDoubleSpawnPct(20, 1600, { enemyBalanceMastery: null })).toBe(25)
    expect(waveInfoEliteEffectiveDoubleSpawnPct(20, 1600, { enemyBalanceMastery: 9 })).toBe(70)
  })

  it('elites use chart Single% and 2x effective Double% in spawn column', () => {
    expect(waveInfoFleetSpawnColumn(20, 7)).toEqual({ kind: 'wavesUntil', waves: 8, onSpawnWave: false })
    expect(waveInfoFleetSpawnColumn(20, 15)).toEqual({ kind: 'wavesUntil', waves: 0, onSpawnWave: true })

    const vampire = computeWaveInfoPanelEnemyExtras({ tier: 20, wave: 100, enemyType: 'Vampire' })
    expect(vampire.spawnColumn).toEqual({ kind: 'percent', pct: 4 })

    const midDouble = computeWaveInfoPanelEnemyExtras({ tier: 20, wave: 1600, enemyType: 'Vampire' })
    expect(midDouble.spawnColumn).toEqual({
      kind: 'percent',
      pct: 100,
      doublePct: 25,
      eliteDoublePrefix: '2x',
    })

    const ebLow = computeWaveInfoPanelEnemyExtras({
      tier: 20,
      wave: 100,
      enemyType: 'Vampire',
      enemyBalanceMastery: 9,
    })
    expect(ebLow.spawnColumn).toEqual({
      kind: 'percent',
      pct: 4,
      doublePct: 60,
      eliteDoublePrefix: '2x',
    })

    const maxDouble = computeWaveInfoPanelEnemyExtras({ tier: 20, wave: 4786, enemyType: 'Vampire' })
    expect(maxDouble.spawnColumn).toEqual({
      kind: 'percent',
      pct: 100,
      doublePct: 100,
      eliteDoublePrefix: '2x',
    })

    const bossOff = computeWaveInfoPanelEnemyExtras({ tier: 20, wave: 4786, enemyType: 'Boss' })
    expect(bossOff.spawnColumn).toEqual({ kind: 'wavesUntil', waves: 4, onSpawnWave: false })
    const bossOn = computeWaveInfoPanelEnemyExtras({ tier: 20, wave: 4790, enemyType: 'Boss' })
    expect(bossOn.spawnColumn).toEqual({ kind: 'percent', pct: 100 })

    const saboteur = computeWaveInfoPanelEnemyExtras({ tier: 20, wave: 100, enemyType: 'Saboteur' })
    expect(saboteur.spawnColumn).toEqual({ kind: 'wavesUntil', waves: 5, onSpawnWave: false })

    const basic = computeWaveInfoPanelEnemyExtras({ tier: 20, wave: 100, enemyType: 'Basic' })
    expect(basic.spawnColumn).toEqual({ kind: 'percent', pct: basic.spawnChancePct })
  })
})
