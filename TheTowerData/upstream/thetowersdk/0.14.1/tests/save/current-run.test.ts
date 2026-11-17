import { describe, expect, it } from 'vitest'
import { readCurrentRunFromSaveRoot } from '../../src/save'

describe('current-run save fields', () => {
  it('reads current arrays independently of purchased levels', () => {
    const result = readCurrentRunFromSaveRoot({ currentWave: 123, currentTier: 7,
      upgradeLevel: [100, 200], upgradeDefenseLevel: [300], upgradeUtilityLevel: [400],
      upgradeWorkshopLevel: [1], upgradeWorkshopDefenseLevel: [2] })
    expect(result?.upgradeLevel).toEqual([100, 200])
    expect(result?.upgradeDefenseLevel).toEqual([300])
    expect(result?.currentWave).toBe(123)
    expect(result?.unreadableKeys).toEqual([])
  })
  it('preserves array positions, extra slots and unknown integers', () => {
    const result = readCurrentRunFromSaveRoot({ upgradeLevel: [0, '1', null, -1, 1.5, 42] })
    expect(result?.upgradeLevel).toEqual([0, null, null, null, null, 42])
    expect(result?.upgradeDefenseLevel).toBeNull()
    expect(result?.currentWave).toBeNull()
  })
  it('does not fall back to workshop or invent an attack alias', () => {
    expect(readCurrentRunFromSaveRoot({ upgradeAttackLevel: [7], upgradeWorkshopLevel: [8] })?.upgradeLevel).toBeNull()
    expect(readCurrentRunFromSaveRoot(null)).toBeNull()
  })
})
