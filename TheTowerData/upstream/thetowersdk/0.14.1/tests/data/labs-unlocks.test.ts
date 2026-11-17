import { describe, expect, it } from 'vitest'
import { LAB_CATALOG } from '../../src/data/labs/catalog.data'
import { LAB_RESEARCH_SLUG_TO_INDEX } from '../../src/data/labs/research'
import {
  furthestRunFromTierPersonalBests,
  isLabUnlockedAt,
  isLabUnlockedByTierPersonalBests,
  isLabUnlockedForPath,
  LAB_UNLOCKS,
  UNLOCKED_BY_ULTIMATE,
} from '../../src/data/labs/unlocks'

/**
 * The unlock table uses the Effective Paths sheet's lab names, so every name
 * must resolve to a lab in the SDK catalog.
 * A typo here would silently stop hiding a lab, which nothing else would catch.
 */
describe('lab unlock requirements', () => {
  it('names only labs the game actually has', () => {
    // The catalog punctuates differently from the sheet, and a handful of labs
    // exist only as research slugs with no display name, so this compares on
    // letters and digits across both tables.
    const key = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '')
    const known = new Set([
      ...LAB_CATALOG.map(entry => key(entry.name)),
      ...LAB_CATALOG.map(entry => key(entry.slug)),
      ...Object.keys(LAB_RESEARCH_SLUG_TO_INDEX).map(key),
    ])
    const unknown = Object.keys(LAB_UNLOCKS).filter(name => !known.has(key(name)))
    expect(unknown).toEqual([])
  })

  it('covers the labs the eHP path can buy', () => {
    // A missing entry silently makes a locked lab look available, so the ones
    // the path actually offers are worth naming.
    for (const lab of ['Chain Thunder', 'Wall Fortification', 'Death Wave Health']) {
      expect(LAB_UNLOCKS[lab], lab).toBeDefined()
    }
  })

  it('gates a lab on reaching its wave, on its tier', () => {
    // Chain Thunder unlocks at tier 16, wave 60.
    expect(LAB_UNLOCKS['Chain Thunder']).toEqual({ tier: 16, wave: 60 })
    expect(isLabUnlockedAt('Chain Thunder', 16, 59)).toBe(false)
    expect(isLabUnlockedAt('Chain Thunder', 16, 60)).toBe(true)
    expect(isLabUnlockedAt('Chain Thunder', 15, 5000)).toBe(false)
    expect(isLabUnlockedAt('Chain Thunder', 17, 1)).toBe(true)
  })

  it('treats a lab with no requirement as always available', () => {
    expect(LAB_UNLOCKS['Health']).toBeUndefined()
    expect(isLabUnlockedAt('Health', 1, 0)).toBe(true)
  })

  it('does not hide the one lab gated on an ultimate weapon', () => {
    expect(LAB_UNLOCKS['Inner Land Mine - Chrono Jump']).toBe(UNLOCKED_BY_ULTIMATE)
    expect(isLabUnlockedAt('Inner Land Mine - Chrono Jump', 1, 0)).toBe(true)
  })
})

describe('IDS_LAB_HAS_UNLOCKED parity (per-tier PBs)', () => {
  it('unlocks only from the PB on the lab’s unlock tier', () => {
    // Sheet semantics: furthest tier does not matter. Plant the fault the
    // highest-tier approximation would get wrong — T16 cleared, T7 never played.
    const pbs = { 7: 0, 16: 5000 }
    expect(LAB_UNLOCKS['Shock Multiplier']).toEqual({ tier: 7, wave: 60 })
    expect(isLabUnlockedByTierPersonalBests('Shock Multiplier', pbs)).toBe(false)
    expect(isLabUnlockedAt('Shock Multiplier', 16, 5000)).toBe(true)

    expect(isLabUnlockedByTierPersonalBests('Shock Multiplier', { 7: 60 })).toBe(true)
  })

  it('keeps T0 labs unlocked with an empty PB table', () => {
    // Oracle: Damage / Game Speed are `T0 ` → always true even when every CN is 0.
    expect(isLabUnlockedByTierPersonalBests('Health', { 1: 0, 5: 0 })).toBe(true)
  })

  it('prefers PBs in the path filter when they are present', () => {
    expect(isLabUnlockedForPath('Shock Multiplier', {
      wavesByCampaignTier: { 7: 0 },
      highestTier: 16,
      highestWave: 5000,
    })).toBe(false)

    expect(isLabUnlockedForPath('Shock Multiplier', {
      highestTier: 16,
      highestWave: 5000,
    })).toBe(true)
  })

  it('derives furthest run from non-zero PBs only', () => {
    expect(furthestRunFromTierPersonalBests({ 1: 0, 5: 200, 10: 50 }))
      .toEqual({ tier: 10, wave: 50 })
    expect(furthestRunFromTierPersonalBests({ 1: 0, 2: 0 }))
      .toEqual({ tier: 1, wave: 0 })
  })
})
