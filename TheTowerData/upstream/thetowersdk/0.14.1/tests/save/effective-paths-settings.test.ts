import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { readEffectivePathsSettingsFromSaveRoot } from '../../src/save/effective-paths/settings'

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

describe.skipIf(!HAS_SAVE)('the tier a player has actually reached', () => {
  it('takes the last tier with a wave, not the tier they are sitting on', () => {
    // The distinction that matters: `currentTier` is where they are, and it is
    // routinely lower than the furthest they have cleared. Ranking against the
    // lower one understates every path.
    const settings = readEffectivePathsSettingsFromSaveRoot({
      currentTier: 3,
      highestWaveThisTier: [100, 200, 300, 0, 450, 0],
    })
    expect(settings.highestTier).toBe(5)
    expect(settings.highestWave).toBe(450)
  })

  it('ignores the trailing zeros the save pads the array with', () => {
    const settings = readEffectivePathsSettingsFromSaveRoot({
      highestWaveThisTier: [100, 0, 0, 0, 0, 0, 0, 0],
    })
    expect(settings.highestTier).toBe(1)
  })

  it('reports nothing rather than tier 1 for a save with no waves', () => {
    // A brand-new player, and a save the reader could not understand, look the
    // same here. Defaulting to tier 1 would be indistinguishable from a real
    // answer, so both say "nothing to import".
    const settings = readEffectivePathsSettingsFromSaveRoot({ highestWaveThisTier: [] })
    expect(settings.highestTier).toBeNull()
    expect(settings.highestWave).toBeNull()
  })
})

describe.skipIf(!HAS_SAVE)('game speed', () => {
  it('comes from the remembered speed', () => {
    expect(readEffectivePathsSettingsFromSaveRoot({ gameSpeedMemory: 5 }).gameSpeed).toBe(5)
  })

  it('treats zero as unknown rather than as a speed', () => {
    // A zero game speed would divide every lab timing into infinity.
    expect(readEffectivePathsSettingsFromSaveRoot({ gameSpeedMemory: 0 }).gameSpeed).toBeNull()
  })
})

describe.skipIf(!HAS_SAVE)('the per-tier curve', () => {
  /*
   * Conditional, because `describe.skipIf` does not stop this from running. Vitest still
   * executes a skipped suite's BODY to discover its tests — only the tests themselves are
   * skipped — so an unconditional read here fails collection on any machine without the
   * fixture, which is every machine but one.
   */
  const realSave = (HAS_SAVE
    ? JSON.parse(readFileSync(SAVE_FIXTURE, 'utf8'))
    : {}) as Record<string, unknown>

  it('returns every tier the player has a wave on, not just the furthest', () => {
    /*
     * The array was already being read to find `highestTier` and then thrown
     * away, so a save-only player had an empty `wavesByCampaignTier` while an
     * IDS import filled it from the same numbers.
     */
    const settings = readEffectivePathsSettingsFromSaveRoot(realSave)
    const tiers = Object.keys(settings.wavesByTier).map(Number)
    expect(tiers.length, 'this save should have progress on several tiers')
      .toBeGreaterThan(1)
    // The furthest point must be one of the entries, and must agree with it.
    expect(settings.wavesByTier[settings.highestTier!]).toBe(settings.highestWave)
    expect(Math.max(...tiers)).toBe(settings.highestTier)
  })

  it('leaves an untouched tier absent rather than recording a best of zero', () => {
    const settings = readEffectivePathsSettingsFromSaveRoot({
      highestWaveThisTier: [120, 0, 45],
    })
    expect(settings.wavesByTier).toEqual({ 1: 120, 3: 45 })
    // Tiers are 1-based; a 0-based key here would misprice every tier.
    expect(settings.wavesByTier[0]).toBeUndefined()
  })
})
