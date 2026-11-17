import { describe, expect, it } from 'vitest'
import {
  BOT_MEDAL_DEFAULT_TOWER_RANGE_METERS,
  botMedalCoverageFraction,
  circleOverlapFractionOfTarget,
  sharedPathBotBotOverlapFraction,
  simulateBotMedalActivationTiming,
  simulateBotMedalInteraction,
} from '../../src/mechanics/bots/medal-simulation'
import {
  BOT_ROAM_RADIUS_FACTOR,
  BOT_TRIGGER_COLLIDER_RADIUS,
  botRoamRadius,
  botTriggerRadiusWorldUnits,
  towerMaxDistanceWorldUnits,
} from '../../src/mechanics/bots/geometry'

describe('botTriggerRadiusWorldUnits', () => {
  /**
   * Anchored on the game's numbers rather than on the implementation. The test this replaces
   * asserted `(displayRange * 10 / 10) * botTowerFactor(towerRange / 10)` — the body of the
   * function it was checking, cancelling `* 10` against `/ 10` in the assertion exactly as
   * the code did. It could not have failed for the bug it was covering.
   */
  it('is half the localScale Bot.UpdateSize computes', () => {
    // A 60 M bot on a 60 M tower: maxDistance 6, size factor 0.9, so localScale is 5.4 and
    // the trigger's radius is 0.5 of it. UpdateSize writes that scale onto the collider's
    // own transform, which is why the prefab's authored 2 does not enter into it.
    expect(towerMaxDistanceWorldUnits(60)).toBeCloseTo(6, 8)
    expect(botTriggerRadiusWorldUnits(60, 60)).toBeCloseTo(5.4 * BOT_TRIGGER_COLLIDER_RADIUS, 8)
    expect(botTriggerRadiusWorldUnits(60, 60)).toBeCloseTo(2.7, 8)
  })

  it('fits inside the disc the bot roams, which the display metres did not', () => {
    // The reading this replaces treated the display metres as the radius: 60 against a roam
    // disc of 3.19, twenty times over, so every coverage fraction saturated at 1.
    const roam = botRoamRadius(towerMaxDistanceWorldUnits(60))
    expect(roam).toBeCloseTo(BOT_ROAM_RADIUS_FACTOR * Math.sqrt(6), 8)
    expect(botTriggerRadiusWorldUnits(60, 60)).toBeLessThan(roam)
  })

  it('rises with tower range, and not linearly', () => {
    // botTowerFactor is a clamped lerp over maxDistance 3..12, so it flattens at both ends —
    // the intuitive towerRange/60 has no floor and disagrees everywhere.
    const low = botTriggerRadiusWorldUnits(60, 30)
    const mid = botTriggerRadiusWorldUnits(60, 60)
    const high = botTriggerRadiusWorldUnits(60, 120)
    expect(low).toBeLessThan(mid)
    expect(mid).toBeLessThan(high)
    expect(mid - low).not.toBeCloseTo(high - mid, 6)
    expect(botTriggerRadiusWorldUnits(60, 20)).toBeCloseTo(low, 8) // clamped below 3
  })
})

describe('sharedPathBotBotOverlapFraction', () => {
  it('returns full overlap when Bot Bot radius covers the other bot', () => {
    expect(sharedPathBotBotOverlapFraction(20, 40)).toBe(1)
  })

  it('returns radius-ratio squared for partial coverage', () => {
    expect(sharedPathBotBotOverlapFraction(40, 20)).toBeCloseTo(0.25, 8)
  })
})

describe('circleOverlapFractionOfTarget', () => {
  it('returns 1 for concentric equal radii', () => {
    expect(circleOverlapFractionOfTarget(30, 30, 0)).toBeCloseTo(1, 8)
  })

  it('returns 0 when circles do not touch', () => {
    expect(circleOverlapFractionOfTarget(10, 10, 25)).toBe(0)
  })
})

describe('simulateBotMedalActivationTiming', () => {
  it('returns full overlap for identical duration/cooldown cycles', () => {
    const result = simulateBotMedalActivationTiming(10, 20, 10, 20, {
      stepSeconds: 1,
      durationSeconds: 200,
    })
    expect(result.overlapOfTotalTimeFraction).toBeCloseTo(0.5, 2)
    expect(result.overlapOfBotUptimeFraction).toBeCloseTo(1, 2)
    expect(result.overlapOfBotBotUptimeFraction).toBeCloseTo(1, 2)
  })
})

describe('simulateBotMedalInteraction', () => {
  it('is deterministic for independent-path sampling', () => {
    const args = {
      otherBotLabel: 'Flame Bot',
      otherDurationSeconds: 10,
      otherCooldownSeconds: 20,
      otherRangeMeters: 45,
      botBotDurationSeconds: 10,
      botBotCooldownSeconds: 20,
      botBotRangeMeters: 30,
      sharedPath: false,
      arenaRadiusMeters: BOT_MEDAL_DEFAULT_TOWER_RANGE_METERS,
      stepSeconds: 1,
      durationSeconds: 400,
    }
    const first = simulateBotMedalInteraction(args)
    const second = simulateBotMedalInteraction(args)
    expect(first).toEqual(second)
    expect(first.overlapOfTotalTimeFraction).toBeGreaterThan(0)
    expect(first.overlapOfTotalTimeFraction).toBeLessThan(0.5)
  })

  it('uses co-located centers on shared path', () => {
    const result = simulateBotMedalInteraction({
      otherBotLabel: 'Golden Bot',
      otherDurationSeconds: 35,
      otherCooldownSeconds: 75,
      otherRangeMeters: 60,
      botBotDurationSeconds: 35,
      botBotCooldownSeconds: 75,
      botBotRangeMeters: 30,
      sharedPath: true,
      stepSeconds: 1,
      durationSeconds: 300,
    })
    expect(result.conditionedSpatialOverlapFraction).toBeCloseTo(0.25, 8)
    expect(result.overlapOfTotalTimeFraction).toBeGreaterThan(0)
  })
})

describe('botMedalCoverageFraction', () => {
  it('is the trigger disc over the roam disc', () => {
    // (2.7 / 1.3*sqrt(6))^2 = 0.719. The 0.81 this asserted before came from a second
    // implementation that used the localScale as a radius AND the tower's display range as
    // the arena: both wrong, partly cancelling, and checkable against nothing.
    const radius = botTriggerRadiusWorldUnits(60, 60)
    const roam = botRoamRadius(towerMaxDistanceWorldUnits(60))
    expect(botMedalCoverageFraction(60, 60)).toBeCloseTo((radius / roam) ** 2, 8)
    expect(botMedalCoverageFraction(60, 60)).toBeCloseTo(0.719, 3)
  })

  it('counts the global range bonus as extra metres', () => {
    expect(botMedalCoverageFraction(50, 60, 10)).toBeCloseTo(botMedalCoverageFraction(60, 60), 8)
  })

  it('never exceeds the disc it is a share of', () => {
    for (const range of [20, 60, 90, 400]) {
      const coverage = botMedalCoverageFraction(range, 60)
      expect(coverage).toBeGreaterThan(0)
      expect(coverage).toBeLessThanOrEqual(1)
    }
  })
})
