import { describe, expect, it } from 'vitest'
import { normalizeBattleHistorySaveEntry } from '../../src/save/battle/history-normalize'
import { buildBattleReportStatFields } from '../../src/save/battle/report-fields'
import { buildRunData } from '../../src/save/battle/reports'

describe('normalizeBattleHistorySaveEntry', () => {
  it('maps ThisRound snapshot keys onto legacy stitched-run keys', () => {
    const normalized = normalizeBattleHistorySaveEntry({
      tier: 21,
      wave: 7779,
      realTimeThisRound: 25_223,
      coinsEarnedThisRound: 740_180_000_000_000_000,
      cellsEarnedThisRound: 3_010_000,
      rerollCurrencyEarnedThisRound: 935_550,
      totalEnemiesDestroyedThisRound: 1_000_000,
      enemiesDestroyedInSpotlightThisRound: 1_000_000,
      totalEnemiesTaggedByDeathwaveThisRound: 870_000,
      orbHitsThisRound: 640_000,
      enemiesKilledInGoldenBotThisRound: 510_000,
      totalSummonedByGuardianThisRound: 95_000,
    })

    expect(normalized.realTime).toBe(25_223)
    expect(normalized.coinsEarned).toBe(740_180_000_000_000_000)
    expect(normalized.totalEnemies).toBe(1_000_000)
    expect(normalized.destroyedInSpotlight).toBe(1_000_000)
    expect(normalized.taggedByDeathwave).toBe(870_000)
    expect(normalized.orbHits).toBe(640_000)
    expect(normalized.enemiesKilledInGoldenBot).toBe(510_000)
    expect(normalized.guardianSummoned).toBe(95_000)
  })
})

describe('buildRunData stitched import payload', () => {
  it('produces one unified local run object with extended stats before cloud split', () => {
    const run = buildRunData({
      tier: 21,
      wave: 7779,
      realTime: 25_223,
      coinsEarned: 740_180_000_000_000_000,
      cellsEarned: 3_010_000,
      rerollShardsEarned: 935_550,
      battleDate: { __value: '2026-06-27T15:56:00.000Z' },
      totalEnemies: 1_000_000,
      destroyedInGoldenTower: 850_000,
      blackHoleHits: 720_000,
      orbHits: 640_000,
      taggedByDeathwave: 870_000,
      destroyedInSpotlight: 1_000_000,
      enemiesKilledInGoldenBot: 510_000,
      enemiesKilledInAmplifyBot: 420_000,
      guardianSummoned: 95_000,
    })

    expect(run.killsWithGoldenTower).toBeTruthy()
    expect(run.enemiesHitByBlackHole).toBeTruthy()
    expect(run.enemiesHitByOrbs).toBeTruthy()
    expect(run.destroyedInGoldenBot).toBeTruthy()
    expect(run.killsWithAmplifyBot).toBeTruthy()
    expect(run.guardianSummonedEnemies).toBeTruthy()
    expect(buildBattleReportStatFields(run).totalEnemies).toBeTruthy()
  })
})
