import { describe, expect, it } from 'vitest'
import { GAME_KNOWLEDGE } from '../../src/knowledge'
import { findContradictions } from '../../src/knowledge/substrate/contradictions'
import { PERK_APPLIED_AS } from '../../src/save/catalogs/perks'

/**
 * `PERK_APPLIED_AS` was imported into the perks compartment and never used —
 * the additive-vs-multiplicative distinction the compartment header calls "the
 * trap worth the whole file" was described in prose and absent from the graph.
 *
 * These tests hold the encoding in place, and in particular hold the wiki/game
 * disagreement on ONE `(subject, predicate)` pair, because that is the only
 * form `findContradictions` can see.
 */
describe('perk application form is in the graph', () => {
  const nodes = GAME_KNOWLEDGE.compartments.flatMap(c => c.nodes)
  const node = nodes.find(n => n.id === 'perk.applicationForm')

  it('records the application model without claiming independent verification', () => {
    expect(node).toBeDefined()
    expect(node?.verification).toBe('unverified')
    expect(node?.sources.some(source => source.origin === 'code')).toBe(true)
  })

  it('its counts are derived from the table, not transcribed', () => {
    const forms = Object.values(PERK_APPLIED_AS)
    const find = (p: string) => node?.assertions?.find(a => a.predicate === p)?.value
    expect(find('perksCovered')).toBe(Object.keys(PERK_APPLIED_AS).length)
    expect(find('appliedAsMultiply')).toBe(forms.filter(f => f === 'multiply').length)
    expect(find('appliedAsAdd')).toBe(forms.filter(f => f === 'add').length)
    expect(find('appliedAsGrant')).toBe(forms.filter(f => f === 'grant').length)
  })

  it('records the wiki disagreement where findContradictions can see it', () => {
    const found = findContradictions(GAME_KNOWLEDGE)
    const perkWave = found.find(c => c.subject === 'perk.perkWaveRequirement' && c.predicate === 'appliedAs')
    expect(perkWave, 'the Perk Wave Requirement disagreement is not detected').toBeDefined()
    const values = perkWave!.claims.map(c => c.value).sort()
    expect(values).toEqual(['add', 'multiply'])
    // Retain the disagreement without upgrading the SDK model to independent evidence.
    expect(perkWave!.claims.find(claim => claim.origin === 'code')?.value).toBe('multiply')
  })

  it('does NOT report a contradiction where the two sources agree', () => {
    const found = findContradictions(GAME_KNOWLEDGE)
    expect(found.find(c => c.subject === 'perk.defensePercent')).toBeUndefined()
  })

  it('the stacking node points at the corrected membership list', () => {
    const stacking = nodes.find(n => n.id === 'perk.stacking')
    expect(stacking?.traps?.some(t => t.includes('perk.applicationForm'))).toBe(true)
  })
})
