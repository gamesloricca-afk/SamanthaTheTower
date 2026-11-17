import { describe, expect, it } from 'vitest'
import { countImportableBattleRuns, findBattleHistoryItems } from '../../src/save/battle/history'

describe('battle history from save', () => {
  it('finds battleHistory regardless of key casing', () => {
    const items = findBattleHistoryItems({
      BattleHistory: { _items: [{ tier: 1, wave: 10 }] },
    })
    expect(items).toHaveLength(1)
  })

  it('counts runs with tier even when isTournament is absent', () => {
    const count = countImportableBattleRuns({
      battleHistory: { _items: [{ tier: 5, wave: 100, battleDate: {} }] },
    })
    expect(count).toBe(1)
  })
})
