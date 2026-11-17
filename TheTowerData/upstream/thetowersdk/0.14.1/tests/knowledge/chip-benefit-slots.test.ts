import { describe, expect, it } from 'vitest'
import { guardianUpgrades } from '../../src/data/guardians/upgrades.data'
import {
  GAME_CHIP_TYPE_VALUES, GUARDIAN_RELEASED_CHIPS,
  GUARDIAN_UNRELEASED_CHIP_TYPES, GUARDIAN_UPGRADE_TRACKS,
} from '../../src/knowledge/compartments/guardian'

describe('released guardian chip upgrade tracks', () => {
  it('matches the released chip list to the six available upgrade tables', () => {
    const tabled = Object.keys(guardianUpgrades)
      .map(chip => chip.charAt(0).toUpperCase() + chip.slice(1))
    expect(GUARDIAN_RELEASED_CHIPS).toHaveLength(6)
    expect(tabled.sort()).toEqual([...GUARDIAN_RELEASED_CHIPS].sort())
  })

  it('keeps Repair out of the released list', () => {
    expect(GUARDIAN_UNRELEASED_CHIP_TYPES).toEqual(['Repair'])
    for (const chip of GUARDIAN_UNRELEASED_CHIP_TYPES) {
      expect(GUARDIAN_RELEASED_CHIPS).not.toContain(chip)
      expect(GAME_CHIP_TYPE_VALUES).toContain(chip)
    }
  })

  it('includes Summon cashBonus among the named upgrade tracks', () => {
    expect(GUARDIAN_UPGRADE_TRACKS.some(track => track.chip === 'summon' && track.track === 'cashBonus'))
      .toBe(true)
  })
})
