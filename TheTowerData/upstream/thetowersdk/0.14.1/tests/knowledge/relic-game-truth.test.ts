import { describe, expect, it } from 'vitest'
import { RELIC_TEMPLATES, RELIC_UNLOCK_METHODS } from '../../src/data/relics/data'
import { RELIC_IMPORT_CATALOG } from '../../src/save/catalogs/indexes.data'
import { GUARDIAN_CHIP_TYPE_ENUM } from '../../src/data/player-stats/fields.data'
import {
  CHIP_BENEFIT_INDEX_BOUNTY,
  CHIP_BENEFIT_INDEX_CASH_MULTIPLIER,
  CHIP_TYPES_NOT_IN_SAVE_ENUM,
  GAME_CHIP_TYPE_VALUES,
} from '../../src/knowledge/compartments/guardian'
import {
  RELIC_GAME_RARITIES,
  RELIC_GAME_UNLOCK_TYPES,
  RELIC_GIFT_UNLOCK_RELICS,
  RELIC_MALFORMED_RARITY,
  RELIC_MISSING_FROM_SHEET_BUT_OLD,
  RELIC_SHEET_AGREES_BELOW_INDEX,
  RELIC_SHEET_COUNT,
  RELIC_STAT_ENUM_ORDER,
  RELIC_STATE_ENUM,
  RELIC_STATS_WHERE_WIKI_EXCEEDS_CATALOG,
  RELIC_TEMPLATE_SUM_INCLUDES_UNRELEASED,
  RELIC_UNLOCK_METHOD_MISSING_FROM_OURS,
  RELIC_UNRELEASED_IN_CATALOG,
} from '../../src/knowledge/compartments/progression'

type CatalogRow = { name: string, label?: string, benefit: number, benefitType: number, description?: string, unlockDescription?: string }
const CATALOG = RELIC_IMPORT_CATALOG as unknown as CatalogRow[]
/** Templates keyed by display name (label); v29 catalog `name` may be the enum symbol. */
const TEMPLATE_BY_NAME = new Map(RELIC_TEMPLATES.map(relic => [relic.name, relic]))
const templateFor = (row: CatalogRow) => TEMPLATE_BY_NAME.get(row.label ?? '') ?? TEMPLATE_BY_NAME.get(row.name)
const CATALOG_WITH_TEMPLATES = CATALOG.filter(row => templateFor(row))

describe('the catalog against the game enum', () => {
  it('has one template per catalog row, matched by name', () => {
    // RELIC_TEMPLATES mirrors RELIC_IMPORT_CATALOG including v29 indices 305–320.
    expect(RELIC_TEMPLATES).toHaveLength(321)
    expect(CATALOG.length).toBeGreaterThanOrEqual(RELIC_TEMPLATES.length)
    expect(CATALOG_WITH_TEMPLATES).toHaveLength(RELIC_TEMPLATES.length)
    for (const row of CATALOG_WITH_TEMPLATES) expect(Boolean(templateFor(row)), row.name).toBe(true)
  })

  it('maps every benefitType onto exactly one bonusType, and uses all 27', () => {
    const mapping = new Map<string, Set<string>>()
    for (const row of CATALOG_WITH_TEMPLATES) {
      const stat = RELIC_STAT_ENUM_ORDER[row.benefitType]
      expect(stat, `benefitType ${row.benefitType} is outside the enum`).toBeDefined()
      const bonusType = templateFor(row)?.bonusType ?? '<none>'
      if (!mapping.has(stat!)) mapping.set(stat!, new Set())
      mapping.get(stat!)!.add(bonusType)
    }
    for (const [stat, bonusTypes] of mapping) {
      expect(bonusTypes.size, `${stat} resolves to ${[...bonusTypes].join(' and ')}`).toBe(1)
    }
    expect(mapping.size).toBe(RELIC_STAT_ENUM_ORDER.length)
  })

  it('pins each enum POSITION against the catalog description, not just consistency', () => {
    // The previous check only proved each benefitType maps to one bonusType.
    // Swapping two enum entries passed it, because that relabels both sides
    // consistently. This anchors the enum to the game's own prose instead.
    const squash = (text: string) => text.toLowerCase().replace(/[^a-z]/g, '')
    const EXPECTED_IN_DESCRIPTION: Readonly<Record<string, string>> = {
      TowerDamage: 'towerdamage',
      DefensePercent: 'defensepercent',
      TowerDefenseAbs: 'defenseabsolute',
      LabSpeed: 'labspeed',
      CoinBonus: 'coins',
      BotRange: 'botrange',
      KnockbackForce: 'knockbackforce',
      FreeAttackUpgrade: 'freeattackupgrade',
    }
    let checked = 0
    for (const row of CATALOG) {
      if (row.benefitType == null || row.description == null) continue
      const stat = RELIC_STAT_ENUM_ORDER[row.benefitType]!
      const needle = EXPECTED_IN_DESCRIPTION[stat]
      if (!needle) continue
      expect(squash(String(row.description ?? '')), `${row.name} (benefitType ${row.benefitType} -> ${stat})`)
        .toContain(needle)
      checked += 1
    }
    expect(checked, 'no rows were actually checked').toBeGreaterThan(50)
  })

  it('agrees on every value, with the catalog holding the raw fraction', () => {
    for (const row of CATALOG_WITH_TEMPLATES) {
      const template = templateFor(row)!
      const shown = Number(String(template.value).replace(/[^\d.-]/g, ''))
      const raw = row.benefit * (String(template.value).includes('%') ? 100 : 1)
      expect(raw, `${row.name}`).toBeCloseTo(shown, 2)
    }
  })
})

