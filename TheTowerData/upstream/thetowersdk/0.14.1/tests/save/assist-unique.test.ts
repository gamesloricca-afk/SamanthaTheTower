import { describe, expect, it } from 'vitest'
import { decodeAssistUniqueEffectLevel, resolveAssistUniqueEffectRarity } from '../../src/save/modules/decode'
import { readModulesFromSaveRoot } from '../../src/save/modules/read'
import { decodePlayerInfoSaveBytes } from '../../src/node/decode-save'

describe('source-qualified assist unique-rarity upgrade ladder', () => {
  it('decodes only the four paid-upgrade-count states, never percentages', () => {
    for (const [upgradeLevel, slotRarity] of ['Epic','Legendary','Mythic','Ancestral'].entries()) {
      expect(decodeAssistUniqueEffectLevel(upgradeLevel)).toEqual({upgradeLevel,slotRarity})
    }
    for (const invalid of [undefined,null,'3',-1,4,.5,NaN,Infinity,{value__:3}]) expect(decodeAssistUniqueEffectLevel(invalid)).toBeNull()
  })
  it('caps slot rarity by the module coarse rung without changing plus/star rarity', () => {
    expect(resolveAssistUniqueEffectRarity(3,'Epic +')).toBe('Epic')
    expect(resolveAssistUniqueEffectRarity(3,'Legendary +')).toBe('Legendary')
    expect(resolveAssistUniqueEffectRarity(2,'Ancestral 5')).toBe('Mythic')
    expect(resolveAssistUniqueEffectRarity(3,'Ancestral 5')).toBe('Ancestral')
    for (const rarity of ['Common','Rare','Ancestral 9','ancestral',null]) expect(resolveAssistUniqueEffectRarity(3,rarity)).toBeNull()
  })
  it('joins exact official-export field path and current source values Cannon2 versus other slots3', () => {
    const official={ResearchLevel:[],ModuleEquipped:[],AssistModuleSlots:[9,17,47,40].map((InfoIndex,Type)=>({
      Type,Level:241,UniqueEffectEfficiencyLevel:Type===0?2:3,MainEffectEfficiencyLevel:69,SubstatEfficiencyLevel:69,
      EquippedModule:{InfoIndex,CurrentRarity:15,Level:241,Effects:[]}}))}
    const root=decodePlayerInfoSaveBytes(Buffer.from(JSON.stringify(official))).parsedRoot
    const rows=readModulesFromSaveRoot(root)!.equipped
    expect(rows.map(row=>row.assistUniqueEffectUpgradeLevel)).toEqual([2,3,3,3])
    expect(rows.map(row=>row.assistSlotUniqueRarity)).toEqual(['Mythic','Ancestral','Ancestral','Ancestral'])
    expect(rows.map(row=>row.effectiveUniqueRarity)).toEqual(['Mythic','Ancestral','Ancestral','Ancestral'])
    expect(rows.map(row=>row.rarityLabel)).toEqual(Array(4).fill('Ancestral 5'))
  })
  it('does not substitute slot level or efficiency fields for missing unique upgrade count', () => {
    const extract=readModulesFromSaveRoot({moduleEquipped:[{infoIndex:9,currentRarity:15,level:241}],
      uniqueEffectEfficiencyLevel:3,assistModuleSlots:[{type:0,level:3,mainEffectEfficiencyLevel:3,substatEfficiencyLevel:3,
        equippedModule:{infoIndex:9,currentRarity:15,level:241}}]})!
    expect(extract.equipped.map(row=>row.assistUniqueEffectUpgradeLevel)).toEqual([null,null])
    expect(extract.equipped.map(row=>row.effectiveUniqueRarity)).toEqual([null,null])
  })
})