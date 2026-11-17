import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { MODULE_INFO_CATALOG } from '../../src/data/modules/info.data'

/**
 * `iconName` is the binding used to name module art: it matches a
 * catalog row to a sprite by that exact string. An `iconName` that references no real
 * sprite makes the module render with no icon — silently, because nothing reads it back.
 *
 * Display-name icon keys such as `Death Penalty` must retain the exact spelling
 * expected by the art manifest; constructing a key from a suffix can break that binding.
 *
 * The tracked art manifest (`packages/tower-assets/assets/game/manifest.json`) is the only
 * in-repo authority for which sprites exist. The guard checks two cases:
 *
 *   1. Every module whose art IS in the manifest must have an iconName that resolves.
 *      That locks existing catalog bindings against regression.
 *   2. Modules whose art is not yet listed (`ART_PENDING`) must still use the correct
 *      space-form convention — their iconName must equal their display `name`. That is the
 *      form expected by this catalog. Once the manifest includes them, they drop out
 *      of the pending set; anything left is a visible, deliberate exception.
 */

const MANIFEST_PATH = fileURLToPath(
  new URL('../../../tower-assets/assets/game/manifest.json', import.meta.url),
)
// The art manifest lives in the sibling tower-assets package, not in this package. When the
// published surface is cloned and verified in isolation it is absent, so skip rather than fail.
const HAS_MANIFEST = existsSync(MANIFEST_PATH)

// Modules present in the catalog but whose art has not been extracted into the manifest
// yet. Shrink this to empty when v29 art is re-extracted — do not grow it.
const ART_PENDING = new Set([
  'Acceleration Augment',
])

function spriteNames(): Set<string> {
  if (!HAS_MANIFEST) return new Set<string>()
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as {
    assets: Array<{ name?: string; spriteName?: string }>
  }
  const names = new Set<string>()
  for (const asset of manifest.assets) {
    if (asset.name) names.add(asset.name)
    if (asset.spriteName) names.add(asset.spriteName)
  }
  return names
}

describe.skipIf(!HAS_MANIFEST)('module iconName resolves to real art', () => {
  const sprites = spriteNames()
  const withIcon = MODULE_INFO_CATALOG.filter(m => m.iconName)

  it('has modules with iconNames to check', () => {
    expect(withIcon.length).toBeGreaterThan(40)
  })

  it('every extracted module iconName matches a real sprite', () => {
    const broken = withIcon
      .filter(m => !ART_PENDING.has(m.name))
      .filter(m => !sprites.has(m.iconName as string))
      .map(m => `${m.name} -> ${m.iconName as string}`)

    expect(
      broken,
      'These module iconNames reference no sprite in the art manifest. iconName must be '
      + 'the exact sprite name; an invented one makes the module render iconless. If the '
      + 'art genuinely is not extracted yet, add the module to ART_PENDING with a reason.',
    ).toEqual([])
  })

  it('art-pending modules use the space-form display-name convention', () => {
    // Until their art is in the manifest, we cannot check resolution — but we can reject
    // the specific error that caused this test to exist: an `Name_rarity_variant` iconName
    // where the real sprite is the plain display name.
    const wrongForm = [...ART_PENDING]
      .map(name => MODULE_INFO_CATALOG.find(m => m.name === name))
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .filter(m => m.iconName !== m.name)
      .map(m => `${m.name} -> ${m.iconName as string} (expected "${m.name}")`)

    expect(
      wrongForm,
      'An art-pending module has an iconName that is not its display name. The real v29 '
      + 'sprites are the space-form display names; the underscore+rarity form matches '
      + 'nothing.',
    ).toEqual([])
  })
})
