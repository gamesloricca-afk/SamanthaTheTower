import { describe, expect, it } from 'vitest'
import {
  applyNewWaveTankWriteV29,
  newWaveNormalChanceResidualV29,
  newWaveProtectorChanceV29,
  newWaveProtectorSpawnSlotV29,
  advanceNewWaveProtectorGateV29,
  initialNewWaveProtectorGateStateV29,
  newWaveProtectorGateOpenV29,
  newWaveProtectorWavesUntilNextCanSpawnV29,
} from '../../src/mechanics/waves/new-wave-spawn-type-chances'
import { waveInfoSpawnChances } from '../../src/mechanics/waves/info-panel-stats'

describe('new-wave-spawn-type-chances', () => {
  it('protector slot bands match Wave Info panel through tier 12', () => {
    for (const wave of [1, 79, 80, 159, 160, 319, 320, 750, 751]) {
      expect(newWaveProtectorSpawnSlotV29(wave)).toBe(
        wave < 80 ? 0 : wave < 160 ? 1 : wave < 320 ? 2 : wave < 751 ? 3 : 4,
      )
    }
  })

  it('protector chance uses linear tier factor at tier 2–11', () => {
    expect(newWaveProtectorChanceV29(2, 100)).toBe(1)
    expect(newWaveProtectorChanceV29(10, 160)).toBe(2)
  })

  it('tier 1 protector chance is zero', () => {
    expect(newWaveProtectorChanceV29(1, 500)).toBe(0)
  })

  it('tier 1 tank accumulates protector when not tournament', () => {
    expect(
      applyNewWaveTankWriteV29({
        tier: 1,
        priorTankChance: 10,
        protectorChance: 0,
      }),
    ).toBe(10)
    expect(
      applyNewWaveTankWriteV29({
        tier: 1,
        priorTankChance: 10,
        protectorChance: 3,
      }),
    ).toBe(13)
    expect(
      applyNewWaveTankWriteV29({
        tier: 1,
        priorTankChance: 10,
        protectorChance: 3,
        isTournament: true,
      }),
    ).toBe(10)
  })

  it('normal chance is residual of fast + tank + ranged', () => {
    expect(newWaveNormalChanceResidualV29({ fast: 20, tank: 30, ranged: 25 })).toBe(25)
  })

  it('v29 protector model differs from Wave Info pow(1.72) model at tier 10 wave 160', () => {
    const modeled = newWaveProtectorChanceV29(10, 160)
    const panel = waveInfoSpawnChances(10, 160).Protector
    expect(modeled).toBe(2)
    expect(panel).toBeGreaterThan(modeled)
  })

  it('protector waves-until-next counter by tier matches the tier-specific model', () => {
    expect(newWaveProtectorWavesUntilNextCanSpawnV29(1)).toBe(10)
    expect(newWaveProtectorWavesUntilNextCanSpawnV29(4)).toBe(9)
    expect(newWaveProtectorWavesUntilNextCanSpawnV29(8)).toBe(8)
    expect(newWaveProtectorWavesUntilNextCanSpawnV29(12)).toBe(7)
  })

  it('protector gate opens after enough decrements', () => {
    let state = initialNewWaveProtectorGateStateV29(4)
    expect(newWaveProtectorGateOpenV29(state)).toBe(false)
    for (let step = 0; step < 5 && !newWaveProtectorGateOpenV29(state); step += 1) {
      state = advanceNewWaveProtectorGateV29(state)
    }
    expect(newWaveProtectorGateOpenV29(state)).toBe(true)
  })
})