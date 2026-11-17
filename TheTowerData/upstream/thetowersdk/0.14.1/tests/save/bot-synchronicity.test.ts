import { describe, expect, it } from 'vitest'

import { sumBotSyncSlotCosts } from '../../src/data/bots/data'
import { computeBotsStonesSpent, readBotSynchronicityFromSaveRoot } from '../../src/save/bots/read'

/** A slot value as the save decoder writes it: the bot type, boxed. */
const boxed = (type: number) => ({ typeName: 'Bot+BotType', value__: type })

const presets = (...slotLists: unknown[][]) => ({
  _items: slotLists.map(synchronicityBots => ({ synchronicityBots })),
  _size: slotLists.length,
})

describe('synchronicity slots from a save', () => {
  it('names the bot in each slot of the active preset, in slot order', () => {
    const sync = readBotSynchronicityFromSaveRoot({
      currentBotPreset: 1,
      synchronicityUnlocked: true,
      synchronicityLevel: 1,
      synchronicityPresets: presets(
        [boxed(0), null, null, null, null],
        [boxed(4), boxed(2), null, null, null],
        [null, null, null, null, null],
      ),
    })
    expect(sync.slots).toEqual(['Bot Bot', 'Golden Bot', null, null, null])
    expect(sync.bots).toEqual(['Bot Bot', 'Golden Bot'])
    expect(sync.slotCount).toBe(3)
    expect(sync.occupiedSlots).toBe(2)
    expect(sync.unrecognizedSlotValues).toEqual([])
  })

  it('maps every bot type the game has, and accepts a plain number too', () => {
    const sync = readBotSynchronicityFromSaveRoot({
      currentBotPreset: 0,
      synchronicityUnlocked: true,
      synchronicityLevel: 3,
      synchronicityPresets: presets([0, 1, boxed(2), 3, boxed(4)]),
    })
    expect(sync.slots).toEqual(['Flame Bot', 'Thunder Bot', 'Golden Bot', 'Amplify Bot', 'Bot Bot'])
  })

  it('reports a slot value it cannot name instead of dropping it', () => {
    const sync = readBotSynchronicityFromSaveRoot({
      currentBotPreset: 0,
      synchronicityUnlocked: true,
      synchronicityLevel: 0,
      synchronicityPresets: presets([boxed(9), boxed(1), null, null, null]),
    })
    expect(sync.slots).toEqual([null, 'Thunder Bot', null, null, null])
    expect(sync.unrecognizedSlotValues).toEqual([boxed(9)])
  })

  it('says a save from before synchronicity does not carry it', () => {
    const sync = readBotSynchronicityFromSaveRoot({ currentBotPreset: 0 })
    expect(sync.inSave).toBe(false)
    expect(sync.bots).toEqual([])
    expect(readBotSynchronicityFromSaveRoot({ synchronicityUnlocked: false }).inSave).toBe(true)
  })
})

describe('synchronicity slot prices', () => {
  it('charges the unlock, then nothing for the second slot, then 1500 a slot', () => {
    expect([0, 1, 2, 3, 4, 5].map(sumBotSyncSlotCosts)).toEqual([0, 1500, 1500, 3000, 4500, 6000])
  })

  it('prices per-bot sync flags by the slots they need', () => {
    const none = { 'Flame Bot': false, 'Thunder Bot': false, 'Golden Bot': false, 'Amplify Bot': false, 'Bot Bot': false }
    expect(computeBotsStonesSpent(none, { ...none, 'Golden Bot': true, 'Bot Bot': true })).toBe(1500)
    expect(computeBotsStonesSpent(none, { ...none, 'Flame Bot': true, 'Golden Bot': true, 'Bot Bot': true })).toBe(3000)
  })
})
