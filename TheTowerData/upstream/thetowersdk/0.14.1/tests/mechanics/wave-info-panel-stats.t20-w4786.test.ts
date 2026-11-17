import { describe, expect, it } from 'vitest'
import type { EnemyWaveEnemyType } from '../../src/mechanics/enemies/types'
import {
  computeWaveInfoPanelEnemyExtras,
  computeWaveInfoPanelSummary,
  enemyMassWaveMult,
  enemySpawnRateCap,
  enemySpeedWaveMult,
  waveInfoSpawnChances,
} from '../../src/mechanics/waves/info-panel-stats'

const TIER = 20
const WAVE = 4786

const GOLDEN: Partial<Record<EnemyWaveEnemyType, { chance: number, speed: number, mass: number }>> = {
  Basic: { chance: 16, speed: 12, mass: 37.78 },
  Fast: { chance: 24, speed: 27.6, mass: 37.78 },
  Tank: { chance: 22, speed: 4.03, mass: 183.48 },
  Ranged: { chance: 21, speed: 6.72, mass: 37.78 },
  Boss: { chance: 0, speed: 4.03, mass: 467.7, wavesUntilBoss: 4 },
  Protector: { chance: 17, speed: 2.69, mass: 75.55 },
  Vampire: { chance: 100, speed: 2.69, mass: 7195.44 },
  Scatter: { chance: 100, speed: 4.03, mass: 7195.44 },
  Ray: { chance: 100, speed: 2.69, mass: 17988.59 },
  Saboteur: { chance: 0, speed: 1.18, mass: 35977.18 },
  Commander: { chance: 0, speed: 0.34, mass: 35977.18 },
  Overcharge: { chance: 0, speed: 0.67, mass: 35977.18 },
}

describe('wave-info-panel-stats T20/W4786 golden', () => {
  it('matches in-game mass wave mult', () => {
    expect(enemyMassWaveMult(WAVE)).toBeCloseTo(1.786, 3)
  })

  it('caps enemy speed wave mult at 12', () => {
    expect(enemySpeedWaveMult(WAVE, TIER)).toBe(12)
  })

  it('matches spawn rate cap with WA mastery 50% (level 4)', () => {
    expect(enemySpawnRateCap(WAVE, TIER, { waveAcceleratorMastery: 4 })).toBe(56)
  })

  it('spawn rate cap ignores Enemy Balance — only WA mastery chart applies', () => {
    expect(enemySpawnRateCap(WAVE, TIER, { waveAcceleratorMastery: null })).toBe(49)
    expect(enemySpawnRateCap(WAVE, TIER, { waveAcceleratorMastery: 4 })).toBe(56)
  })

  it('spawn chances sum to 100 for standard enemies', () => {
    const chances = waveInfoSpawnChances(TIER, WAVE)
    expect(chances.Fast + chances.Tank + chances.Ranged + chances.Protector + chances.Basic).toBe(100)
    expect(chances.Fast).toBe(24)
    expect(chances.Tank).toBe(22)
    expect(chances.Ranged).toBe(21)
  })

  it('matches in-game panel speeds and mass within tolerance', () => {
    for (const [enemyType, golden] of Object.entries(GOLDEN) as [EnemyWaveEnemyType, NonNullable<(typeof GOLDEN)[EnemyWaveEnemyType]>][]) {
      const extras = computeWaveInfoPanelEnemyExtras({
        tier: TIER,
        wave: WAVE,
        enemyType,
      })
      if (['Saboteur', 'Commander', 'Overcharge'].includes(enemyType)) {
        expect(extras.spawnColumn.kind).toBe('wavesUntil')
      } else if (enemyType === 'Boss') {
        expect(extras.spawnChancePct).toBe(0)
        expect(extras.spawnColumn).toEqual({
          kind: 'wavesUntil',
          waves: golden.wavesUntilBoss ?? 0,
          onSpawnWave: false,
        })
      } else {
        if (golden.chance > 0) {
          expect(extras.spawnChancePct).toBeCloseTo(golden.chance, 0)
        }
        expect(extras.spawnColumn.kind).toBe('percent')
        if (extras.spawnColumn.kind === 'percent') {
          expect(extras.spawnColumn.pct).toBeCloseTo(extras.spawnChancePct, 0)
        }
      }
      expect(extras.speed).toBeCloseTo(golden.speed, 0)
      expect(extras.mass).toBeCloseTo(golden.mass, -2)
    }
  })

  it('elite Chance column uses chart Single% and 2x EB-adjusted double%', () => {
    const vampire = computeWaveInfoPanelEnemyExtras({
      tier: TIER,
      wave: WAVE,
      enemyType: 'Vampire',
      enemyBalanceMastery: 4,
    })
    expect(vampire.spawnColumn).toEqual({
      kind: 'percent',
      pct: 100,
      doublePct: 100,
      eliteDoublePrefix: '2x',
    })

    const lowWave = computeWaveInfoPanelEnemyExtras({
      tier: TIER,
      wave: 100,
      enemyType: 'Vampire',
      enemyBalanceMastery: 9,
    })
    expect(lowWave.spawnColumn).toEqual({
      kind: 'percent',
      pct: 4,
      doublePct: 60,
      eliteDoublePrefix: '2x',
    })
  })

  it('footer protector radius near in-game 15.19m', () => {
    const summary = computeWaveInfoPanelSummary(TIER, WAVE, { waveAcceleratorMastery: 4 })
    expect(summary.protectorRadiusMeters).toBeCloseTo(15.19, 1)
    expect(summary.spawnRateCap).toBe(56)
  })
})
