import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CARD_IMPORT_CATALOG } from '../../src/data'
import { GUARDIAN_CHIP_CATALOG, THEME_CATALOG } from '../../src/save/catalogs/indexes.data'
import type { ThemeCatalogCategory as ThemeCategory } from '../../src/save/catalogs/types'
import { VAULT_HARMONY_IMPORT_CATALOG, VAULT_POWER_IMPORT_CATALOG } from '../../src/data'
import { RELIC_IMPORT_CATALOG, ULTIMATE_WEAPON_IMPORT_CATALOG } from '../../src/save'

/**
 * The shipped catalogs, held to the game's own save format.
 *
 * See `../data/fixtures/save-format/README.md`. These files state the index →
 * name order the game writes; everywhere else in this package that mapping is
 * inferred from array order or a display name.
 *
 * ## What counts as a failure
 *
 * A **name** difference is reported but tolerated when listed below: the game
 * and this package sometimes spell the same entity differently, and several of
 * those spellings are load-bearing elsewhere.
 *
 * An **index** difference is never tolerated. It means the two datasets
 * disagree about which entity a save slot refers to, so one of them is reading
 * a player's data as something else.
 */

const FIXTURES = join(__dirname, '..', '..', 'fixtures', 'data', 'save-format')

function readFormat(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(FIXTURES, name), 'utf8')) as Record<string, unknown>
}

/** `{ "0": "Damage", "7": null }` → Map(0 → 'Damage'), skipping reserved slots. */
function namedOrder(order: unknown): Map<number, string> {
  const out = new Map<number, string>()
  for (const [index, name] of Object.entries(order as Record<string, string | null>)) {
    if (typeof name === 'string' && name.trim()) out.set(Number(index), name)
  }
  return out
}

/** Compare ignoring punctuation and spacing, so `T:I Flux` matches `T: I Flux`. */
const loose = (value: string): string =>
  value.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '')

interface Divergence {
  index: number
  game: string
  sdk: string
}

function divergences(
  expected: Map<number, string>,
  actual: Map<number, string>,
): { differing: Divergence[], absent: number[] } {
  const differing: Divergence[] = []
  const absent: number[] = []
  for (const [index, game] of expected) {
    const sdk = actual.get(index)
    if (sdk === undefined) { absent.push(index); continue }
    if (loose(sdk) !== loose(game)) differing.push({ index, game, sdk })
  }
  return { differing, absent }
}

const show = (list: Divergence[]): string[] =>
  list.map(d => `${d.index}: game="${d.game}" sdk="${d.sdk}"`)

describe('cards', () => {
  it('agrees with the save format on every index', () => {
    const expected = namedOrder(readFormat('cards_save_format.json').cardOrder)
    const actual = new Map(CARD_IMPORT_CATALOG.map(card => [card.index, card.name]))

    const { differing, absent } = divergences(expected, actual)
    expect(show(differing)).toEqual([])
    expect(absent).toEqual([])
  })
})

describe('ultimate weapons', () => {
  it('agrees with the save format on every index', () => {
    const expected = namedOrder(readFormat('ultimate_weapon_save_format.json').weaponOrder)
    const actual = new Map(ULTIMATE_WEAPON_IMPORT_CATALOG.map(w => [w.index, w.name]))

    const { differing, absent } = divergences(expected, actual)
    expect(show(differing)).toEqual([])
    expect(absent).toEqual([])
  })
})

