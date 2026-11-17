import { describe, expect, it } from 'vitest'
import { gzipSync } from 'node:zlib'
import { decodePlayerInfoSaveBytes } from '../../src/node/decode-save'
import { decodeSaveFile, decodeInflatedSave } from '../../src/save-decoder'
import { looksLikeToolExportJson, readToolExportJson } from '../../src/save/access/json'
import { listImportableBattleRuns } from '../../src/save/battle/history'
import { readLabsFromSaveRoot } from '../../src/save/labs/read'
import { towerAndroidExportPaths, TOWER_SAVE_FILENAMES } from '../../src/save/access/path'
import { readVaultV29ProgressFromSaveRoot } from '../../src/save/vault/v29-progress'

const exportRoot = {
  VersionNumber: 2910, ResearchLevel: [7, 12], UpgradeWorkshopLevel: [42, 18],
  ModuleInventory: [{ Guid: 'synthetic', InfoIndex: 1, Effects: [3, 4], Favorite: true }],
  BattleHistory: [{ Tier: 8, Wave: 1234, CoinsEarned: 1e10, BattleDate: '2026-10-13T12:00:00Z' }],
}
const bytes = new TextEncoder().encode(JSON.stringify(exportRoot))

describe('official JSON tool export', () => {
  it('sniffs the JSON signature without parsing on the caller thread', () => {
    expect(looksLikeToolExportJson(bytes)).toBe(true)
    expect(looksLikeToolExportJson(new TextEncoder().encode(' {bad JSON'))).toBe(true)
    expect(looksLikeToolExportJson(new Uint8Array([0, 1, 2]))).toBe(false)
  })
  it('normalizes root and nested names without dropping plain arrays or values', () => {
    const root = decodePlayerInfoSaveBytes(bytes)
    expect(root.battleRunCount).toBe(1)
    expect(root.wasGzip).toBe(false)
    expect(root.parsedRoot.upgradeWorkshopLevel).toEqual([42, 18])
    expect(root.parsedRoot.inventory).toEqual([{ guid: 'synthetic', infoIndex: 1, effects: [3, 4], favorite: true }])
    expect(listImportableBattleRuns(root.parsedRoot)[0]).toMatchObject({ tier: 8, wave: 1234, coinsEarned: 1e10 })
    expect(readLabsFromSaveRoot(root.parsedRoot)?.researches.slice(0, 2).map(row => row.level)).toEqual([7, 12])
  })
  it('agrees between Node, browser and loaded export bytes', async () => {
    const expected = decodePlayerInfoSaveBytes(bytes).parsedRoot
    expect(await decodeSaveFile(bytes)).toEqual(expected)
    expect(decodeInflatedSave(bytes)).toEqual(expected)
    expect(() => decodePlayerInfoSaveBytes(gzipSync(bytes))).toThrow('External Tools Export')
    await expect(decodeSaveFile(gzipSync(bytes))).rejects.toThrow('External Tools Export')
  })
  it('supports UTF-8 BOM and whitespace', () => {
    expect(readToolExportJson(new TextEncoder().encode('\uFEFF \n' + JSON.stringify(exportRoot)))).toEqual(decodeInflatedSave(bytes))
  })
  it('reads JSON Vault arrays and numeric-key dictionaries instead of dropping them', () => {
    const root = decodeInflatedSave(new TextEncoder().encode(JSON.stringify({
      VersionNumber: 2910, ResearchLevel: [1],
      Vault: { UnlockedGroups: [100], UpgradesLevel: { '1000': 1, '1010': 2, '999999': 1 } },
    })))
    const vault = readVaultV29ProgressFromSaveRoot(root)!
    expect(vault.levels['v29:harmony:Gameplay:__unlock__']).toBe(1)
    expect(vault.levels['v29:harmony:Gameplay:Auto Restart Run']).toBe(1)
    expect(vault.levels['v29:harmony:Gameplay:Ad Gem Stack']).toBe(2)
    expect(vault.upgradeCount).toBe(3)
    expect(vault.unknownVaultIds).toEqual([999999])
  })
  it('reports omitted lab queue fields rather than inventing inactive slots', () => {
    const root = decodeInflatedSave(new TextEncoder().encode(JSON.stringify({ VersionNumber: 2910, ResearchLevel: [7], LabLevel: [1, 1] })))
    const labs = readLabsFromSaveRoot(root)!
    expect(labs.hasActiveQueueData).toBe(false)
    expect(labs.activeQueue).toEqual([])
    expect(labs.warnings).toContain('Active lab queue fields are not included in this save/export; researched levels remain readable.')
  })
  it.each(['[]', '{}', '{"hello":1}', '{"VersionNumber":1,', '{"VersionNumber":1,"ResearchLevel":[1],"__proto__":{}}', '{"VersionNumber":1,"versionNumber":2,"ResearchLevel":[1]}', '{"ResearchLevel":["wrong"]}'])(
    'rejects malformed, unrelated or ambiguous JSON: %s', text => {
      expect(() => decodeInflatedSave(new TextEncoder().encode(text))).toThrow()
    },
  )
  it('targets external persistentDataPath, including Android secondary users', () => {
    expect(TOWER_SAVE_FILENAMES).toEqual(['tool_export.json'])
    expect(towerAndroidExportPaths()).toEqual([
      '/storage/emulated/0/Android/data/com.TechTreeGames.TheTower/files/tool_export.json',
      '/sdcard/Android/data/com.TechTreeGames.TheTower/files/tool_export.json',
    ])
    expect(towerAndroidExportPaths(10)).toEqual(['/storage/emulated/10/Android/data/com.TechTreeGames.TheTower/files/tool_export.json'])
    expect(() => towerAndroidExportPaths(-1)).toThrow()
  })
})
