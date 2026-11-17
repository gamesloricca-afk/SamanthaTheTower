import { describe, expect, it } from 'vitest'
import { botLabResearchSlugIndex, readBotLabLevelsFromResearchLevels } from '../../../src/mechanics/bots/lab-levels-from-research'

/**
 * The save's bot section carries cooldowns only, so Duration, Burn Stack and
 * Linger Time have to come from research levels. They were never derived, and
 * the Uptime calculator and medal splitter started at zero for every player.
 */
describe('bot lab levels from research', () => {
  it('pairs each bot with its own labs', () => {
    const index = botLabResearchSlugIndex()

    expect(index['Golden Bot']).toEqual({
      Duration: 'golden_bot_duration',
      Cooldown: 'golden_bot_cooldown',
    })
    expect(index['Flame Bot']).toEqual({
      Cooldown: 'flame_bot_cooldown',
      'Burn Stack': 'flame_bot_burn_stack',
    })
    expect(index['Thunder Bot']).toEqual({
      Cooldown: 'thunder_bot_cooldown',
      'Linger Time': 'thunder_bot_linger_time',
    })
  })

  /**
   * These are different bots with different labs. They were aliased together in
   * CANONICAL_LAB_SLUG_BY_ALIAS, which made Bot Bot report Amplify Bot's levels.
   */
  it('keeps Bot Bot and Amplify Bot separate', () => {
    const index = botLabResearchSlugIndex()

    expect(index['Amplify Bot']).toEqual({
      Duration: 'amplify_bot_duration',
      Cooldown: 'amplify_bot_cooldown',
    })
    expect(index['Bot Bot']).toEqual({
      Duration: 'bot_bot_duration',
      Cooldown: 'bot_bot_cooldown',
    })
    expect(index['Bot Bot']).not.toEqual(index['Amplify Bot'])
  })

  it('reads the levels a player actually has', () => {
    const levels = readBotLabLevelsFromResearchLevels({
      golden_bot_duration: 20,
      golden_bot_cooldown: 25,
      amplify_bot_duration: 18,
      amplify_bot_cooldown: 25,
      bot_bot_duration: 7,
      bot_bot_cooldown: 11,
      flame_bot_cooldown: 25,
      flame_bot_burn_stack: 5,
      thunder_bot_cooldown: 25,
      thunder_bot_linger_time: 20,
    })

    expect(levels['Golden Bot']).toEqual({ Duration: 20, Cooldown: 25 })
    expect(levels['Flame Bot']).toEqual({ Cooldown: 25, 'Burn Stack': 5 })
    expect(levels['Thunder Bot']).toEqual({ Cooldown: 25, 'Linger Time': 20 })
    // Distinct values prove the two are not reading the same slug.
    expect(levels['Amplify Bot']).toEqual({ Duration: 18, Cooldown: 25 })
    expect(levels['Bot Bot']).toEqual({ Duration: 7, Cooldown: 11 })
  })

  it('never lowers a level the player already recorded', () => {
    const levels = readBotLabLevelsFromResearchLevels(
      { golden_bot_duration: 5 },
      { 'Golden Bot': { Duration: 17, Cooldown: 9 } },
    )
    expect(levels['Golden Bot']?.Duration).toBe(17)
    expect(levels['Golden Bot']?.Cooldown).toBe(9)
  })

  it('treats a missing research level as zero rather than dropping the lab', () => {
    const levels = readBotLabLevelsFromResearchLevels({})
    expect(levels['Golden Bot']).toEqual({ Duration: 0, Cooldown: 0 })
  })
})
