import { describe, expect, it } from 'vitest'
import { RELIC_TEMPLATES } from '../../../src/data/relics/data'
import { listUnlockedRelics, readRelicsFromSaveRoot, RELIC_STATE_UNLOCKED_VALUE } from '../../../src/save/relics/read'
import {
  buildRelicTemplateIdLookup,
  findRelicTemplateIdFromSaveIndex,
  normalizeRelicMatchKey,
} from '../../../src/save/catalogs/relic-template-match'

describe('relic-template-match', () => {
  it('normalizes spaced and roman tier relic names', () => {
    expect(normalizeRelicMatchKey('Gold Badge')).toBe('goldbadge')
    expect(normalizeRelicMatchKey('GoldBadge')).toBe('goldbadge')
    expect(normalizeRelicMatchKey('T:II Lumin')).toBe('t:2lumin')
    expect(normalizeRelicMatchKey('T:2 Lumin')).toBe('t:2lumin')
    expect(normalizeRelicMatchKey('T: VI Nova')).toBe('t:6nova')
  })

  it('resolves catalog save indices to tracker template ids', () => {
    const lookup = buildRelicTemplateIdLookup(RELIC_TEMPLATES)
    expect(findRelicTemplateIdFromSaveIndex(4, RELIC_TEMPLATES, lookup)).toBe('2-Epic-2')
    expect(findRelicTemplateIdFromSaveIndex(9, RELIC_TEMPLATES, lookup)).toBe('1-Rare-5')
    expect(findRelicTemplateIdFromSaveIndex(13, RELIC_TEMPLATES, lookup)).toBe('2-Epic-4')
    expect(findRelicTemplateIdFromSaveIndex(14, RELIC_TEMPLATES, lookup)).toBe('2-Epic-5')
    expect(findRelicTemplateIdFromSaveIndex(15, RELIC_TEMPLATES, lookup)).toBe('2-Epic-6')
    expect(findRelicTemplateIdFromSaveIndex(87, RELIC_TEMPLATES, lookup)).toBe('3-Legendary-10')
  })
})

describe('relic state reader', () => {
  it('reads primitive numeric enum states rather than only profile relics', () => {
    const unlocked = RELIC_STATE_UNLOCKED_VALUE + 1
    const result = readRelicsFromSaveRoot({ relicsUnlocked: [unlocked, 0, unlocked] })!
    expect(listUnlockedRelics(result).map(row => row.index)).toEqual([0, 2])
  })

  it('preserves mixed booleans, enum objects and numeric states plus the profile union', () => {
    const result = readRelicsFromSaveRoot({ profileRelics: [7], relicsUnlocked: [true, false,
      RELIC_STATE_UNLOCKED_VALUE, { value__: RELIC_STATE_UNLOCKED_VALUE },
      { typeName: 'RelicState', value__: 0 }, { unlocked: true }, 0] })!
    expect(listUnlockedRelics(result).map(row => row.index)).toEqual([0, 2, 3, 5, 7])
  })

  it('reads a realistic 336-slot primitive state shape without private fixture contents', () => {
    const result = readRelicsFromSaveRoot({ relicsUnlocked: [
      ...Array(314).fill(RELIC_STATE_UNLOCKED_VALUE + 1), ...Array(22).fill(0),
    ] })!
    expect(result.unlockedCount).toBe(314)
    expect(listUnlockedRelics(result)).toHaveLength(314)
  })
})
