import { describe, expect, it } from 'vitest'
import { buildSheetDriftMutateOps, partitionOpsByGraph } from '../../../tooling/sdk-graph/sheet-drift-mutate'
import { isMonorepoCheckout } from '../../../tooling/repo-root'

/*
 * Monorepo only. The registry and the graph tooling name files by their monorepo path
 * (`packages/sdk/src/...`) and read them from a repo root found by walking up to
 * `scripts/mechanics-trust/`. In the published repository this package is the root, so those
 * reads resolve above the checkout and the whole file fails to collect. Skipping keeps the
 * enforcement here, where the paths mean something.
 */
const MONOREPO = isMonorepoCheckout()

describe.skipIf(!MONOREPO)('sheet-drift-mutate', () => {
  it('builds disputed modifyNode ops from formula mismatches', () => {
    const ops = buildSheetDriftMutateOps(
      [
        { nodeId: 'hide.eEcon.EO2.coinBonus', cell: 'eEcon!EO2', expected: '=A', live: '=B' },
        { nodeId: 'hide.eEcon.EO2.coinBonus', cell: 'eEcon!EO2', expected: '=A', live: '=C' },
        { nodeId: 'lab.Damage', cell: 'x!A1', error: 'network' },
      ],
      { now: '2026-08-14' },
    )
    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({
      op: 'modifyNode',
      id: 'hide.eEcon.EO2.coinBonus',
      patch: { status: 'disputed' },
    })
    expect(ops[0].patch.traps[0].note).toContain('eEcon!EO2')
  })

  it('partitions ep vs core by node id set', () => {
    const ops = [
      { op: 'modifyNode' as const, id: 'hide.eEcon.EO2.coinBonus', patch: { status: 'disputed' as const } },
      { op: 'modifyNode' as const, id: 'lab.Damage', patch: { status: 'disputed' as const } },
    ]
    const { ep, core } = partitionOpsByGraph(ops, new Set(['hide.eEcon.EO2.coinBonus']))
    expect(ep.map(o => o.id)).toEqual(['hide.eEcon.EO2.coinBonus'])
    expect(core.map(o => o.id)).toEqual(['lab.Damage'])
  })
})
