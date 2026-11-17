import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { GUARDIAN_CHIP_CATALOG } from '../../src/save/catalogs/indexes.data'
import { GUARDIAN_CHIP_IMPORT_CATALOG, GUARDIAN_CHIP_TYPE_ENUM } from '../../src/data/player-stats/fields.data'
import {
  findGuardianChipTargetKey,
  findGuardianChipTargetKeyBySlotIndex,
  getGuardianChipLabel,
} from '../../src/save/catalogs/guardians'

type Row = { slotIndex: number | null, chipType: string | null, label: string, targetKey: string | null }
const ROWS = GUARDIAN_CHIP_CATALOG as unknown as readonly Row[]

const CHIP_ORDER = JSON.parse(
  readFileSync(new URL('../../fixtures/data/save-format/guardian_save_format.json', import.meta.url), 'utf8'),
).chipOrder as Record<string, string>

/** The game's ChipType enum, which the save format's chipOrder reproduces. */
const CHIP_TYPE_BY_VALUE = [
  'Steal', 'Catch', 'Attack', 'Scare', 'Rush', 'Ally', 'Fetch', 'Summon', 'Scout', 'Repair',
]

describe('the save chip slot order is the game ChipType enum', () => {
  it('matches the save format position for position', () => {
    for (const [slot, name] of Object.entries(CHIP_ORDER)) {
      const expected = CHIP_TYPE_BY_VALUE[Number(slot)]
      // The save writes the DISPLAY name at slot 0 (Bounty for Steal); the rest
      // are the enum names verbatim.
      if (Number(slot) === 0) expect(name).toBe('Bounty')
      else expect(name, `slot ${slot}`).toBe(expected)
    }
  })

  it('covers every released slot and stops before the unreleased one', () => {
    const slots = Object.keys(CHIP_ORDER).map(Number).sort((a, b) => a - b)
    expect(slots).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(CHIP_TYPE_BY_VALUE[9]).toBe('Repair')
    expect(CHIP_ORDER['9']).toBeUndefined()
  })
})

