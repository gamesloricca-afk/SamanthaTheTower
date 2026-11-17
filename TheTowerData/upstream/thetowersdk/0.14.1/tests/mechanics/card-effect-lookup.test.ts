import { describe, expect, it } from 'vitest'
import {
  cardLevelMultiplier,
  cardLevelPercentFraction,
  cardMasteryPercentFraction,
  enemyBalanceMasteryDoubleSpawnChancePct,
  enemyBalanceSpawnMultiplier,
} from '../../src/mechanics/cards/effect-lookup'

describe('card-effect-lookup', () => {
  it('Enemy Balance level multipliers from card-data', () => {
    expect(enemyBalanceSpawnMultiplier(1)).toBe(1.3)
    expect(enemyBalanceSpawnMultiplier(7)).toBe(1.9)
  })

  it('Enemy Balance mastery double-spawn % from card-data', () => {
    expect(enemyBalanceMasteryDoubleSpawnChancePct(0)).toBe(6)
    expect(enemyBalanceMasteryDoubleSpawnChancePct(9)).toBe(60)
  })

  it('Wave Accelerator cooldown reduction fractions', () => {
    expect(cardLevelPercentFraction('wa', 1)).toBeCloseTo(0.3)
    expect(cardLevelPercentFraction('wa', 7)).toBeCloseTo(0.54)
  })

  it('falls back safely for unknown cards', () => {
    expect(cardLevelMultiplier('missing', 5)).toBe(1)
    expect(cardMasteryPercentFraction('missing', 5)).toBe(0)
  })
})
