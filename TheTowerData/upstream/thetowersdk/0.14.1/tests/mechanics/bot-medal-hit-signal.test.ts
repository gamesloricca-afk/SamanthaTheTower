import { describe, expect, it } from 'vitest'
import {
  botMedalAmplifyDamageHitSignal,
  computeBotMedalRowDamageHitSignal,
} from '../../src/mechanics/bots/medal-hit-signal'

describe('botMedalAmplifyDamageHitSignal', () => {
  it('matches amplify bonus without flame coverage', () => {
    expect(botMedalAmplifyDamageHitSignal({
      amplifyBonusMultiplier: 3.5,
      flameDebuffCoverageFraction: 0,
    })).toBe(3.5)
  })

  it('doubles amplify signal at full flame debuff coverage', () => {
    expect(botMedalAmplifyDamageHitSignal({
      amplifyBonusMultiplier: 3.5,
      flameDebuffCoverageFraction: 1,
    })).toBe(7)
  })

  it('blends flame debuff by coverage fraction', () => {
    expect(botMedalAmplifyDamageHitSignal({
      amplifyBonusMultiplier: 2,
      flameDebuffCoverageFraction: 0.5,
    })).toBe(3)
  })
})

describe('computeBotMedalRowDamageHitSignal', () => {
  it('passes through non-amplify bots', () => {
    expect(computeBotMedalRowDamageHitSignal({
      botLabel: 'Golden Bot',
      baseNumber: 4.2,
    })).toBe(4.2)
  })

  it('routes amplify bot through hit multiplier chain', () => {
    expect(computeBotMedalRowDamageHitSignal({
      botLabel: 'Amplify Bot',
      baseNumber: 2,
      flameDebuffCoverageFraction: 1,
    })).toBe(4)
  })
})
