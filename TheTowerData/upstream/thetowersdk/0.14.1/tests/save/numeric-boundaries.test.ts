/** Numeric wrappers and positional lab arrays must not turn damaged input into another lab. */
import { describe, expect, it } from 'vitest'
import { coerceSaveNumber, readSaveEnumValue } from '../../src/save/access/values'
import { readLabsFromSaveRoot } from '../../src/save/labs/read'

describe('save numeric boundaries', () => {
  it('accepts supported wrappers but refuses non-finite and inherited values', () => {
    expect(coerceSaveNumber({ mantissa: 1.25, exponent: 3 })).toBe(1250)
    expect(coerceSaveNumber({ __value: { value__: 7n } })).toBe(7)
    expect(coerceSaveNumber(10n ** 400n)).toBeNull()
    expect(coerceSaveNumber({ mantissa: 1, exponent: 400 })).toBeNull()
    expect(coerceSaveNumber(Object.create({ __value: 7 }))).toBeNull()
    expect(readSaveEnumValue(Object.create({ value__: 7 }))).toBeNull()
    expect(readSaveEnumValue({ value__: 7 })).toBe(7)
    const cyclic: { __value?: unknown } = {}
    cyclic.__value = cyclic
    expect(coerceSaveNumber(cyclic)).toBeNull()
    let nested: unknown = 7
    for (let index = 0; index < 1000; index += 1) nested = { __value: nested }
    expect(coerceSaveNumber(nested)).toBeNull()
  })

  it('keeps research and queue coordinates when an entry is unreadable', () => {
    const result = readLabsFromSaveRoot({
      researchLevel: [1, null, 7],
      researchPercentComplete: [0.1, null, 0.7],
      labLevel: [1, null, 3],
      labResearchInt: [0, null, 2],
      labActiveBool: [true, false, true],
      labSpeedUpSpeed: [2, null, 4],
      labSpeedUpRemainingSeconds: [10, null, 30],
    })!
    expect(result.researches.map(row => [row.index, row.level, row.percentComplete])).toEqual([[0, 1, 0.1], [2, 7, 0.7]])
    expect(result.activeQueue[1].research).toBeNull()
    expect(result.activeQueue[2]).toMatchObject({ slotIndex: 2, labLevel: 3, researchInt: 2, speedUp: 4, speedUpRemainingSeconds: 30, research: { index: 2, level: 7 } })
    expect(result.speedUpSpeed).toEqual([2, null, 4])
    expect(result.warnings).toContain('researchLevel[1] is unreadable; its position is preserved as unknown.')
  })
})