describe('relics', () => {
  /*
   * ## Relics are the one catalog this fixture does not govern
   *
   * The save-format file names 297 relics (0–296) and calls anything past that
   * "reserved/future". The shipped catalog has 305, and from index 292 the two
   * disagree: the file says 292 is Manta Ray, the catalog says Ancient Art.
   *
   * The catalog is right. `V283_RELIC_SLICE` covers exactly 276–304 as the
   * game has them, and it is asserted index by index in
   * `packages/platform/src/parity/v28.3-native-parity.test.ts`. A save array is
   * 305 long in practice. So the save-format file predates v28.3, and the eight
   * newer relics occupy 292–299 rather than being appended.
   *
   * Reordering 292–304 to match the file was tried and reverted: it broke the
   * native parity gate, which is the stronger authority for this range because
   * it comes from the game rather than from a description of it.
   *
   * So this checks 0–291, where the two agree and the file adds value, and
   * defers the tail to the native slice.
   */
  const NATIVE_SLICE_FROM = 292

  const ACCEPTED_NAME_DIFFERENCES = new Set([
    23, 24, 25, 80, 81, 82, // "Nth Tower Birthday" vs "Nth Tower Anniversary"
    165, // Floppy Disk / Disc
    197, // Miner's Tool / Tools
    224, // Sky's Curtain / Curtains
  ])

  it('agrees with the save format below the native slice', () => {
    const expected = namedOrder(readFormat('relics_save_format.json').relicOrder)
    for (const index of [...expected.keys()]) {
      if (index >= NATIVE_SLICE_FROM) expected.delete(index)
    }
    const actual = new Map(RELIC_IMPORT_CATALOG.map(relic => [relic.index, relic.name]))

    const { differing, absent } = divergences(expected, actual)
    const unexpected = differing.filter(d => !ACCEPTED_NAME_DIFFERENCES.has(d.index))

    expect(show(unexpected), 'relic names disagree at an index not on the accepted list').toEqual([])
    expect(absent, 'the file names a relic this catalog has no row for').toEqual([])
  })

  it('still covers every index the save format names', () => {
    // Coverage holds even where naming defers to the native slice: a save slot
    // the file knows about must resolve to some relic here.
    const expected = namedOrder(readFormat('relics_save_format.json').relicOrder)
    const indices = new Set(RELIC_IMPORT_CATALOG.map(relic => relic.index))

    expect([...expected.keys()].filter(index => !indices.has(index))).toEqual([])
  })
})

describe('guardian chips', () => {
  /*
   * Compared by `slotIndex`, which is the save position.
   *
   * There are two chip catalogs and only one of them is keyed that way:
   * `GUARDIAN_CHIP_IMPORT_CATALOG` is keyed by the chip *enum* — it starts at
   * `-1` for None — while `GUARDIAN_CHIP_CATALOG` carries `slotIndex`.
   * Comparing the enum-keyed one against the save order reports disagreements
   * that are two different numbering schemes, not a defect.
   */
  it('agrees with the save format on every slot', () => {
    const expected = namedOrder(readFormat('guardian_save_format.json').chipOrder)
    const actual = new Map(
      GUARDIAN_CHIP_CATALOG
        .filter(chip => typeof chip.slotIndex === 'number')
        .map(chip => [chip.slotIndex as number, chip.label]),
    )

    const { differing, absent } = divergences(expected, actual)
    expect(show(differing)).toEqual([])
    expect(absent, 'the save format names a chip slot with no catalog row').toEqual([])
  })

  it('never lets two rows claim one slot', () => {
    const slots = GUARDIAN_CHIP_CATALOG
      .map(chip => chip.slotIndex)
      .filter((slot): slot is number => typeof slot === 'number')
    expect(new Set(slots).size).toBe(slots.length)
  })
})

