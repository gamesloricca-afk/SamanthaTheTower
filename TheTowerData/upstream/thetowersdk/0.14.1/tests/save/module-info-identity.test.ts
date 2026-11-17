/**
 * Module identities, held to the game's own save format.
 *
 * `save-format-enums.test.ts` does this for cards, ultimate weapons, relics,
 * guardian chips, themes and vault nodes -- but not modules, and that gap is
 * how an override came to put Space Displacer at two different infoIndices
 * while Orbital Augment resolved to Negative Mass Projector.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findModuleInfoIdentity } from '../../src/data/modules/info-catalog'

interface ModuleFormat {
  effectIDSystem: {
    moduleinfoIndex: Record<string, unknown> & {
      trackedInfoIndices?: Record<string, number[]>
    }
  }
}

const format = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'fixtures', 'data', 'save-format', 'module_save_format.json'),
  'utf8',
)) as ModuleFormat

const infoIndexTable = format.effectIDSystem.moduleinfoIndex
const tracked = infoIndexTable.trackedInfoIndices ?? {}

describe('module info identities', () => {
  it('names every tracked index exactly as the save format does', () => {
    const categories = Object.entries(tracked).filter(([, list]) => Array.isArray(list))
    expect(categories.length, 'the format lists no tracked indices').toBe(4)

    for (const [category, indices] of categories) {
      for (const infoIndex of indices) {
        const game = infoIndexTable[String(infoIndex)] as { name?: string, category?: string } | undefined
        expect(game?.name, `format has no entry for infoIndex ${infoIndex}`).toBeTruthy()
        const identity = findModuleInfoIdentity(infoIndex)
        expect(identity, `infoIndex ${infoIndex} resolves to nothing`).not.toBeNull()
        expect(identity!.name, `infoIndex ${infoIndex}`).toBe(game!.name)
        expect(identity!.category, `infoIndex ${infoIndex}`).toBe(category)
      }
    }
  })

  it('never lets two tracked indices claim one module', () => {
    /*
     * The shape of the bug this file was written for: a duplicate name is
     * always wrong, whichever source you believe, because two save slots
     * cannot be the same module.
     */
    const seen = new Map<string, number>()
    for (const indices of Object.values(tracked)) {
      if (!Array.isArray(indices)) continue
      for (const infoIndex of indices) {
        const identity = findModuleInfoIdentity(infoIndex)
        if (!identity) continue
        const previous = seen.get(identity.name)
        expect(previous, `${identity.name} claims both ${previous} and ${infoIndex}`).toBeUndefined()
        seen.set(identity.name, infoIndex)
      }
    }
    expect(seen.size).toBe(24)
  })
})
