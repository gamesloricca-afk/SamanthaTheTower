import { describe, expect, it } from 'vitest'
// @ts-expect-error — the MCP server is plain ESM JavaScript with no declarations.
import { TOWER_ORACLE_TOOLS } from '../../mcp/server.mjs'

/**
 * A tool that promises a valid range must not go quiet when it has not got one.
 *
 * `oracle_brief`'s description says it returns "its units and VALID RANGE" — capitalised, because
 * the tool exists to be the difference between "a calculator that renders and one that is
 * correct". Across the graph, 141 of 177 quantities have units and no recorded range, and the
 * field was simply absent for all of them.
 *
 * An absent field reads as "no constraint". That is the worst possible default for the one thing
 * this tool is for: unbounded inputs are the fastest way to make a correct formula give a wrong
 * answer, and the caller had nothing to tell them the bound was unknown rather than infinite.
 *
 * Nothing here fills the gap in. A bound nobody has recorded has to come from the wiki or the game,
 * and inventing one is the specific failure this package's contract forbids above all others. What
 * a tool CAN do is say the gap is there, and what `oracle_coverage` can do is count it per
 * compartment so it is a number that moves.
 *
 * The counts are cross-referenced against the graph rather than written down here, so this test
 * cannot drift as ranges get filled in — it can only catch the tools disagreeing with their data.
 */

type Node = { id: string, units?: string, validRange?: string }
type Brief = {
  entity: { units?: string, validRange?: string | null, validRangeNote?: string }
}

const graph = () => TOWER_ORACLE_TOOLS.oracle_map.run({ detail: true }) as { nodes: Node[] }
const brief = (mechanic: string) => TOWER_ORACLE_TOOLS.oracle_brief.run({ mechanic }) as Brief
const coverage = () =>
  TOWER_ORACLE_TOOLS.oracle_coverage.run({ asOf: '2026-08-20' }) as {
    compartments: { id: string, quantities: number, quantitiesMissingRange: number }[]
    totals: { quantities: number, quantitiesMissingRange: number }
  }

describe('oracle_brief is honest about ranges it does not have', () => {
  it('has quantities to check', () => {
    expect(graph().nodes.filter(node => node.units).length).toBeGreaterThan(50)
  })

  it('never leaves a quantity with no range and no explanation', () => {
    const silent: string[] = []

    for (const node of graph().nodes.filter(entry => entry.units)) {
      const { entity } = brief(node.id)
      const explained = Boolean(entity.validRange) || Boolean(entity.validRangeNote)
      if (!explained) silent.push(node.id)
    }

    expect(silent, 'a missing range must say so; absence reads as unbounded').toEqual([])
  })

  it('says NOT DOCUMENTED rather than implying no limit', () => {
    /*
     * The wording carries the whole weight. "unbounded" and "unknown" are opposite instructions to
     * whoever picks the input limits, and the old behaviour communicated the first by saying
     * nothing at all.
     */
    const undocumented = graph().nodes
      .find(node => node.units && !node.validRange)!

    const { entity } = brief(undocumented.id)
    expect(entity.validRange).toBeNull()
    expect(entity.validRangeNote).toMatch(/NOT DOCUMENTED/)
    expect(entity.validRangeNote).toMatch(/do not treat it as unbounded/i)
  })

  it('still returns a real range where one is recorded', () => {
    /*
     * The other half. A note on every entity would pass the case above and destroy the tool.
     */
    const documented = graph().nodes.find(node => node.units && node.validRange)!

    const { entity } = brief(documented.id)
    expect(entity.validRange).toBe(documented.validRange)
    expect(entity.validRangeNote).toBeUndefined()
  })

  it('counts the gap in oracle_coverage, per compartment and in total', () => {
    const report = coverage()
    const nodes = graph().nodes

    const quantities = nodes.filter(node => node.units).length
    const missing = nodes.filter(node => node.units && !node.validRange).length

    expect(report.totals.quantities).toBe(quantities)
    expect(report.totals.quantitiesMissingRange).toBe(missing)

    /* And the per-compartment rows must add up to the total, or one of them is not being counted. */
    const summed = report.compartments.reduce((total, row) => total + row.quantitiesMissingRange, 0)
    expect(summed).toBe(report.totals.quantitiesMissingRange)
  })

  it('never reports more missing than there are quantities', () => {
    for (const row of coverage().compartments) {
      expect(row.quantitiesMissingRange, row.id).toBeLessThanOrEqual(row.quantities)
    }
  })
})