describe('themes', () => {
  /*
   * Six categories, each indexing one unlock array — `towerUnlocked[i]`,
   * `trackAvailable[i]` and so on — with `catalogIndex` used directly as `i`.
   * A missing row is therefore an owned item the player never sees.
   *
   * Tower and milestone skins share one index space: the game names 57 and 24
   * of them with no overlap, filling 1..81 exactly, and the catalog holds both
   * under `tower`. They are merged here for the same reason.
   */
  const format = () => readFormat('themes_save_format.json')

  const groups = (): Array<[ThemeCategory, Map<number, string>]> => {
    const f = format()
    return [
      ['tower', new Map([...namedOrder(f.towerSkinOrder), ...namedOrder(f.milestoneSkinOrder)])],
      ['background', namedOrder(f.backgroundSkinOrder)],
      ['menu', namedOrder(f.menuOrder)],
      ['profileBanner', namedOrder(f.profileBannerOrder)],
      ['guardian', namedOrder(f.guardianSkinOrder)],
      ['song', namedOrder(f.songOrder)],
    ]
  }

  /*
   * Spellings the two sides disagree on, kept **deliberately**.
   *
   * `collectedThemes` in the relics tracker is `Record<themeName, boolean>`
   * and is persisted to the cloud, so renaming a row orphans every stored
   * entry and silently un-collects the theme for existing players. The lookup
   * is by index, so the spelling costs nothing; a rename would.
   */
  const ACCEPTED_SPELLINGS = new Map([
    ['tower:53', 'Neon π'],
    ['background:35', 'π Disk'],
    ['menu:6', 'Cozy Cosmos'],
    ['profileBanner:7', 'Cozy Cosmos'],
  ])

  it.each(groups())('%s has a row for every index the game names', (category, game) => {
    const sdk = new Map(
      THEME_CATALOG.filter(row => row.category === category).map(row => [row.catalogIndex, row.name]),
    )

    const missing: string[] = []
    const differing: string[] = []
    for (const [index, gameName] of game) {
      const name = sdk.get(index)
      if (name === undefined) { missing.push(`${index}: ${gameName}`); continue }
      if (ACCEPTED_SPELLINGS.get(`${category}:${index}`) === name) continue
      if (loose(name) !== loose(gameName)) {
        differing.push(`${index}: game="${gameName}" sdk="${name}"`)
      }
    }

    expect(missing, 'the game names a theme this catalog has no row for').toEqual([])
    expect(differing, 'name differs at an index not on the accepted list').toEqual([])
  })

  it('never lets two rows share a category slot', () => {
    const seen = new Set<string>()
    for (const row of THEME_CATALOG) {
      const key = `${row.category}:${row.catalogIndex}`
      expect(seen.has(key), `duplicate ${key}`).toBe(false)
      seen.add(key)
    }
  })
})

describe('vault nodes', () => {
  /*
   * Compared by count and index coverage rather than by name: the game names a
   * node by effect and tier ("Discount Enhancements 1") while this catalog
   * names it by magnitude and effect ("2.5% Discount Enhancements"). Both
   * identify the same node, so a string comparison reports 83 disagreements
   * that are a naming convention.
   *
   * What is worth holding: every save slot the game names has exactly one row
   * here, and no row sits outside that range.
   */
  /*
   * `tier2` and `tier3` legitimately share a slot with a levelled node.
   *
   * Power slots come from a BFS walk of the tree
   * (`buildVaultPowerLevelSlotIndexById`), and the tier unlocks take a position
   * in that walk without consuming a level slot — their value is read from the
   * `tier2Unlock` / `tier3Unlock` booleans instead. So `tier2` sharing index 16
   * with `thorn` is by design, not a collision.
   *
   * `packages/platform/src/tools/vault-save-index.test.ts` excludes the same
   * two ids for the same reason, and the BFS builder is the authority on which
   * node gets which slot — not this file.
   */
  const TIER_UNLOCK_IDS = new Set(['tier2', 'tier3'])

  it.each([
    ['power', 'powerNodeOrder', VAULT_POWER_IMPORT_CATALOG],
    ['harmony', 'harmonyNodeOrder', VAULT_HARMONY_IMPORT_CATALOG],
  ] as const)('%s covers every save index the format names', (_label, orderKey, catalog) => {
    const expected = namedOrder(readFormat('vault_save_format.json')[orderKey])
    const levelled = catalog.filter(node => !TIER_UNLOCK_IDS.has(node.id))
    const indices = levelled.map(node => node.saveIndex)

    expect(new Set(indices).size, 'two levelled nodes claim one slot').toBe(indices.length)
    expect(catalog.map(node => node.saveIndex).filter(i => !expected.has(i))).toEqual([])
  })
})

