import { describe, expect, it } from 'vitest'
import {
  evaluatePlannerCitation,
  listPlannerEvaluatorBindings,
  resolvePlannerEvaluator,
} from '../../../tooling/planner-engine'

describe('planner eval bindings', () => {
  it('lists curated bindings only (no invented evaluators)', () => {
    const bindings = listPlannerEvaluatorBindings()
    expect(bindings.length).toBeGreaterThanOrEqual(3)
    expect(bindings.every(b => b.exportName && b.modulePath && b.nodeId)).toBe(true)
  })

  it('resolves WSPUTILITY spend via workshopEnhancementCoinsInvested', () => {
    const r = evaluatePlannerCitation('eEcon', {
      nodeId: 'lambda.WSPUTILITY_TOTAL_COINS_INVESTED',
      utilityLevels: { 'Cash Bonus': 10 },
    })
    expect(r.ok).toBe(true)
    expect(r.value).toBe(55_540_000_000)
    expect(r.binding?.exportName).toBe('workshopEnhancementCoinsInvested')
  })

  it('resolves Coin Bonus hide gate from UTILITY_ENHANCEMENT_SPEND_UNLOCKS', () => {
    const r = evaluatePlannerCitation('eEcon', {
      nodeId: 'hide.eEcon.EO2.coinBonus',
      utilityLevels: { 'Cash Bonus': 0 },
      unlockStat: 'Coin Bonus',
    })
    expect(r.ok).toBe(true)
    expect(r.value).toMatchObject({
      stat: 'Coin Bonus',
      threshold: expect.any(Number),
      hidden: expect.any(Boolean),
    })
  })

  it('refuses unknown nodeIds', () => {
    const r = evaluatePlannerCitation('eEcon', { nodeId: 'lambda.FAKE_INVENTED' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/no hand-ported evaluator/)
    expect(resolvePlannerEvaluator('lambda.FAKE_INVENTED')).toBeNull()
  })
})
