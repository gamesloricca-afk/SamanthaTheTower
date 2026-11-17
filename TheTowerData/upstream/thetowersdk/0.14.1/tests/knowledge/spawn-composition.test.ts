import { describe, expect, it } from 'vitest'
import { GAME_KNOWLEDGE } from '../../src/knowledge'
import {
  BASIC_ULTIMATE_SPAWN_CHANCES,
} from '../../src/knowledge/compartments/enemies'

/** Spawn probabilities are a versioned model; remote settings can change elite composition. */

const node = GAME_KNOWLEDGE.compartments
  .flatMap(c => c.nodes)
  .find(n => n.id === 'enemy.spawnComposition')!
const claim = (predicate: string) =>
  node.assertions?.find(a => a.predicate === predicate)?.value

describe('spawn composition is recorded with its limits', () => {
  it('records the model without claiming independent verification', () => {
    expect(node).toBeDefined()
    expect(node.sources.some(source => source.origin === 'code')).toBe(true)
    expect(node.verification).toBe('unverified')
  })

  it('records remote configuration as a limit on elite probabilities', () => {
    expect(claim('eliteChancesAreRemoteConfigured')).toBe(true)
  })

  it('records that mini-boss spawns are seeded, so a run is reproducible', () => {
    expect(claim('miniBossSpawnsAreSeeded')).toBe(true)
  })

  it('pins the basic ultimate spawn probabilities', () => {
    expect(claim('basicUltimateSpawnChanceCount')).toBe(BASIC_ULTIMATE_SPAWN_CHANCES.length)
    expect(claim('lowestBasicUltimateChance')).toBe(0.01)
    expect(claim('highestBasicUltimateChance')).toBe(0.1)
  })

})
