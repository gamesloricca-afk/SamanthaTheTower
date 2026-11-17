import { describe, expect, it } from 'vitest'
import { LAB_WORKSHOP_FALLBACK_DIVISOR_S13 } from '../../src/mechanics/workshop/lab-workshop-constants'
import { labWorkshopMetaSlots } from '../../src/mechanics/workshop/lab-workshop-calculations'

describe('workshop-table-build (LabCalculations)', () => {
  it('uses bootstrap s13 for meta slots, not hardcoded 3.6', () => {
    const mainFactor = 2.175
    const existingSpeed = 158
    const bootstrap = existingSpeed * mainFactor
    const meta = labWorkshopMetaSlots(
      { labs_speed: 1, labs_coin_discount: 0 },
      mainFactor,
      { existingLabsSpeedSlot: existingSpeed },
    )
    expect(meta.divisorS13).toBeCloseTo(bootstrap, 4)
    const withFallback = labWorkshopMetaSlots({ labs_speed: 0 }, 1, {})
    expect(withFallback.divisorS13).toBe(LAB_WORKSHOP_FALLBACK_DIVISOR_S13)
  })
})