describe('relic state', () => {
  it('orders the states so that a truthy check wrongly includes Mailed', () => {
    expect(RELIC_STATE_ENUM.Locked).toBe(0)
    expect(RELIC_STATE_ENUM.Mailed).toBe(1)
    expect(RELIC_STATE_ENUM.Unlocked).toBe(2)
    // The trap in one line: truthiness is not the gate the game uses.
    expect(Boolean(RELIC_STATE_ENUM.Mailed)).toBe(true)
    expect(RELIC_STATE_ENUM.Mailed === RELIC_STATE_ENUM.Unlocked).toBe(false)
  })
})

describe('unlock methods against the game enum', () => {
  it('has the same count as the game, which is what hid the difference', () => {
    expect(RELIC_UNLOCK_METHODS).toHaveLength(RELIC_GAME_UNLOCK_TYPES.length)
  })

  it('drops Gift, and Gift is not hypothetical', () => {
    const ours = RELIC_UNLOCK_METHODS
      .map(method => `${method.key} ${method.label} ${method.description}`)
      .join(' ')
      .toLowerCase()
    for (const missing of RELIC_UNLOCK_METHOD_MISSING_FROM_OURS) {
      expect(ours, `${missing} should be absent from our list`).not.toContain(missing.toLowerCase())
      expect(RELIC_GAME_UNLOCK_TYPES).toContain(missing)
    }
    const gifts = CATALOG.filter(row => /gift/i.test(String(row.unlockDescription ?? '')))
    expect(gifts.map(row => row.name).sort()).toEqual([...RELIC_GIFT_UNLOCK_RELICS].sort())
  })

  it('carries no unlock type in the import catalog', () => {
    for (const row of CATALOG) expect(row).not.toHaveProperty('unlockType')
  })
})

describe('the rarity label', () => {
  it('spells Legendary with an index prefix, and only Legendary', () => {
    const rarities = new Set(RELIC_TEMPLATES.map(relic => String(relic.rarity)))
    expect(rarities).toContain(RELIC_MALFORMED_RARITY)
    expect(rarities).not.toContain('Legendary')
    for (const clean of RELIC_GAME_RARITIES.filter(r => r !== 'Legendary')) {
      expect(rarities, `${clean} is spelled correctly`).toContain(clean)
    }
  })

  it('affects a real number of relics, not one stray row', () => {
    const affected = RELIC_TEMPLATES.filter(r => String(r.rarity) === RELIC_MALFORMED_RARITY)
    expect(affected.length).toBe(19)
  })
})

