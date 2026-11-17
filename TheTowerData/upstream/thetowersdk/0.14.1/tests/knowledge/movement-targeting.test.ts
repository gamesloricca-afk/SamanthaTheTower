import { describe, expect, it } from 'vitest'
import { GAME_KNOWLEDGE } from '../../src/knowledge'
import { ENEMY_SPEED_PERK_INDICES, TOWER_TARGET_PRIORITIES } from '../../src/knowledge/compartments/enemies'
import { PERK_IMPORT_CATALOG } from '../../src/save/catalogs/perks'
import { ENEMY_TYPES } from '../../src/knowledge/compartments/enemies'

/** Check speed perk identities and targeting choices against the public catalogs. */

const node = GAME_KNOWLEDGE.compartments
  .flatMap(c => c.nodes)
  .find(n => n.id === 'enemy.movementAndTargeting')!
const claim = (predicate: string) =>
  node.assertions?.find(a => a.predicate === predicate)?.value

describe('enemy speed perks resolve to speed perks', () => {
  it('both indices name a perk that mentions speed', () => {
    for (const index of ENEMY_SPEED_PERK_INDICES) {
      const row = (PERK_IMPORT_CATALOG as readonly { index: number, name: string }[])
        .find(entry => entry.index === index)
      expect(row, `perk ${index} is not in the catalog`).toBeDefined()
      expect(row!.name.toLowerCase(), `perk ${index}: ${row!.name}`).toContain('speed')
    }
  })

  it('one applies to every enemy and one only to bosses', () => {
    const byIndex = (index: number) =>
      (PERK_IMPORT_CATALOG as readonly { index: number, name: string }[])
        .find(entry => entry.index === index)!.name
    expect(byIndex(claim('allEnemySpeedPerkIndex') as number).toLowerCase()).toContain('enemies speed')
    expect(byIndex(claim('bossSpeedPerkIndex') as number).toLowerCase()).toContain('boss speed')
  })
})

describe('target priorities are recorded as two kinds of rule', () => {
  it('has one positional priority and it is Closest at index 0', () => {
    expect(claim('positionalPriorityCount')).toBe(1)
    expect(claim('closestPriorityIndex')).toBe(0)
    expect(TOWER_TARGET_PRIORITIES[0]).toBe('Closest')
  })

  it('includes Spotlight, which is NOT an enemy type', () => {
    expect(TOWER_TARGET_PRIORITIES).toContain('Spotlight')
    expect(ENEMY_TYPES).not.toContain('Spotlight')
    // Its position is what breaks a naive index-to-type mapping.
    expect(claim('spotlightPriorityIndex')).toBe(TOWER_TARGET_PRIORITIES.indexOf('Spotlight'))
  })

  it('does not line up with the enemy type list, so the two must not be zipped', () => {
    // Several priorities name real enemy types, but the lists differ in length
    // and in order, so index N of one is not index N of the other.
    expect(TOWER_TARGET_PRIORITIES.length).not.toBe(ENEMY_TYPES.length)
    const shared = TOWER_TARGET_PRIORITIES.filter(p => ENEMY_TYPES.includes(p))
    expect(shared.length).toBeGreaterThan(0)
    expect(shared.length).toBeLessThan(TOWER_TARGET_PRIORITIES.length)
  })

  it('carries every priority the enum declares', () => {
    expect(claim('targetPriorityCount')).toBe(TOWER_TARGET_PRIORITIES.length)
    expect(TOWER_TARGET_PRIORITIES.length).toBe(10)
    expect(new Set(TOWER_TARGET_PRIORITIES).size).toBe(TOWER_TARGET_PRIORITIES.length)
  })
})
