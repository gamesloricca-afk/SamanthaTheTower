/**
 * A `List<T>` serialises its BACKING ARRAY, and the tail is not yours.
 *
 * `_items` is the capacity, `_size` is how many of those elements are real.
 * In the repo's own save, **29 of 50** list fields have `_items.length > _size`,
 * and the padding is frequently NOT null: `tournamentRecords` carries 80
 * non-null stale entries past its end, `moduleRecords` 106, `mails` 5.
 *
 * `readSaveNumberSource` always truncated. Three other readers — modules, bots
 * and battle history — took `_items` whole, and their safety rested entirely on
 * the padding happening to be null in the save someone tested with. For battle
 * history that is a run the player never played, and `looksLikeBattleRun`
 * cannot tell the difference: a stale entry has every field it checks for.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { findBattleHistoryItems } from '../../src/save/battle/history'
import { readSaveListItems, readSaveNumberSource } from '../../src/save/access/values'

/*
 * The save fixture is one person's real account data. `/test/` is gitignored, so this file is
 * absent in a clone and in CI — and it is resolved from THIS file rather than from the working
 * directory, which is why the suite used to pass from the repo root and fail from the package.
 */
const SAVE_FIXTURE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  'test',
  'playerInfo.json',
)
const HAS_SAVE = existsSync(SAVE_FIXTURE)

const realSave = (HAS_SAVE
  ? JSON.parse(readFileSync(SAVE_FIXTURE, 'utf8'))
  : {}) as Record<string, unknown>

describe.skipIf(!HAS_SAVE)('readSaveListItems', () => {
  it('stops at _size and leaves the padding behind', () => {
    const list = { _items: [1, 2, 3, 'stale', 'stale'], _size: 3 }
    expect(readSaveListItems(list)).toEqual([1, 2, 3])
  })

  it('keeps everything when the list cannot say how long it is', () => {
    // A list with no readable `_size` must not silently read as empty.
    expect(readSaveListItems({ _items: [1, 2, 3] })).toEqual([1, 2, 3])
    expect(readSaveListItems({ _items: [1, 2], _size: 'nonsense' })).toEqual([1, 2])
  })

  it('handles a bare array, an empty list and a non-object', () => {
    expect(readSaveListItems([1, 2])).toEqual([1, 2])
    expect(readSaveListItems({ _items: [], _size: 0 })).toEqual([])
    expect(readSaveListItems(null)).toEqual([])
    expect(readSaveListItems('nope')).toEqual([])
  })

  it('does not read past the array when _size overstates it', () => {
    // A corrupt `_size` must not invent undefined entries.
    expect(readSaveListItems({ _items: [1, 2], _size: 99 })).toEqual([1, 2])
  })

  it('is what readSaveNumberSource does, so the two cannot drift', () => {
    const list = { _items: [4, 5, 6, 0, 0], _size: 3 }
    expect(readSaveNumberSource(list)).toEqual(readSaveListItems(list))
  })
})

describe.skipIf(!HAS_SAVE)('the real save proves the padding is there', () => {
  it('has list fields whose capacity exceeds their size', () => {
    const lists = Object.entries(realSave).filter(([, value]) =>
      value && typeof value === 'object' && !Array.isArray(value)
      && Array.isArray((value as { _items?: unknown })._items))
    expect(lists.length, 'no List<T> fields found — the fixture changed shape')
      .toBeGreaterThan(20)

    const padded = lists.filter(([, value]) => {
      const list = value as { _items: unknown[], _size: number }
      return list._items.length > list._size
    })
    expect(padded.length, 'padding no longer occurs — this guard can be reconsidered')
      .toBeGreaterThan(10)
  })

  it('has NON-NULL padding somewhere, which is the whole risk', () => {
    /*
     * If every tail were null the readers would be accidentally fine. They are
     * not: this asserts the hazard exists rather than assuming it.
     */
    const withStale = Object.entries(realSave).filter(([, value]) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return false
      const list = value as { _items?: unknown[], _size?: number }
      if (!Array.isArray(list._items) || typeof list._size !== 'number') return false
      return list._items.slice(list._size).some(entry => entry !== null && entry !== 0)
    })
    expect(withStale.length, 'no stale padding in the fixture').toBeGreaterThan(3)
  })

  it('reads battle history at its size, not its capacity', () => {
    const items = findBattleHistoryItems(realSave)
    const raw = realSave.battleHistory as { _items: unknown[], _size: number }
    expect(items, 'no battle history in the fixture').not.toBeNull()
    expect(items!.length).toBe(raw._size)
    expect(items!.length).toBeLessThan(raw._items.length)
  })
})
