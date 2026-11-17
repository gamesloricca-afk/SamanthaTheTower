import { describe, expect, it } from 'vitest'
import { decodePlayerInfoSaveBytes } from '../../src/node/decode-save'
import { readModulesFromSaveRoot } from '../../src/save/modules/read'

// Public export properties with independent primary and assist level values.
const exportBytes = Buffer.from(JSON.stringify({
  ResearchLevel: [1], VersionNumber: 2910, HasMigratedModuleLevelsToSlots: true,
  SlotLevels: [101, 113, 127, 139],
  ModuleEquipped: [9, 17, 47, 40].map(InfoIndex => ({ InfoIndex, CurrentRarity: 15, Level: 0 })),
  AssistModuleSlots: [9, 17, 47, 40].map((InfoIndex, Type) => ({
    Type, Level: [43, 47, 53, 59][Type], EquippedModule: { InfoIndex, CurrentRarity: 15, Level: 0 },
  })),
}))

describe('official JSON export — migrated module slot levels', () => {
  it('reads primary levels from slotLevels after migration', () => {
    const root = decodePlayerInfoSaveBytes(exportBytes).parsedRoot as Record<string, unknown>
    expect(root.versionNumber).toEqual(expect.any(Number))
    expect(root.hasMigratedModuleLevelsToSlots).toBe(true)
    expect(root.slotLevels).toEqual(expect.any(Array))

    const mods = readModulesFromSaveRoot(root)
    expect(mods).not.toBeNull()

    const primary = mods!.equipped.filter((e) => e.role === 'primary')
    expect(primary.map((e) => e.level)).toEqual(root.slotLevels)
  })

  it('reads assist levels from AssistModuleSlot.level after migration', () => {
    const root = decodePlayerInfoSaveBytes(exportBytes).parsedRoot as Record<string, unknown>
    const mods = readModulesFromSaveRoot(root)
    expect(mods).not.toBeNull()

    const assist = mods!.equipped.filter((e) => e.role === 'assist')
    const expectedLevels = (root.assistModuleSlots as Array<Record<string, unknown>>)
      .map(slot => slot.level)
    expect(assist.map((e) => e.level)).toEqual(expectedLevels)
  })

  it('still reads ModuleItem.level when migration flag is absent', () => {
    const mods = readModulesFromSaveRoot({
      moduleEquipped: [{ infoIndex: 9, level: 241, currentRarity: { value__: 15 }, effects: [1] }],
    })
    expect(mods?.equipped[0]?.level).toBe(241)
  })
})
