import { describe, expect, it } from 'vitest'
import { readDurationSecondsFromSave } from '../../src/save/battle/duration'

const TICKS_PER_SECOND = 10_000_000
const LONG_RUN_SECONDS = 86_400 + 9 * 3_600 + 24 * 60 + 29

describe('battle-duration-from-save', () => {
  it('treats long run magnitudes as seconds, not milliseconds', () => {
    expect(readDurationSecondsFromSave(LONG_RUN_SECONDS)).toBe(LONG_RUN_SECONDS)
    expect(readDurationSecondsFromSave(68103)).toBe(68103)
    expect(readDurationSecondsFromSave(120_269)).toBe(120_269)
  })

  it('converts decoder-scale millisecond magnitudes for shorter runs', () => {
    expect(readDurationSecondsFromSave(180_000)).toBe(180)
    expect(readDurationSecondsFromSave(18 * 3600 * 1000)).toBe(18 * 3600)
  })

  it('converts .NET TimeSpan ticks from value__ objects', () => {
    expect(readDurationSecondsFromSave({
      typeName: 'System.TimeSpan',
      value__: LONG_RUN_SECONDS * TICKS_PER_SECOND,
    })).toBe(LONG_RUN_SECONDS)
  })
})
