import { describe, expect, it } from 'vitest'
import { recoveryPackageChance, galaxyCompressorTimeBoost, recoveryPackageTimeBoost,
  getOutOfRoundRecoveryAmountPreview, workshopStatValue } from '../../src/mechanics'

describe('recovery combat units are distinct from sheet normalization', () => {
  it('returns actual max-health fraction from the game preview', () => {
    expect(getOutOfRoundRecoveryAmountPreview({ workshopLevel: 0, workshopCurveMult: 0 })).toBeCloseTo(0.14, 12)
    expect(getOutOfRoundRecoveryAmountPreview({ workshopLevel: 300, workshopCurveMult: 0 })).toBeCloseTo(1.34, 12)
    expect(getOutOfRoundRecoveryAmountPreview({ workshopLevel: 300, workshopCurveMult: 0, labMult: 0.8 })).toBeCloseTo(2.14, 12)
    expect(workshopStatValue('Recovery Amount', 300)?.value).toBeCloseTo(0.0134, 12)
  })

  it('shares one chance formula between combat and Galaxy Compressor', () => {
    const input = { workshopValue: 0.3, labLevel: 20, hasRecoveryCard: true, cardValue: 0.33,
      primarySubstat: 0.15, assistSubstat: 0.15, stoneCap: 0, labCap: 30 }
    expect(recoveryPackageChance(input)).toBeCloseTo(0.8665, 12)
    expect(galaxyCompressorTimeBoost({ ...input, packageAfterBossLevel: 1, bossWave: 10,
      galaxyCompressorValue: 20, waveDurationSeconds: 35 })).toBe(recoveryPackageTimeBoost({
      chance: recoveryPackageChance(input), afterBoss: true, bossWaveInterval: 10,
      galaxyCompressorValue: 20, waveDurationSeconds: 35 }))
  })
})
