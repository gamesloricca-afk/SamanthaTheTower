import { describe, expect, it } from 'vitest'
import { computeWaveBaseDamage, computeWaveBaseHealth, computeWaveBaseHealthRaw } from '../../src/mechanics/waves/reference/base-scaling-legacy'
import { type WaveBaseScalingInput } from '../../src/mechanics/waves/reference/types'
import {
  computeEmpiricalWaveBaseDamage,
  computeEmpiricalWaveBaseHealth,
  computeEmpiricalWaveBaseHealthRaw,
} from '../../src/mechanics/waves/base-empirical-scaling'

/** Representative waves spanning early, mid, late, and extreme campaign. */
const PARITY_WAVES = [
  1, 2, 3, 5, 8, 10, 14, 25, 50, 72, 80, 100, 200, 500, 923, 1000, 1320,
  1432, 2011, 2649, 3526, 3487, 4691, 4744, 4900, 4955, 4958, 6168, 6484,
  6670, 6966, 7324, 10_000, 50_000,
] as const

const PARITY_TIERS = Array.from({ length: 21 }, (_, i) => i + 1)

const PARITY_CONTEXTS: readonly WaveBaseScalingInput[] = [
  { wave: 1, tier: 1, tournament: false },
  { wave: 100, tier: 10, tournament: false },
  { wave: 2011, tier: 20, tournament: false },
  { wave: 100, tier: 14, tournament: true },
  { wave: 500, tier: 17, tournament: true, isTestingTournamentConditions: true },
  { wave: 500, tier: 17, tournament: true, isTestingTournamentConditions: false },
  { wave: 800, tier: 18, tournament: true, highestWaveThisTierAltBody: true },
  { wave: 80, tier: 10, tournament: false, tierDifficultyMultiplier: 40320 },
]

function assertExactParity(input: Omit<WaveBaseScalingInput, 'wave' | 'tier'>, wave: number, tier: number) {
  const ctx = { ...input, wave, tier }
  expect(computeEmpiricalWaveBaseHealth(ctx)).toBe(computeWaveBaseHealth(ctx))
  expect(computeEmpiricalWaveBaseDamage(ctx)).toBe(computeWaveBaseDamage(ctx))
  expect(computeEmpiricalWaveBaseHealthRaw(ctx)).toBe(computeWaveBaseHealthRaw(ctx))
}

describe('wave-base empirical vs legacy parity', () => {
  it('matches HP and damage for every tier × representative wave (standard campaign)', () => {
    for (const tier of PARITY_TIERS) {
      for (const wave of PARITY_WAVES) {
        assertExactParity({ tournament: false }, wave, tier)
      }
    }
  })

  it('matches tournament and modifier contexts spot matrix', () => {
    for (const ctx of PARITY_CONTEXTS) {
      assertExactParity(ctx, ctx.wave, ctx.tier)
    }
  })

  it('matches known calculator stat levels used by enemy-stats goldens', () => {
    const cases: Array<{ tier: number, hpWave: number, dmgWave: number }> = [
      { tier: 10, hpWave: 8, dmgWave: 10 },
      { tier: 17, hpWave: 923, dmgWave: 931 },
      { tier: 20, hpWave: 2011, dmgWave: 1432 },
      { tier: 20, hpWave: 1432, dmgWave: 1432 },
      { tier: 20, hpWave: 3526, dmgWave: 3487 },
      { tier: 20, hpWave: 4955, dmgWave: 4900 },
    ]
    for (const { tier, hpWave, dmgWave } of cases) {
      assertExactParity({ tournament: false }, hpWave, tier)
      assertExactParity({ tournament: false }, dmgWave, tier)
    }
  })

  it('documents swap gate — flip wave-base-scaling.ts export when this file stays green', () => {
    expect(PARITY_TIERS.length).toBe(21)
    expect(PARITY_WAVES.length).toBeGreaterThanOrEqual(30)
  })
})
