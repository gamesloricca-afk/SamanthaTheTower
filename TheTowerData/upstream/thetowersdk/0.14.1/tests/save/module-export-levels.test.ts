import { describe, expect, it } from 'vitest'
import { decodePlayerInfoSaveBytes } from '../../src/node/decode-save'
import { readModulesFromSaveRoot } from '../../src/save/modules/read'

const missingLevelsWarning = 'This file does not include all current module slot levels. Existing module progress will be kept for missing levels.'

// Independent public-property fixture: item levels are retired, slot levels are current.
function officialExport() {
  return {
    ResearchLevel: [1],
    SlotLevels: [101, 113, 127, 139],
    ModuleEquipped: [9, 17, 47, 40].map(InfoIndex => ({ InfoIndex, CurrentRarity: 15, Level: 0, MaxLevelReached: 999 })),
    AssistModuleSlots: [9, 17, 47, 40].map((InfoIndex, Type) => ({
      Type, Level: [43, 47, 53, 59][Type],
      EquippedModule: { InfoIndex, CurrentRarity: 15, Level: 0, MaxLevelReached: 999 },
    })),
    ModuleInventory: [{ InfoIndex: 9, CurrentRarity: 5, Level: 0, MaxLevelReached: 999, Effects: [1] }],
  }
}

function readExport(raw: unknown) {
  return readModulesFromSaveRoot(decodePlayerInfoSaveBytes(Buffer.from(JSON.stringify(raw))).parsedRoot)!
}

describe('official JSON module slot levels', () => {
  it('reads all primary and assist levels without a migration flag', () => {
    const extract = readExport(officialExport())
    expect(extract.equipped.filter(row => row.role === 'primary').map(row => row.level)).toEqual([101, 113, 127, 139])
    expect(extract.equipped.filter(row => row.role === 'assist').map(row => row.level)).toEqual([43, 47, 53, 59])
    expect(extract.inventory[0]?.level).toBe(0)
    expect(extract.warnings).not.toContain(missingLevelsWarning)
  })

  it('honors an explicitly false migration flag and keeps legacy item levels', () => {
    const raw = officialExport()
    raw.ModuleEquipped.forEach(row => { row.Level = 17 })
    raw.AssistModuleSlots.forEach(row => { row.EquippedModule.Level = 23 })
    const extract = readExport({ ...raw, HasMigratedModuleLevelsToSlots: false })
    expect(extract.equipped.filter(row => row.role === 'primary').map(row => row.level)).toEqual([17, 17, 17, 17])
    expect(extract.equipped.filter(row => row.role === 'assist').map(row => row.level)).toEqual([23, 23, 23, 23])
  })

  it('retains explicitly true migration behavior, including a zero slot value', () => {
    const raw = officialExport()
    raw.SlotLevels[0] = 0
    raw.AssistModuleSlots[0]!.Level = 0
    raw.ModuleEquipped[0]!.Level = 17
    raw.AssistModuleSlots[0]!.EquippedModule.Level = 23
    const extract = readExport({ ...raw, HasMigratedModuleLevelsToSlots: true })
    expect(extract.equipped.filter(row => row.role === 'primary').map(row => row.level)).toEqual([0, 113, 127, 139])
    expect(extract.equipped.filter(row => row.role === 'assist').map(row => row.level)).toEqual([0, 47, 53, 59])
  })

  it.each([null, false, true, 0, -1, 1.5, '42', NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])('does not use invalid absent-flag slot data (%s)', invalid => {
    const extract = readModulesFromSaveRoot({
      moduleEquipped: [{ infoIndex: 9, currentRarity: 15, level: 17 }],
      slotLevels: [invalid],
      assistModuleSlots: [{ type: 0, level: invalid, equippedModule: { infoIndex: 9, currentRarity: 15, level: 23 } }],
    })!
    expect(extract.equipped.map(row => row.level)).toEqual([17, 23])
  })

  it.each([NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, -1, 1.5])('rejects invalid numeric migrated slot data (%s)', invalid => {
    const extract = readModulesFromSaveRoot({
      hasMigratedModuleLevelsToSlots: true,
      moduleEquipped: [{ infoIndex: 9, currentRarity: 15, level: 17 }],
      slotLevels: [invalid],
      assistModuleSlots: [{ type: 0, level: invalid, equippedModule: { infoIndex: 9, currentRarity: 15, level: 23 } }],
    })!
    expect(extract.equipped.map(row => row.level)).toEqual([17, 23])
  })

  it('keeps legacy item levels when slot fields are absent', () => {
    const extract = readModulesFromSaveRoot({
      moduleEquipped: [{ infoIndex: 9, currentRarity: 15, level: 17 }],
      assistModuleSlots: [{ type: 0, equippedModule: { infoIndex: 9, currentRarity: 15, level: 23 } }],
    })!
    expect(extract.equipped.map(row => row.level)).toEqual([17, 23])
  })

  it('warns for truly omitted levels without inferring MaxLevelReached', () => {
    const raw = officialExport()
    const { SlotLevels: _slots, ...withoutSlots } = raw
    const extract = readExport({ ...withoutSlots, AssistModuleSlots: raw.AssistModuleSlots.map(({ Level: _level, ...slot }) => slot) })
    expect(extract.equipped.map(row => row.level)).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
    expect(extract.warnings).toContain(missingLevelsWarning)
  })

  it('warns when equipped slots are empty but owned inventory exists', () => {
    const extract = readExport({ ...officialExport(), ModuleEquipped: [], AssistModuleSlots: [] })
    expect(extract.equipped).toEqual([])
    expect(extract.inventory).toHaveLength(1)
    expect(extract.warnings).toContain(missingLevelsWarning)
  })

  it('warns for empty equipped placeholders with owned inventory', () => {
    const extract = readExport({ ...officialExport(), ModuleEquipped: [null, null, null, null], AssistModuleSlots: [] })
    expect(extract.warnings).toContain(missingLevelsWarning)
  })
})
