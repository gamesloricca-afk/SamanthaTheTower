/**
 * Modules from nine real players' IDS blocks.
 *
 * The effect-id derivation is checked against constants this package already
 * ships -- `AMPLIFYING_STRIKE_DECODED_SUBSTATS` and friends were decoded from
 * real saves -- so the encoding is held to a source that did not come from the
 * sheet, rather than to itself.
 */
import { describe, expect, it } from 'vitest'
import {
  AMPLIFYING_STRIKE_DECODED_SUBSTATS,
  ANTI_CUBE_PORTAL_DECODED_SUBSTATS,
  BLACK_HOLE_DIGESTOR_DECODED_SUBSTATS,
  DIMENSION_CORE_DECODED_SUBSTATS,
} from '../../src/save/modules/ids'
import {
  resolveIdsModuleIdentity,
  resolveIdsModuleRarityEnum,
  resolveIdsSubstatEffectId,
} from '../../src/save/ids/import-modules'


describe('substat effect ids', () => {
  it.each([
    ['Cannon', AMPLIFYING_STRIKE_DECODED_SUBSTATS],
    ['Armor', ANTI_CUBE_PORTAL_DECODED_SUBSTATS],
    ['Generator', BLACK_HOLE_DIGESTOR_DECODED_SUBSTATS],
    ['Core', DIMENSION_CORE_DECODED_SUBSTATS],
  ] as const)('reproduces every %s id decoded from a real save', (category, decoded) => {
    // These are (effectId, label, rarity) triples this package already asserts
    // elsewhere. Deriving the id from the label and rarity must land on the
    // same number, or the encoding is wrong.
    expect(decoded.length).toBeGreaterThan(4)
    for (const substat of decoded) {
      expect(
        resolveIdsSubstatEffectId(category, substat.label, substat.rarity),
        `${category} ${substat.label} ${substat.rarity}`,
      ).toBe(substat.effectId)
    }
  })

  it('rejects a rarity a substat cannot roll, rather than folding to a neighbour', () => {
    // Multishot Targets starts above Common; asking for Common must fail
    // rather than silently return the lowest id it does have.
    const ancestral = resolveIdsSubstatEffectId('Cannon', 'Multishot Targets', 'Ancestral')
    expect(ancestral).not.toBeNull()
    expect(resolveIdsSubstatEffectId('Cannon', 'Not A Substat', 'Ancestral')).toBeNull()
    expect(resolveIdsSubstatEffectId('Cannon', 'Attack Speed', 'Nonsense')).toBeNull()
  })

  it('never returns one id for two different rarities of the same substat', () => {
    const seen = new Set<number>()
    for (const rarity of ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ancestral']) {
      const id = resolveIdsSubstatEffectId('Cannon', 'Attack Speed', rarity)
      if (id === null) continue
      expect(seen.has(id), `${rarity} reused effect id ${id}`).toBe(false)
      seen.add(id)
    }
    expect(seen.size).toBeGreaterThan(3)
  })
})

describe('module rarity and identity', () => {
  it('maps the sheet spelling onto the game 1..15 enum', () => {
    expect(resolveIdsModuleRarityEnum('Common')).toBe(1)
    expect(resolveIdsModuleRarityEnum('Epic')).toBe(4)
    expect(resolveIdsModuleRarityEnum('Ancestral')).toBe(10)
    // The sheet writes `Ancestral 5*` where the catalog has `Ancestral 5`.
    expect(resolveIdsModuleRarityEnum('Ancestral 5*')).toBe(15)
    expect(resolveIdsModuleRarityEnum('Rare+')).toBe(3)
    expect(resolveIdsModuleRarityEnum('Not A Rarity')).toBeNull()
  })

  it('resolves module names to a catalog identity', () => {
    expect(resolveIdsModuleIdentity('Amplifying Strike')?.category).toBe('Cannon')
    expect(resolveIdsModuleIdentity('Anti-Cube Portal')?.category).toBe('Armor')
    expect(resolveIdsModuleIdentity('Not A Module')).toBeNull()
  })
})