describe('the wiki totals exceed the catalog for some stats', () => {
  it('is empty after v29 binary correction of indices 276–304', () => {
    const sums = new Map<string, number>()
    for (const relic of RELIC_TEMPLATES) {
      const parsed = /^(-?[\d.]+)/.exec(String(relic.value ?? ''))
      if (parsed) sums.set(relic.bonusType!, (sums.get(relic.bonusType!) ?? 0) + Number(parsed[1]))
    }
    for (const row of RELIC_STATS_WHERE_WIKI_EXCEEDS_CATALOG) {
      expect(sums.get(row.stat), `${row.stat} catalog sum`).toBeCloseTo(row.catalogSum, 6)
      expect(row.wiki, `${row.stat} wiki total`).toBeGreaterThan(row.catalogSum)
    }
    // Pre-v29 binary drift left six stats below the wiki table; Initialize
    // re-validation raised the template sums so none remain below.
    expect(RELIC_STATS_WHERE_WIKI_EXCEEDS_CATALOG.length).toBe(0)
  })
})

describe('the unreleased-relic account of the totals gap', () => {
  it('names four contiguous unreleased relics at the end of the catalog', () => {
    const byName = new Map(CATALOG.map(row => [row.name, row]))
    const indexes = RELIC_UNRELEASED_IN_CATALOG
      .map(name => (byName.get(name) as unknown as { index: number } | undefined)?.index)
    for (const index of indexes) expect(index, 'unreleased relic missing from catalog').toBeDefined()
    const sorted = [...indexes as number[]].sort((a, b) => a - b)
    // Contiguous, which is what "four ship together" looks like.
    for (let i = 1; i < sorted.length; i += 1) expect(sorted[i]! - sorted[i - 1]!).toBe(1)
    expect(sorted[0]).toBeGreaterThanOrEqual(RELIC_SHEET_AGREES_BELOW_INDEX)
  })

  it('keeps the old-and-missing relics separate from the unreleased ones', () => {
    for (const name of RELIC_MISSING_FROM_SHEET_BUT_OLD) {
      expect(RELIC_UNRELEASED_IN_CATALOG as readonly string[]).not.toContain(name)
      const row = CATALOG.find(entry => entry.name === name) as unknown as { index: number }
      expect(row, name).toBeDefined()
      expect(row.index, `${name} should be an OLD index`).toBeLessThan(RELIC_SHEET_AGREES_BELOW_INDEX)
    }
  })

  it('says plainly that the template sum counts relics nobody can own', () => {
    expect(RELIC_TEMPLATE_SUM_INCLUDES_UNRELEASED).toBe(true)
    expect(CATALOG.length).toBeGreaterThan(RELIC_SHEET_COUNT)
  })
})

describe('guardian chip benefits reach the economy', () => {
  it('keeps Bounty at index 0, which is what calibrates the array', () => {
    expect(CHIP_BENEFIT_INDEX_BOUNTY).toBe(0)
    const bounty = (GUARDIAN_CHIP_TYPE_ENUM as { value: number, chipType: string, label: string }[])
      .find(c => c.value === CHIP_BENEFIT_INDEX_BOUNTY)
    expect(bounty?.chipType).toBe('Steal')
    expect(bounty?.label).toBe('Bounty')
  })

  it('leaves the cash slot unnamed and distinct from Bounty', () => {
    expect(CHIP_BENEFIT_INDEX_CASH_MULTIPLIER).not.toBe(CHIP_BENEFIT_INDEX_BOUNTY)
    // Beyond our enum, so it cannot be named from the save catalog either.
    const values = (GUARDIAN_CHIP_TYPE_ENUM as { value: number }[]).map(c => c.value)
    expect(Math.max(...values)).toBeLessThan(CHIP_BENEFIT_INDEX_CASH_MULTIPLIER)
  })

  it('has more chip types in the game than in the save enum', () => {
    expect(GAME_CHIP_TYPE_VALUES).toHaveLength(10)
    const ours = new Set(
      (GUARDIAN_CHIP_TYPE_ENUM as { chipType: string }[]).map(c => c.chipType),
    )
    const missing = GAME_CHIP_TYPE_VALUES.filter(t => !ours.has(t))
    expect(missing.sort()).toEqual([...CHIP_TYPES_NOT_IN_SAVE_ENUM].sort())
    expect(missing).toEqual(['Repair'])
  })
})
