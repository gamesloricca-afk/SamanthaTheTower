import { describe, expect, it } from 'vitest'
// @ts-expect-error — the MCP server is plain ESM JavaScript with no declarations.
import { TOOLS } from '../../mcp/server.mjs'

/**
 * No shipped table may carry a string that is really a missing value.
 *
 * `ELITE_SPAWN_CHANCE_ROWS` contains three cells whose value is the literal text `undefined` —
 * row 1 (the 1% band) at tiers 22, 23 and 24. It reaches a rendered chart as the word "undefined",
 * and `eliteSpawnChanceAtWave` parses it to `NaN` and `continue`s, which leaves `rowIndex` at 0 —
 * so those three tiers report ZERO elite chance below the 4% threshold. A higher tier reads as
 * safer than a lower one, which cannot be right.
 *
 * Those three are KNOWN and deliberately unfilled. The block ratio predicts roughly 22, 19 and 18,
 * and the compartment refuses to write them in: "the ratio is a description of a community chart,
 * not a reading of the game, and inventing three cells from it would launder an inference into
 * data." They are recorded in `ELITE_SPAWN_CHANCE_MISSING_CELLS` with exact coordinates so a real
 * source can fill them.
 *
 * That refusal is the point of this test rather than an exception to it. The allowance is the
 * LENGTH of that constant, not a number typed here — so filling a cell from the game shrinks the
 * allowance automatically, and a fourth placeholder appearing anywhere fails immediately.
 *
 * Found by asking whether `calc_chart`'s claim — "which formula produces a chart's numbers" —
 * survives contact with the numbers.
 */

const PLACEHOLDERS = ['"undefined"', '"NaN"', '"[object Object]"']

/** Where a placeholder is allowed, and the constant that says how many. */
const KNOWN_HOLES = 'ELITE_SPAWN_CHANCE_MISSING_CELLS'

const allowedHoles = () => {
  const record = TOOLS.get_export.run({ name: KNOWN_HOLES, limit: 100 })
  expect(record.error, `${KNOWN_HOLES} should be findable`).toBeUndefined()
  return record.length as number
}

describe('shipped data carries no accidental placeholders', () => {
  it('records the known holes as data, not as prose', () => {
    const holes = TOOLS.get_export.run({ name: KNOWN_HOLES, limit: 100 })

    expect(holes.length).toBeGreaterThan(0)
    /* Coordinates, so they can be filled — a note saying "some cells are missing" cannot be. */
    expect(holes.sample[0]).toHaveProperty('row')
    expect(holes.sample[0]).toHaveProperty('tier')
  })

  it('has no placeholder outside the recorded holes', () => {
    const offenders: string[] = []
    let total = 0

    for (const entry of TOOLS.list_exports.inputSchema.properties.entry.enum as string[]) {
      for (const { name } of TOOLS.list_exports.run({ entry }).exports) {
        const value = TOOLS.get_export.run({ name, limit: 100_000 })
        if (value.error) continue

        const text = JSON.stringify(value.sample ?? value.value ?? '')
        if (!text) continue

        for (const token of PLACEHOLDERS) {
          const count = text.split(token).length - 1
          if (!count) continue
          total += count
          offenders.push(`${entry}.${name}: ${token} x${count}`)
        }
      }
    }

    /*
     * `ELITE_SPAWN_CHANCE_ROWS` and its `charts` re-export are the same three cells counted twice,
     * which is why the budget is doubled rather than the export list de-duplicated: the re-export
     * is a real surface an agent can read, and it carries the same hole.
     */
    const budget = allowedHoles() * 2

    expect(total, `placeholders found:\n${offenders.join('\n')}`).toBeLessThanOrEqual(budget)
  }, 300_000)

  it('keeps the hole visible to every tool an agent would ask', () => {
    /*
     * The defect is recorded; what matters is whether it is reachable. A trap nobody is shown is a
     * trap nobody avoids, and each of these is a route someone would plausibly take.
     */
    const mentions = (value: unknown) => /undefined|missing/i.test(JSON.stringify(value ?? ''))

    expect(mentions(TOOLS.calc_describe.run({ id: 'enemy.eliteSpawnChance' })), 'calc_describe')
      .toBe(true)
  })
})
