import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listActivePerkIndices } from '../../src/save/catalogs/perks'
import { computeUnbannedPerkIndices, readPerkChoicesFromSaveRoot } from '../../src/save/perks/read'
import { FIXTURES } from '../helpers/paths'

/** Synthetic, and inside the package, so a fork can run this without a save of its own. */
const fixtureDir = join(FIXTURES, 'save')
const playerInfo = JSON.parse(
  readFileSync(join(fixtureDir, 'perk-preferences.sample.json'), 'utf8'),
) as Record<string, unknown>

describe('computeUnbannedPerkIndices', () => {
  it('returns active catalog indices minus banned set', () => {
    const banned = [5, 14, 2, 13, 4, 47, 43, 49]
    const unbanned = computeUnbannedPerkIndices(banned)
    expect(unbanned).toHaveLength(listActivePerkIndices().length - banned.length)
    for (const index of banned) {
      expect(unbanned).not.toContain(index)
    }
    expect(unbanned).toContain(10)
    expect(unbanned).toContain(27)
  })
})

/*
 * What the save stores, and only that. Resolving names and filling defaults for a tool to persist
 * is the platform layer's `readPerkPreferencesFromSaveRoot`, tested there against a real save.
 */
describe('readPerkChoicesFromSaveRoot', () => {
  it('reads the banned perks, first picks and auto-pick order from their save fields', () => {
    const result = readPerkChoicesFromSaveRoot(playerInfo)

    expect(result).not.toBeNull()
    expect(result!.bannedIndices).toEqual([2, 4, 5, 14, 43, 46, 47, 49])
    expect(result!.firstPerkIndex).toBe(10)
    expect(result!.firstTradeOffPerkIndex).toBeNull()
    expect(result!.autoPickPerk).toBe(true)
    expect(result!.autoPickOrder).toHaveLength(34)
    expect(result!.autoPickOrder[0]).toBe(10)
  })

  it('reads nothing from no save', () => {
    expect(readPerkChoicesFromSaveRoot(null)).toBeNull()
  })
})
