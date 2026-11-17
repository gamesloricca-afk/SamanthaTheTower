import { describe, expect, it } from 'vitest'
import { MODULE_SUBSTAT_CANONICAL_DATA, MODULE_SUBSTATS_MISSING_FROM_CHART } from '../../src/data/modules/substats'
import { type ModuleSubstatCanonicalCategory } from '../../src/data/modules/types'
import { resolveIdsSubstatEffectId } from '../../src/save/ids/import-modules'
import { MODULE_SAVE_EFFECT_ID_LABELS } from '../../src/save/modules/registry'
import { type ModuleSaveSlotCategory } from '../../src/save/modules/types'

/**
 * Every module substat, accounted for — explicitly.
 *
 * This is the guard that would have caught the "Enemy Health Level Skip
 * unresolved" scare without anyone importing a community sheet and digging
 * through five layers to find out why. It checks the two directions of "the SDK
 * knows every substat of every module":
 *
 *   FORWARD — every substat the display catalog lists, at every rarity it can
 *   actually roll, resolves to an effect id through the same reader path a save
 *   import uses. A catalog entry the reader cannot resolve fails here.
 *
 *   REVERSE — every substat the game's own effect registry carries appears in
 *   the display catalog. A real game substat missing from the chart fails here.
 *
 * The save reader uses `MODULE_SAVE_EFFECT_ID_LABELS` to identify effect ids.
 * Where that registry and the display catalog disagree, the discrepancy is
 * pinned below with a reason — nothing is
 * swept under a "close enough". A NEW discrepancy, in either direction, fails.
 */

const CANONICAL_TO_SAVE: Record<ModuleSubstatCanonicalCategory, ModuleSaveSlotCategory> = {
  Cannon: 'Cannon',
  Defense: 'Armor',
  Generator: 'Generator',
  Core: 'Core',
}

/**
 * Catalog entries the game's effect ids do NOT back, keyed `Category::Label` or
 * `Category::Label::Rarity`. Each needs reference reconciliation; pinned so the
 * set cannot grow silently.
 */
const KNOWN_CATALOG_ONLY: Record<string, string> = {
  // Whole label: the chart names this Core slot "Poison Swamp - Chance"; the
  // game effect registry names it "Poison Swamp - Cooldown" (see below).
  'Core::Poison Swamp - Chance': 'chart label; game registry has "Poison Swamp - Cooldown" for this slot',
  // Single rarities the chart shows a value for but the effect-id run omits.
  'Cannon::Multishot Chance::Common': 'chart shows a Common value; the effect-id run starts at Rare',
  'Core::Death Wave - Quantity::Epic': 'chart shows an Epic value; the effect-id run skips Epic',
}

/** Game effect labels absent from the display catalog. Pinned with a reason. */
const KNOWN_REGISTRY_ONLY: Record<string, string> = {
  'Core::Poison Swamp - Cooldown': 'game effect; the chart lists "Poison Swamp - Chance" for this slot',
  'Core::Unknown Stat 0': 'a save effect id with no verified display label',
}

function catalogLabels(saveCategory: ModuleSaveSlotCategory): Set<string> {
  const labels = new Set<string>()
  for (const [canon, data] of Object.entries(MODULE_SUBSTAT_CANONICAL_DATA)) {
    if (CANONICAL_TO_SAVE[canon as ModuleSubstatCanonicalCategory] !== saveCategory) continue
    for (const s of data.substats) labels.add(s.label)
  }
  for (const [canon, list] of Object.entries(MODULE_SUBSTATS_MISSING_FROM_CHART)) {
    if (CANONICAL_TO_SAVE[canon as ModuleSubstatCanonicalCategory] !== saveCategory) continue
    for (const s of list) labels.add(s.label)
  }
  return labels
}

describe('module substats are completely accounted for', () => {
  it('FORWARD — every catalog substat resolves at every rarity it can roll', () => {
    const unaccounted: string[] = []
    for (const [canon, data] of Object.entries(MODULE_SUBSTAT_CANONICAL_DATA)) {
      const category = CANONICAL_TO_SAVE[canon as ModuleSubstatCanonicalCategory]
      const all = [...data.substats, ...(MODULE_SUBSTATS_MISSING_FROM_CHART[canon as ModuleSubstatCanonicalCategory] ?? [])]
      for (const substat of all) {
        for (const [rarity, value] of Object.entries(substat.valuesByRarity)) {
          if (!value) continue // empty value ⇒ the substat does not roll at this rarity
          if (resolveIdsSubstatEffectId(category, substat.label, rarity) !== null) continue
          const labelKey = `${category}::${substat.label}`
          const rarityKey = `${labelKey}::${rarity}`
          if (labelKey in KNOWN_CATALOG_ONLY || rarityKey in KNOWN_CATALOG_ONLY) continue
          unaccounted.push(rarityKey)
        }
      }
    }
    expect(unaccounted, `catalog substats that do not resolve:\n  ${unaccounted.join('\n  ')}`).toEqual([])
  })

  it('REVERSE — every game-registry substat is present in the catalog', () => {
    const missing: string[] = []
    for (const category of Object.keys(MODULE_SAVE_EFFECT_ID_LABELS) as ModuleSaveSlotCategory[]) {
      const inCatalog = catalogLabels(category)
      for (const label of new Set(Object.values(MODULE_SAVE_EFFECT_ID_LABELS[category]))) {
        if (inCatalog.has(label)) continue
        const key = `${category}::${label}`
        if (key in KNOWN_REGISTRY_ONLY) continue
        missing.push(key)
      }
    }
    expect(missing, `game substats missing from the catalog:\n  ${missing.join('\n  ')}`).toEqual([])
  })

  it('the pinned discrepancies still describe reality (no stale exceptions)', () => {
    // A pinned exception that has since been fixed should be removed, not left
    // to rot — so every KNOWN_* entry must still be a live discrepancy.
    for (const key of Object.keys(KNOWN_CATALOG_ONLY)) {
      const [category, label, rarity] = key.split('::') as [ModuleSaveSlotCategory, string, string?]
      if (rarity) {
        expect(resolveIdsSubstatEffectId(category, label, rarity), `${key} now resolves — drop the exception`).toBeNull()
      } else {
        // whole-label exception: no rarity of it should resolve
        const anyResolves = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ancestral']
          .some(r => resolveIdsSubstatEffectId(category, label, r) !== null)
        expect(anyResolves, `${key} now resolves — drop the exception`).toBe(false)
      }
    }
    for (const key of Object.keys(KNOWN_REGISTRY_ONLY)) {
      const [category, label] = key.split('::') as [ModuleSaveSlotCategory, string]
      expect(catalogLabels(category).has(label), `${key} is now in the catalog — drop the exception`).toBe(false)
    }
  })
})
