import { describe, expect, it } from 'vitest'
import { readToolExportJson } from '../../src/save/access/json'
import { readBotSynchronicityFromSaveRoot } from '../../src/save/bots/read'

describe('public bot synchronicity contract', () => {
  it.each([null, undefined, {}, { researchLevel: [1] }])('distinguishes omitted data from a locked save', root => {
    expect(readBotSynchronicityFromSaveRoot(root)).toMatchObject({
      inSave: false, unlocked: false, level: 0, slotCount: 0,
      slots: [], bots: [], occupiedSlots: 0, unrecognizedSlotValues: [],
    })
  })

  it('reports explicitly locked fields as present', () => {
    expect(readBotSynchronicityFromSaveRoot({ synchronicityUnlocked: false })).toMatchObject({
      inSave: true, unlocked: false, slotCount: 0, slots: [], bots: [],
    })
  })

  it('retains ordered slots and reports unknown values without inferring bot assignments', () => {
    const result = readBotSynchronicityFromSaveRoot({
      synchronicityUnlocked: true, synchronicityLevel: 1,
      synchronicityBots: [0, null, { value__: 2 }, 99],
    })
    expect(result).toMatchObject({
      inSave: true, slotCount: 3,
      slots: ['Flame Bot', null, 'Golden Bot', null],
      bots: ['Flame Bot', 'Golden Bot'], occupiedSlots: 2,
      unrecognizedSlotValues: [99],
    })
  })

  it('reads the selected preset rather than a different preset or the flat fallback', () => {
    const result = readBotSynchronicityFromSaveRoot({
      synchronicityUnlocked: true, synchronicityLevel: 0, currentBotPreset: 1,
      synchronicityBots: [0],
      synchronicityPresets: [{ synchronicityBots: [0] }, { synchronicityBots: [3, 1] }],
    })
    expect(result.slots).toEqual(['Amplify Bot', 'Thunder Bot'])
    expect(result.bots).toEqual(['Amplify Bot', 'Thunder Bot'])
  })

  it('preserves the existing occupied-count boundary and locked behavior', () => {
    expect(readBotSynchronicityFromSaveRoot({
      synchronicityUnlocked: true, synchronicityLevel: 0, synchronicityBots: [0, 1, 2, 3],
    }).occupiedSlots).toBe(2)
    expect(readBotSynchronicityFromSaveRoot({
      synchronicityUnlocked: false, synchronicityBots: [0],
    })).toMatchObject({ inSave: true, occupiedSlots: 0, slots: ['Flame Bot'] })
  })

  it('exposes the same contract through the official JSON parser, including boxed enum values', () => {
    const root = readToolExportJson(new TextEncoder().encode(JSON.stringify({
      ResearchLevel: [1], SynchronicityUnlocked: true, SynchronicityLevel: 0,
      SynchronicityPresets: [{ SynchronicityBots: [{ Value__: 0 }, null] }],
    })))
    expect(readBotSynchronicityFromSaveRoot(root)).toMatchObject({
      inSave: true, slots: ['Flame Bot', null], bots: ['Flame Bot'], occupiedSlots: 1,
    })
  })
})