/*
 * The harmony check above compares COUNT and index coverage, not identity,
 * because the game names a node by effect and tier ("Discount Enhancements 1")
 * while this catalog names it by magnitude ("2.5% Discount Enhancements").
 *
 * That exemption does not cover every node. Seventeen harmony nodes are named
 * IDENTICALLY in both datasets -- the boolean feature unlocks -- so for those a
 * name comparison is exact, and it finds six that sit at different save indices
 * in the two datasets. By this file's own doctrine that is the intolerable
 * kind: the two datasets disagree about which node a save slot refers to.
 *
 * It is pinned rather than fixed, because fixing it is not a six-node edit.
 * The whole 28..47 range is permuted between the two orders, so adopting the
 * game's order means re-deriving about twenty slots -- a behavioural change to
 * how every existing user's vault import lands, which needs a human decision
 * rather than an inference.
 *
 * The evidence favours the game's order: this catalog's indices come from
 * `buildVaultChartSlotIndexById`, which is CHART LAYOUT order, and
 * `HARMONY_VAULT_SLOT_OVERRIDES` already hand-corrects two end-caps that layout
 * order got wrong -- so layout order is known not to be save order in general.
 * The real save cannot settle it: its player has 45 of 48 nodes unlocked, so a
 * parent-child violation check passes under both orders and proves nothing.
 *
 * This test exists so the gap is visible and cannot grow in silence.
 */
describe('vault harmony nodes named identically in both datasets', () => {
  const IDENTICALLY_NAMED = [
    'Demon Mode Automation', 'Free Mission Reroll', 'Smart Demon Mode Automation',
    'Nuke Automation', 'Smart Nuke Automation', '+5 Workshop Presets',
    'Missile Barrage Automation', 'Smart Missile Barrage Automation',
    'Auto Shatter Rare Modules', 'Daily Mission - Set Shard Type',
    'Auto Restart Run', 'Auto Charge Berzerker', 'Damage Cap Slider',
    'Workshop Orb Adjuster', 'Ad gems Stack x2', 'Ad gems Stack x3', 'Ad gems Stack x5',
  ]

  /** Known, unresolved divergences: name -> [game index, catalog index]. */
  const KNOWN_DIVERGENCES: Record<string, [number, number]> = {
    'Auto Shatter Rare Modules': [29, 30],
    'Daily Mission - Set Shard Type': [30, 28],
    'Auto Restart Run': [33, 31],
    'Auto Charge Berzerker': [34, 35],
    'Damage Cap Slider': [36, 38],
    'Workshop Orb Adjuster': [39, 41],
  }

  it('agrees with the save format except on the six recorded divergences', () => {
    const expected = namedOrder(readFormat('vault_save_format.json').harmonyNodeOrder)
    const gameIndexByName = new Map<string, number>()
    for (const [index, name] of expected) gameIndexByName.set(loose(name), index)
    const catalogIndexByName = new Map<string, number>()
    for (const node of VAULT_HARMONY_IMPORT_CATALOG) {
      catalogIndexByName.set(loose(node.name), node.saveIndex)
    }

    const found: Record<string, [number, number]> = {}
    for (const name of IDENTICALLY_NAMED) {
      const game = gameIndexByName.get(loose(name))
      const sdk = catalogIndexByName.get(loose(name))
      expect(game, `${name} is not in the save format`).toBeDefined()
      expect(sdk, `${name} is not in the catalog`).toBeDefined()
      if (game !== sdk) found[name] = [game as number, sdk as number]
    }

    // Exact, not a count: a divergence that moves is as interesting as a new one.
    expect(found).toEqual(KNOWN_DIVERGENCES)
  })
})
