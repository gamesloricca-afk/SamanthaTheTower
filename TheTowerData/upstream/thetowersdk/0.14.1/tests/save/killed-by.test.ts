import { describe, expect, it } from 'vitest'
import {
  enemyDisplayNameFromSaveEnumIndex,
  getKilledByFromSave,
  normalizeKilledByDisplayLabel,
  readKilledByEnumIndex,
} from '../../src/save/killed-by/read'

describe('killed-by-from-save', () => {
  it('extracts enum indices from NRBF enum objects and plain numbers', () => {
    expect(readKilledByEnumIndex({ value__: 3 })).toBe(3)
    expect(readKilledByEnumIndex({ value: 4 })).toBe(4)
    expect(readKilledByEnumIndex(2)).toBe(2)
    expect(readKilledByEnumIndex('5')).toBe(5)
    expect(readKilledByEnumIndex(null)).toBeNull()
  })

  // Locks the save-file index order. Asserting 4 = Boss or 11 = Overcharge
  // encodes a shifted table and misreports deaths from index 7 onward.
  it('maps save enum indices to canonical enemy names', () => {
    expect(enemyDisplayNameFromSaveEnumIndex(0)).toBe('Basic')
    expect(enemyDisplayNameFromSaveEnumIndex(2)).toBe('Tank')
    expect(enemyDisplayNameFromSaveEnumIndex(3)).toBe('Boss')
    expect(enemyDisplayNameFromSaveEnumIndex(4)).toBe('Ranged')
    expect(enemyDisplayNameFromSaveEnumIndex(5)).toBe('Protector')
    expect(enemyDisplayNameFromSaveEnumIndex(9)).toBe('Ray')
    expect(enemyDisplayNameFromSaveEnumIndex(10)).toBe('Saboteur')
    expect(enemyDisplayNameFromSaveEnumIndex(11)).toBe('Commander')
    expect(enemyDisplayNameFromSaveEnumIndex(12)).toBe('Overcharge')
    expect(enemyDisplayNameFromSaveEnumIndex(99)).toBe('Apathy')
    expect(enemyDisplayNameFromSaveEnumIndex(-1)).toBe('Apathy')
  })

  it('resolves killedBy save shapes without touching OCR labels', () => {
    expect(getKilledByFromSave({ value__: 1 })).toBe('Fast')
    expect(getKilledByFromSave({ value__: 2 })).toBe('Tank')
    expect(getKilledByFromSave(3)).toBe('Boss')
    expect(getKilledByFromSave(4)).toBe('Ranged')
    expect(getKilledByFromSave(5)).toBe('Protector')
    expect(getKilledByFromSave({ value__: 12 })).toBe('Overcharge')
    expect(getKilledByFromSave({ value__: 99 })).toBe('Apathy')
    expect(getKilledByFromSave({ typeName: 'Game.Enums.EnemyType+Ray', value__: 9 })).toBe('Ray')
    expect(getKilledByFromSave({ typeName: 'Assembly-CSharp.KilledByType+Apathy', value__: 99 })).toBe('Apathy')
    expect(getKilledByFromSave('  Range  ')).toBe('Ranged')
    expect(getKilledByFromSave(null)).toBe('Apathy')
    expect(getKilledByFromSave(undefined, 'Unknown')).toBe('Unknown')
  })

  it('normalizes common label variants', () => {
    expect(normalizeKilledByDisplayLabel('vampires')).toBe('Vampire')
    expect(normalizeKilledByDisplayLabel('')).toBe('Apathy')
  })
})
