import { describe, expect, it } from 'vitest'
import {
  assistMultiplierEfficiencyFactor,
  clampAssistModuleSlotEfficiencyPct,
  clampAssistMultiplierEfficiencyPct,
  computeAssistMultiplierEfficiencyPct,
  MAX_ASSIST_MODULE_SLOT_EFFICIENCY_PCT,
  MAX_ASSIST_MULTIPLIER_EFFICIENCY_PCT,
} from '../../src/mechanics/modules/assist-module-efficiency'

describe('assist-module-efficiency', () => {
  it('caps module slot efficiency at 100%', () => {
    expect(clampAssistModuleSlotEfficiencyPct(150)).toBe(MAX_ASSIST_MODULE_SLOT_EFFICIENCY_PCT)
    expect(clampAssistModuleSlotEfficiencyPct(-5)).toBe(0)
  })

  it('caps combined multiplier efficiency at 130% (v28.3)', () => {
    expect(computeAssistMultiplierEfficiencyPct(100, 30)).toBe(MAX_ASSIST_MULTIPLIER_EFFICIENCY_PCT)
    expect(computeAssistMultiplierEfficiencyPct(100, 50)).toBe(MAX_ASSIST_MULTIPLIER_EFFICIENCY_PCT)
    expect(clampAssistMultiplierEfficiencyPct(131)).toBe(130)
  })

  it('returns factor up to 1.3', () => {
    expect(assistMultiplierEfficiencyFactor(100, 30)).toBeCloseTo(1.3)
    expect(assistMultiplierEfficiencyFactor(80, 10)).toBeCloseTo(0.9)
  })
})
