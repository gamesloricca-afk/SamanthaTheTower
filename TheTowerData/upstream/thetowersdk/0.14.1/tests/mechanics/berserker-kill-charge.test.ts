import { describe, expect, it } from 'vitest'
import {
  BERSERKER_VAULT_KILL_CHARGE_FRACTION,
  berserkerKillChargeBonus,
} from '../../src/mechanics/combat/berserker'

describe('Berserker Auto Charge kill bank', () => {
  it('banks one damage from an enemy damage stat of 1000', () => {
    expect(BERSERKER_VAULT_KILL_CHARGE_FRACTION).toBe(0.001)
    expect(berserkerKillChargeBonus(1000)).toBe(1)
    expect(berserkerKillChargeBonus(1000)).not.toBe(0.014)
  })

  it('keeps zero enemy damage neutral', () => {
    expect(berserkerKillChargeBonus(0)).toBe(0)
  })

  it('rejects negative and nonfinite enemy damage', () => {
    for (const invalid of [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => berserkerKillChargeBonus(invalid))
        .toThrow('BERSERKER_KILL_CHARGE_ENEMY_DAMAGE_INVALID')
    }
  })
})
