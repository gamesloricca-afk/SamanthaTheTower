import { describe, expect, it } from 'vitest'
import {
  computeWaveInfoPanelEnemyExtras,
  computeWaveInfoPanelSummary,
  enemyMassWaveMult,
  waveInfoEnemyMass,
} from '../../src/mechanics/waves/info-panel-stats'

/** In-game Wave Info @ T20 W4341 — user goldens (no protector radius labs). */
const TIER = 20
const WAVE = 4341

describe('wave-info-panel-stats T20/W4341 in-game goldens', () => {
  it('mass wave mult matches panel (~1.223 plateau below W4786)', () => {
    expect(enemyMassWaveMult(WAVE)).toBeCloseTo(1.223, 2)
  })

  it('Basic mass matches in-game 25.86', () => {
    const mass = waveInfoEnemyMass({ tier: TIER, wave: WAVE, enemyType: 'Basic' })
    expect(mass).toBeCloseTo(25.86, 1)
  })

  it('Tank mass matches in-game 125.59', () => {
    const mass = waveInfoEnemyMass({ tier: TIER, wave: WAVE, enemyType: 'Tank' })
    expect(mass).toBeCloseTo(125.59, 0)
  })

  it('Boss mass matches in-game 320.14', () => {
    const mass = waveInfoEnemyMass({ tier: TIER, wave: WAVE, enemyType: 'Boss' })
    expect(mass).toBeCloseTo(320.14, 0)
  })

  it('Saboteur mass matches in-game 24626.13', () => {
    const mass = waveInfoEnemyMass({ tier: TIER, wave: WAVE, enemyType: 'Saboteur' })
    expect(mass).toBeCloseTo(24626.13, -2)
  })

  it('protector radius matches in-game 15.19m with no radius labs', () => {
    const summary = computeWaveInfoPanelSummary(TIER, WAVE, {
      protectorRadiusLabLevel: 0,
    })
    expect(summary.protectorRadiusMeters).toBeCloseTo(15.19, 1)
  })

  it('mass scales uniformly across types', () => {
    const basic = computeWaveInfoPanelEnemyExtras({ tier: TIER, wave: WAVE, enemyType: 'Basic' }).mass
    const tank = computeWaveInfoPanelEnemyExtras({ tier: TIER, wave: WAVE, enemyType: 'Tank' }).mass
    expect(tank / basic).toBeCloseTo(125.59 / 25.86, 2)
  })
})