describe('every catalog row names its own slot', () => {
  it('gives each row the ChipType of its slotIndex', () => {
    const seen = new Set<number>()
    for (const row of ROWS) {
      if (row.slotIndex === null) continue
      seen.add(row.slotIndex)
      expect(row.chipType, `slot ${row.slotIndex} (${row.label})`)
        .toBe(CHIP_TYPE_BY_VALUE[row.slotIndex])
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('leaves no row falling back to a generic name', () => {
    for (const row of ROWS) expect(row.chipType, `${row.label} has no chipType`).toBeTruthy()
  })
})

describe('the two chip catalogs agree on identity', () => {
  const enumRows = GUARDIAN_CHIP_TYPE_ENUM as unknown as readonly {
    value: number, chipType: string, targetKey: string | null, label: string
  }[]

  it('puts every tracker key on the same ChipType in both tables', () => {
    for (const row of enumRows) {
      if (!row.targetKey) continue
      const catalogRow = ROWS.find((r) => r.targetKey === row.targetKey)
      expect(catalogRow, `no catalog row for ${row.targetKey}`).toBeDefined()
      expect(catalogRow!.slotIndex, `${row.targetKey} slot`).toBe(row.value)
      expect(catalogRow!.chipType, `${row.targetKey} chipType`).toBe(row.chipType)
    }
  })

  it('keeps the key on the chip it names, not on its twin', () => {
    const byKey = new Map(enumRows.filter((r) => r.targetKey).map((r) => [r.targetKey!, r]))
    expect(byKey.get('attack')?.chipType).toBe('Attack')
    expect(byKey.get('ally')?.chipType).toBe('Ally')
    expect(byKey.get('fetch')?.chipType).toBe('Fetch')
    // Bounty is the one genuine rename: there is no 'Bounty' ChipType.
    expect(byKey.get('bounty')?.chipType).toBe('Steal')
  })

  it('gives the released chips a key and the twins none', () => {
    const keyed = enumRows.filter((r) => r.targetKey).map((r) => r.chipType).sort()
    expect(keyed).toEqual(['Ally', 'Attack', 'Fetch', 'Scout', 'Steal', 'Summon'])
    const unkeyed = enumRows.filter((r) => !r.targetKey && r.value >= 0).map((r) => r.chipType).sort()
    expect(unkeyed).toEqual(['Catch', 'Rush', 'Scare'])
  })

  it('has one label per entry now', () => {
    const labels = enumRows.map((r) => r.label)
    expect(new Set(labels).size).toBe(labels.length)
  })
})

describe('all three chip catalogs agree', () => {
  const enumRows = GUARDIAN_CHIP_TYPE_ENUM as unknown as readonly {
    value: number, chipType: string, targetKey: string | null, label: string
  }[]
  const importRows = GUARDIAN_CHIP_IMPORT_CATALOG as unknown as readonly {
    index: number, chipType: string, targetKey: string | null, label: string
  }[]

  it('assigns each tracker key to exactly one chipType in all three', () => {
    // `.find()` would hide a duplicate — a second row carrying the same key
    // still returns the first match. Collect ALL matches per catalog instead.
    for (const key of ['bounty', 'attack', 'ally', 'fetch', 'summon', 'scout']) {
      const byEnum = enumRows.filter(r => r.targetKey === key)
      const byImport = importRows.filter(r => r.targetKey === key)
      const byCatalog = ROWS.filter(r => r.targetKey === key)
      expect(byEnum.map(r => r.chipType), `enum ${key}`).toHaveLength(1)
      expect(byImport.map(r => r.chipType), `import ${key}`).toHaveLength(1)
      expect(byCatalog.map(r => r.chipType), `catalog ${key}`).toHaveLength(1)
      expect(byImport[0]!.chipType, key).toBe(byEnum[0]!.chipType)
      expect(byCatalog[0]!.chipType, key).toBe(byEnum[0]!.chipType)
      expect(byImport[0]!.index, key).toBe(byEnum[0]!.value)
      expect(byCatalog[0]!.slotIndex, key).toBe(byEnum[0]!.value)
    }
  })

  it('has the same keyed chipType set in all three catalogs', () => {
    const keyed = (rows: readonly { chipType: string, targetKey: string | null }[]) =>
      rows.filter(r => r.targetKey).map(r => `${r.targetKey}:${r.chipType}`).sort()
    expect(keyed(importRows)).toEqual(keyed(enumRows))
    expect(keyed(ROWS as readonly { chipType: string, targetKey: string | null }[]))
      .toEqual(keyed(enumRows))
  })

  it('gives the import catalog unique labels too', () => {
    const labels = importRows.map(r => r.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('carries Scout in every catalog', () => {
    expect(enumRows.some(r => r.chipType === 'Scout')).toBe(true)
    expect(importRows.some(r => r.chipType === 'Scout')).toBe(true)
    expect(ROWS.some(r => r.chipType === 'Scout')).toBe(true)
  })
})

describe('positional lookup resolves by save index, not array position', () => {
  it('returns the chip whose slot was asked for', () => {
    // GUARDIAN_CHIP_CATALOG is ordered slot 1,3,4,0,6,2,5,7,8 — so array
    // position 2 is Rush, and asking for save index 2 must still give Attack.
    expect(getGuardianChipLabel(2)).toBe('Attack')
    expect(getGuardianChipLabel(0)).toBe('Bounty')
    expect(findGuardianChipTargetKey(2)).toBe('attack')
    expect(findGuardianChipTargetKey(5)).toBe('ally')
  })

  it('agrees with the by-slot accessor for every slot', () => {
    for (let slot = 0; slot <= 8; slot += 1) {
      expect(findGuardianChipTargetKey(slot), `slot ${slot}`)
        .toBe(findGuardianChipTargetKeyBySlotIndex(slot))
    }
  })
})
