import { describe, expect, it } from 'vitest'

import { buildCoverageEntries } from '../../../tooling/coverage/build-inventories'
import { CoverageInventorySchema } from '../../../tooling/coverage/schema'
import { loadSdkGraphWithTrust } from '../../../tooling/sdk-graph'
import sdkModulesRaw from '../../../tooling/coverage/data/sdk-modules.v1.json'
import saveSchemaRaw from '../../../tooling/coverage/data/save-schema.v1.json'

/**
 * The inventories must match the tree, and this is what says so.
 *
 * They were seeded once and left. Four days later the mechanics inventory had
 * 159 rows against 192 real modules — every module written in between was
 * invisible to the one check whose job is finding things nothing covers, and no
 * test failed, because nothing compared the rows to the tree.
 *
 * Regenerate with `node scripts/link-coverage-inventories.mjs` after a build.
 */
const JOBS = [
  {
    name: 'sdk-modules',
    raw: sdkModulesRaw,
    spec: { dir: 'src/mechanics', surface: 'sdk-module' as const, idPrefix: 'sdk-module:' },
  },
  {
    name: 'save-schema',
    raw: saveSchemaRaw,
    spec: { dir: 'src/save', surface: 'save' as const, idPrefix: 'save:' },
  },
]

describe('coverage inventories are current', () => {
  for (const job of JOBS) {
    it(`${job.name} matches what the generator would write`, () => {
      const checked = CoverageInventorySchema.parse(job.raw)
      const fresh = buildCoverageEntries(job.spec)

      // Labels first: a mismatch here means a module was added or removed and
      // the inventory was not regenerated, which is the failure this exists for.
      expect(checked.entries.map(e => e.label)).toEqual(fresh.map(e => e.label))
      expect(checked.entries).toEqual(fresh)
    })
  }

  it('every modeled row points at a node that exists in the merged graph', () => {
    // Guards the join itself. A renamed oracle node would otherwise leave rows
    // claiming coverage from a node that is gone.
    const { graph } = loadSdkGraphWithTrust({ mode: 'strict' })
    let checkedIds = 0

    for (const job of JOBS) {
      const inventory = CoverageInventorySchema.parse(job.raw)
      for (const entry of inventory.entries) {
        if (entry.coverageStatus !== 'modeled') continue
        expect(entry.graphNodeIds.length, entry.id).toBeGreaterThan(0)
        for (const id of entry.graphNodeIds) {
          expect(graph.nodes[id], `${entry.id} -> ${id}`).toBeTruthy()
          checkedIds += 1
        }
      }
    }

    // Empty means blind here: if no modeled row existed, every assertion above
    // would vacuously pass and this test would report success for a join that
    // linked nothing.
    expect(checkedIds).toBeGreaterThan(0)
  })

  it('never links fewer modules than it does today', () => {
    // A RATCHET, and the only mechanism that turns "anchor new oracle nodes to
    // their implementation" from an intention into something that holds.
    //
    // Raise these numbers when the count goes up; never lower them to make a
    // change pass. A drop means either an oracle node lost its `implementedBy`
    // or a module was renamed out from under one — both worth stopping for.
    const MECHANICS_LINKED_FLOOR = 10
    const SAVE_LINKED_FLOOR = 3

    const mechanics = CoverageInventorySchema.parse(sdkModulesRaw)
    const save = CoverageInventorySchema.parse(saveSchemaRaw)
    const modeled = (inv: { entries: Array<{ coverageStatus: string }> }) =>
      inv.entries.filter(e => e.coverageStatus === 'modeled').length

    expect(modeled(mechanics)).toBeGreaterThanOrEqual(MECHANICS_LINKED_FLOOR)
    expect(modeled(save)).toBeGreaterThanOrEqual(SAVE_LINKED_FLOOR)
  })

  it('records how few modules the oracle links, rather than implying more', () => {
    // The honest number. The oracle is anchored to game constants and catalog
    // data — 194 of its 336 implementedBy symbols are defined in the knowledge
    // compartments themselves — so most implementation modules have no link and
    // that is not evidence the mechanic is undocumented. Asserting the ratio
    // stops a future reader quoting it as SDK completeness.
    const inventory = CoverageInventorySchema.parse(sdkModulesRaw)
    const modeled = inventory.entries.filter(e => e.coverageStatus === 'modeled')

    expect(modeled.length).toBeGreaterThan(0)
    expect(modeled.length / inventory.entries.length).toBeLessThan(0.2)
  })
})

describe('the inventory builder is not cwd-dependent', () => {
  /*
   * `spec.dir` is package-relative. It used to reach `fs.existsSync` unchanged,
   * so from `packages/sdk` it resolved and from the monorepo root it pointed at
   * the SITE's `src/`, found no `src/mechanics`, and returned an EMPTY list.
   * The suite above then compared a real 208-row inventory against nothing --
   * green under one cwd, red under the other, for a reason nothing named.
   */
  it('finds the modules wherever it is run from', () => {
    const entries = buildCoverageEntries({
      dir: 'src/mechanics', surface: 'sdk', idPrefix: 'mechanics:',
    })
    // A floor, not an equality: new modules are expected to arrive.
    expect(entries.length).toBeGreaterThan(150)
  })

  it('refuses a directory that is not there instead of returning nothing', () => {
    /*
     * Plant the fault the anchor exists for. An inventory built from a missing
     * directory is empty, and an empty inventory reads as "nothing to cover"
     * rather than "nothing found" -- the same silence that let the seeded
     * inventory drift 32 modules behind the tree.
     */
    expect(() => buildCoverageEntries({
      dir: 'src/definitely-not-here', surface: 'sdk', idPrefix: 'x:',
    })).toThrow(/does not exist/)
  })
})
