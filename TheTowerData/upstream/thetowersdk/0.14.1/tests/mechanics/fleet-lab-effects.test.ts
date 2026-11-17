import { describe, expect, it } from 'vitest'
import {
  commanderBuffRadiusScaleAfterLab,
  overchargeAttackExponentAfterLab,
  saboteurSpeedMultAfterLab,
} from '../../src/mechanics/enemies/fleet-lab-effects'
import {
  COMMANDER_BUFF_RADIUS_BASE_SCALE,
  OVERCHARGE_ATTACK_EXPONENT_BASE,
} from '../../src/data/enemies/data'
import { LAB_CATALOG } from '../../src/data/labs/catalog.data'

describe('fleet lab effects (simulator inputs)', () => {
  it('starts from v29 reference constants at level 0', () => {
    expect(overchargeAttackExponentAfterLab(0)).toBe(OVERCHARGE_ATTACK_EXPONENT_BASE)
    expect(commanderBuffRadiusScaleAfterLab(0)).toBe(COMMANDER_BUFF_RADIUS_BASE_SCALE)
    expect(saboteurSpeedMultAfterLab(0)).toBe(2)
  })

  it('applies owner-verified overcharge exponent reducer curve', () => {
    // L10: 1 + (40 - 0.5*10)/100 = 1.35
    expect(overchargeAttackExponentAfterLab(10)).toBeCloseTo(1.35, 6)
  })

  it('scales commander radius and saboteur speed with lab levels', () => {
    expect(commanderBuffRadiusScaleAfterLab(10)).toBeCloseTo(
      COMMANDER_BUFF_RADIUS_BASE_SCALE * 1.1,
      6,
    )
    expect(saboteurSpeedMultAfterLab(10)).toBeCloseTo(2.4, 6)
  })

  it('matches LAB_CATALOG base/value for the three behavior labs', () => {
    const bySlug = Object.fromEntries(LAB_CATALOG.map((lab) => [lab.slug, lab]))
    expect(bySlug.overcharge_exponent_reducer).toMatchObject({ base: 40, value: -0.5 })
    expect(bySlug.commander_radius).toMatchObject({ base: 0, value: 1 })
    expect(bySlug.saboteur_attack_speed).toMatchObject({ base: 0, value: 2 })
  })
})

