import { describe, expect, it } from 'vitest'
import {
  CHAMPION_TOURNAMENT_PRIZES_V29,
  GRAND_CHAMPION_TOURNAMENT_PRIZES_V29,
  MYTHIC_TOURNAMENT_PRIZES_V29,
  PLATINUM_TOURNAMENT_PRIZES_V29,
  PRE29_CHAMPION_TOURNAMENT_PRIZES_V29,
  PRE29_GRAND_CHAMPION_TOURNAMENT_PRIZES_V29,
  PRE29_PLATINUM_TOURNAMENT_PRIZES_V29,
} from '../../src/data/generated/tournament-prizes-v29.generated'
import { TOURNAMENT_REWARD_ROWS } from '../../src/data/tournaments/data'

describe('v29 tournament prize reference values', () => {
  it('mythic has 10 complete prize rows', () => {
    expect(MYTHIC_TOURNAMENT_PRIZES_V29).toHaveLength(10)
    expect(MYTHIC_TOURNAMENT_PRIZES_V29[0]).toEqual({
      startRank: 1,
      endRank: 1,
      gems: 900,
      stones: 475,
      keys: 50,
    })
    expect(MYTHIC_TOURNAMENT_PRIZES_V29[9]).toEqual({
      startRank: 25,
      endRank: 30,
      gems: 335,
      stones: 225,
      keys: 8,
    })
  })

  it('pre29 tables keep gems/stones; ranks null (never stored in Init)', () => {
    expect(PRE29_PLATINUM_TOURNAMENT_PRIZES_V29[0]).toMatchObject({
      startRank: null,
      gems: 400,
      stones: 160,
      keys: 0,
    })
    expect(PRE29_CHAMPION_TOURNAMENT_PRIZES_V29[0].gems).toBe(600)
    expect(PRE29_GRAND_CHAMPION_TOURNAMENT_PRIZES_V29[0]).toMatchObject({
      gems: 800,
      stones: 425,
      keys: 25,
    })
  })

  it('live plat/champ/GC differ from pre29 gem tops', () => {
    expect(PLATINUM_TOURNAMENT_PRIZES_V29[0].gems).toBe(425)
    expect(PRE29_PLATINUM_TOURNAMENT_PRIZES_V29[0].gems).toBe(400)
    expect(CHAMPION_TOURNAMENT_PRIZES_V29[0].gems).toBe(550)
    expect(PRE29_CHAMPION_TOURNAMENT_PRIZES_V29[0].gems).toBe(600)
    expect(GRAND_CHAMPION_TOURNAMENT_PRIZES_V29[0].gems).toBe(675)
    expect(PRE29_GRAND_CHAMPION_TOURNAMENT_PRIZES_V29[0].gems).toBe(800)
  })

  it('TOURNAMENT_REWARD_ROWS Legend uses v29 reference prizes', () => {
    const legend1 = TOURNAMENT_REWARD_ROWS.find(r => r.league === 'Legend' && r.rank === '1')
    expect(legend1).toMatchObject({ gems: 675, stones: 375, keys: 25 })
    const plat1 = TOURNAMENT_REWARD_ROWS.find(r => r.league === 'Platinum' && r.rank === '1')
    expect(plat1).toMatchObject({ gems: 425, stones: 160 })
  })
})
