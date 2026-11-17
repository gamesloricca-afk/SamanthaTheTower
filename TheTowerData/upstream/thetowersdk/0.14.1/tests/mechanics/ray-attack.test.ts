import { describe, expect, it } from 'vitest'
import { ENEMY_MULT_BY_TYPE_TABLE, RAY_ATTACK_PROFILE, rayAttackPayloadDamage } from '../../src/mechanics'

describe('Ray charged attack payload and timing', () => {
  it('separates the plain panel number from the existing canonical type multiplier', () => {
    expect(rayAttackPayloadDamage(75)).toBe(75 * ENEMY_MULT_BY_TYPE_TABLE.Ray.damage)
    expect(rayAttackPayloadDamage(75)).toBe(150)
    expect(rayAttackPayloadDamage(0)).toBe(0)
    expect(RAY_ATTACK_PROFILE).toEqual({ firstDelaySeconds: 30, periodSeconds: 30 })
    expect(Object.isFrozen(RAY_ATTACK_PROFILE)).toBe(true)
  })
  it('refuses negative, nonfinite and overflowing payloads', () => {
    for (const value of [-1, NaN, Infinity, -Infinity])
      expect(() => rayAttackPayloadDamage(value)).toThrow('FINITE_NONNEGATIVE')
    expect(() => rayAttackPayloadDamage(Number.MAX_VALUE)).toThrow('OVERFLOW')
  })
})
