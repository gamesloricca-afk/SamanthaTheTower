import { describe, expect, it } from 'vitest'
import {
  GUILD_ACTIVE_ROLES,
  GUILD_CHEST_COIN_REWARD_IS_MULTIPLIER,
  GUILD_CHEST_FIELDS,
  GUILD_CONTRIBUTION_IS_WEEKLY,
  GUILD_DEPARTED_ROLES,
  GUILD_KNOWLEDGE_EDGES,
  GUILD_MEMBER_FIELDS,
  GUILD_MEMBER_ROLES,
} from '../../src/knowledge/compartments/guild'

describe('guild roles', () => {
  it('splits the enum into ranks and departures with nothing left over', () => {
    const partition = [...GUILD_ACTIVE_ROLES, ...GUILD_DEPARTED_ROLES].sort()
    expect(partition).toEqual([...GUILD_MEMBER_ROLES].sort())
    expect(GUILD_ACTIVE_ROLES.some(r => GUILD_DEPARTED_ROLES.includes(r))).toBe(false)
  })

  it('keeps departure inside the role enum, which is the trap', () => {
    expect(GUILD_MEMBER_ROLES).toContain('Kicked')
    expect(GUILD_MEMBER_ROLES).toContain('Quit')
    // A "has a role" test therefore does not mean "is a member".
    expect(GUILD_DEPARTED_ROLES.every(r => GUILD_MEMBER_ROLES.includes(r))).toBe(true)
    expect(GUILD_ACTIVE_ROLES).toHaveLength(3)
  })
})

describe('guild member record', () => {
  it('carries a weekly contribution and no lifetime total', () => {
    expect(GUILD_CONTRIBUTION_IS_WEEKLY).toBe(true)
    expect(GUILD_MEMBER_FIELDS).toContain('contribution')
    expect(GUILD_MEMBER_FIELDS).toContain('weekNumber')
    const lifetime = GUILD_MEMBER_FIELDS.filter(f => /total|lifetime|cumulative/i.test(f))
    expect(lifetime, 'no lifetime contribution field exists').toEqual([])
  })

  it('has a quit date but no membership history', () => {
    expect(GUILD_MEMBER_FIELDS).toContain('joinDate')
    expect(GUILD_MEMBER_FIELDS).toContain('quitDate')
    expect(GUILD_MEMBER_FIELDS.filter(f => /history|previous/i.test(f))).toEqual([])
  })
})

describe('the stored chest row', () => {
  it('has exactly one multiplier among the reward fields', () => {
    expect(GUILD_CHEST_COIN_REWARD_IS_MULTIPLIER).toBe(true)
    const multipliers = GUILD_CHEST_FIELDS.filter(f => /Multiplier$/.test(f))
    const amounts = GUILD_CHEST_FIELDS.filter(f => /Reward$/.test(f))
    expect(multipliers).toEqual(['coinsRewardMultiplier'])
    expect(amounts.sort()).toEqual(['bitsReward', 'gemsReward', 'tokensReward'])
  })

  it('tracks claiming per week rather than globally', () => {
    expect(GUILD_CHEST_FIELDS).toContain('claimedWeek')
    expect(GUILD_CHEST_FIELDS).toContain('requirement')
    expect(GUILD_CHEST_FIELDS).toHaveLength(6)
  })
})

describe('the guild gates the guardian economy contribution', () => {
  it('has an edge saying so', () => {
    const gate = GUILD_KNOWLEDGE_EDGES.find(
      e => e.from === 'guild' && e.to === 'guardian.chipBenefits',
    )
    expect(gate?.kind).toBe('gates')
  })
})
