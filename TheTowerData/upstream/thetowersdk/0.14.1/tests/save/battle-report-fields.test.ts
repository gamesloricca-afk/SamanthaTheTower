import { describe, expect, it } from 'vitest'

import {
  buildBattleReportStatFields,
  getBattleReportExtendedSaveKeysForTest,
} from '../../src/save/battle/report-fields'

describe('buildBattleReportStatFields', () => {
  it('maps save aliases onto run stat keys', () => {
    const mapped = buildBattleReportStatFields({
      highestCPM: 3_135_332_723_149_766_700,
      nukesUsed: 1,
      secondWindsUsed: 3,
      demonModesUsed: 1,
      energyShieldHitsAbsorbed: 97,
      largestWaveSkip: 12,
      enemiesHitByProjectilesThisRound: 581_510,
      attackLevelSkips: 4,
      coinsEarnedWaveSkip: 50_000_000,
      largestILMCharge: 0,
      magicOrbBlocked: 0,
      guardianGems: 9,
      guardianMedals: 3,
    })

    expect(mapped.highestCoinsPerMinute).toBeTruthy()
    expect(mapped.nukeCount).toBe('1')
    expect(mapped.secondWindCount).toBe('3')
    expect(mapped.demonModeCount).toBe('1')
    expect(mapped.hitsAbsorbedByEnergyShield).toBe('97')
    expect(mapped.largestWaveSkip).toBeTruthy()
    expect(mapped.enemiesHitByProjectiles).toBeTruthy()
    expect(mapped.enemyAttackLevelsSkipped).toBeTruthy()
    expect(mapped.coinsFromWaveSkip).toBeTruthy()
    expect(mapped.largestInnerLandmineCharge).toBe('0')
    expect(mapped.negativeMassProjectorBlocked).toBe('0')
    expect(mapped.fetchGems).toBe('9')
    expect(mapped.medalsEarned).toBe('3')
  })

  it('derives per-hour and coins-per-kill stats from save totals', () => {
    const mapped = buildBattleReportStatFields({
      realTime: 3600,
      coinsEarned: 3_600_000,
      cellsEarned: 3_600,
      rerollShardsEarned: 36,
      totalEnemies: 1000,
    })

    expect(mapped.coinsPerHour).toBeTruthy()
    expect(mapped.cellsPerHour).toBeTruthy()
    expect(mapped.rerollShardsPerHour).toBeTruthy()
    expect(mapped.coinsPerKill).toBeTruthy()
  })

  it('maps destroyedInGoldenBot from save key', () => {
    const mapped = buildBattleReportStatFields({
      destroyedInGoldenBot: 950_458,
    })

    expect(mapped.destroyedInGoldenBot).toBe('950458')
  })

  it('maps ultimate kill save aliases onto tracker stat keys', () => {
    expect(buildBattleReportStatFields({ destroyedByDeathWave: 42 }).killsWithDeathWave).toBe('42')
    expect(buildBattleReportStatFields({ destroyedInBlackhole: 7 }).killsWithBlackHole).toBe('7')
    expect(buildBattleReportStatFields({ destroyedInOrbs: 9 }).killsWithOrbs).toBe('9')
  })

  it('defaults omitted zero-valued battle report stats', () => {
    const mapped = buildBattleReportStatFields({
      enemiesHitByAttackChipThisRound: 0,
    })

    expect(mapped.attackChipDamage).toBe('0')
    expect(mapped.bountyCoins).toBe('0')
  })

  it('resolves land mine hit alias', () => {
    expect(getBattleReportExtendedSaveKeysForTest('enemiesHitByLandMines')).toContain(
      'enemiesHitByLandMineThisRound',
    )
  })

  it('maps healthFromRecoveryPackages and guardianCatches aliases', () => {
    expect(getBattleReportExtendedSaveKeysForTest('healthFromRecoveryPackages')).toEqual(
      expect.arrayContaining(['recoveryPackagesRegen', 'healthFromRecoveryPackages']),
    )
    expect(getBattleReportExtendedSaveKeysForTest('guardianCatches')).toContain('guardianCatches')

    const mapped = buildBattleReportStatFields({
      recoveryPackagesRegen: 12_345,
      guardianCatches: 7,
    })
    expect(mapped.healthFromRecoveryPackages).toBeTruthy()
    expect(mapped.guardianCatches).toBe('7')
  })
})
