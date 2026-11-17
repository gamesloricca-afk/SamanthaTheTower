import { describe, expect, it } from 'vitest'
import {
  ASSET_DOMAINS,
  ASSET_SIZES,
  assetSlug,
  gameAssetPath,
  gameAssetPaths,
  towerAssetUrl,
} from '../../src/assets'

/**
 * The artwork helpers build paths into a directory the CALLER supplies.
 *
 * This package ships no images and no catalogue of them. It used to ship a catalogue — 1,059
 * sprite names read out of the game — and that was withdrawn: a list naming every asset is
 * derived from the game whoever typed it, and there is no permission to redistribute the art or
 * anything that closely describes it.
 *
 * What is left is the naming rule, which is this project's own. These tests pin the rule, because
 * a caller laying out their own directory has to apply the same one — two implementations of a
 * convention is how a name stops matching its file.
 */

describe('artwork paths', () => {
  it('slugifies the way the layout expects', () => {
    expect(assetSlug('Om Chip')).toBe('om-chip')
    expect(assetSlug('Amplifying Strike')).toBe('amplifying-strike')
    expect(assetSlug('Damage / Meter')).toBe('damage-meter')
    expect(assetSlug('  Spaced  Out  ')).toBe('spaced-out')
  })

  it('never produces a leading, trailing or doubled hyphen', () => {
    for (const name of ['  ', '---', 'A  —  B', '!Bang!']) {
      const slug = assetSlug(name)
      expect(slug, name).not.toMatch(/^-|-$|--/)
    }
  })

  it('builds a path from a name, a domain and a size', () => {
    expect(gameAssetPath('Om Chip', { domain: 'modules' })).toBe('modules/om-chip-md.webp')
    expect(gameAssetPath('Om Chip', { domain: 'modules', size: 'lg' }))
      .toBe('modules/om-chip-lg.webp')
    expect(gameAssetPath('Slow Aura', { domain: 'cards', extension: 'png' }))
      .toBe('cards/slow-aura-md.png')
  })

  it('defaults to the middle size', () => {
    expect(gameAssetPath('Om Chip', { domain: 'modules' }))
      .toBe(gameAssetPath('Om Chip', { domain: 'modules', size: 'md' }))
  })

  it('returns null rather than a path to nothing', () => {
    /*
     * A name that slugifies away would otherwise produce `modules/-md.webp`, which looks like a
     * real path and resolves to a missing file — and a missing image does not throw, it renders
     * as a gap on one card.
     */
    expect(gameAssetPath('   ', { domain: 'modules' })).toBeNull()
    expect(gameAssetPath('!!!', { domain: 'modules' })).toBeNull()
    expect(gameAssetPath('Om Chip', { domain: '' })).toBeNull()
    expect(gameAssetPaths('!!!', { domain: 'modules' })).toBeNull()
  })

  it('gives every size at once for a srcset', () => {
    const all = gameAssetPaths('Om Chip', { domain: 'modules' })
    expect(Object.keys(all ?? {})).toEqual([...ASSET_SIZES])
    expect(all?.sm).toBe('modules/om-chip-sm.webp')
  })

  it('joins to whatever host serves the art', () => {
    const path = gameAssetPath('Om Chip', { domain: 'modules' })
    expect(towerAssetUrl(path, '/art')).toBe('/art/modules/om-chip-md.webp')
    expect(towerAssetUrl(path, 'https://cdn.example.com/art/'))
      .toBe('https://cdn.example.com/art/modules/om-chip-md.webp')
    expect(towerAssetUrl(null, '/art'), 'nothing in, nothing out').toBeNull()
  })

  it('names the domains without describing what is in them', () => {
    // Game categories, the same ones the data catalogs use — not a reading of the game files.
    expect(ASSET_DOMAINS).toContain('modules')
    expect(ASSET_DOMAINS).toContain('relics')
    expect(ASSET_DOMAINS.length).toBeGreaterThan(10)
  })

  it('ships no catalogue of the game\'s own filenames', async () => {
    /*
     * The point of the withdrawal, asserted rather than trusted. If a generated catalogue is ever
     * re-exported from here, this fails and the decision gets made again deliberately.
     */
    const module = await import('../../src/assets')
    const exported = Object.keys(module)
    for (const withdrawn of ['GAME_ASSETS', 'UNIDENTIFIED_GAME_SPRITES', 'MODULE_ASSET_FILES', 'CARD_ASSET_FILES']) {
      expect(exported, `${withdrawn} names the game's own files and must not ship`).not.toContain(withdrawn)
    }
  })
})
