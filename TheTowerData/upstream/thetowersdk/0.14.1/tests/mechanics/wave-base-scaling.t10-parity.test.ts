import { describe, expect, it } from 'vitest'
import { computeWaveBaseDamage, computeWaveBaseHealth } from '../../src/mechanics/waves/base-scaling'
import { WAVE_FORMULA } from '../../src/mechanics/waves/reference/base-constants'

/** T10 W80 clean repro: HP skips 72 → level 8, ATK skips 70 → level 10, no BCs/perks/labs. */
describe('wave base scaling T10 parity', () => {
  it('non-tournament health body coefficient matches calibrated constant', () => {
    expect(WAVE_FORMULA.health.body.aNonTournament).toBeCloseTo(0.05, 6)
  })

  it('wave base HP at skip level 8 matches game Wave Info row (~510.8K)', () => {
    const hp = computeWaveBaseHealth({ wave: 8, tier: 10 })
    expect(hp).toBeGreaterThanOrEqual(510_798)
    expect(hp).toBeLessThanOrEqual(510_800)
  })

  it('wave base damage at skip level 10 matches game (~77.29K)', () => {
    const damage = computeWaveBaseDamage({ wave: 10, tier: 10 })
    expect(damage).toBeGreaterThanOrEqual(77_290)
    expect(damage).toBeLessThanOrEqual(77_295)
  })
})
