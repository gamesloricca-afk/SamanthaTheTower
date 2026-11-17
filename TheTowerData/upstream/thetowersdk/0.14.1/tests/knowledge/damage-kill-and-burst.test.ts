import { describe, expect, it } from 'vitest'
import { GAME_KNOWLEDGE } from '../../src/knowledge'
import { FIRE_BURST_SHOT_CAP } from '../../src/knowledge/compartments/tower'

const nodes = GAME_KNOWLEDGE.compartments.flatMap(c => c.nodes)
const claim = (id: string, predicate: string) =>
  nodes.find(n => n.id === id)?.assertions?.find(a => a.predicate === predicate)?.value

describe('the firing accumulator', () => {
  it('caps a burst rather than the accumulator', () => {
    expect(claim('tower.firingLoop', 'burstShotCap')).toBe(FIRE_BURST_SHOT_CAP)
    expect(FIRE_BURST_SHOT_CAP).toBe(1000)
  })

  it('records that the remainder carries', () => {
    expect(claim('tower.firingLoop', 'accumulatorRemainderCarries')).toBe(true)
    expect(claim('tower.firingLoop', 'intervalIsReciprocalOfAttackSpeed')).toBe(true)
  })
})

describe('damage can reduce enemy levels', () => {
  it('records reductions as per-enemy diminishing effects', () => {
    expect(claim('enemy.damageAndKill', 'damageCanReduceWaveLevel')).toBe(true)
    expect(claim('enemy.damageAndKill', 'levelReductionsDiminish')).toBe(true)
  })
})
