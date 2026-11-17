import { describe, expect, it } from 'vitest'
import {
  WAVE_UPDATE_GATE2_PASS_RATE_V29,
  WAVE_UPDATE_SPAWN_BASIC_GATE_KINDS_V29,
} from '../../src/mechanics/waves/spawn-gate-constants'

describe('wave-update-spawn-gates', () => {
  it('gate kinds are heterogeneous — not all tick-cap compares', () => {
    expect(WAVE_UPDATE_SPAWN_BASIC_GATE_KINDS_V29).toEqual([
      'enemySpawnChance_vs_random0_100',
      'random0_100_le_79',
      'random_float_lt_complement',
    ])
  })

  it('gate 2 passes 80 of every 100 rolls', () => {
    expect(WAVE_UPDATE_GATE2_PASS_RATE_V29).toBe(0.8)
  })
})
