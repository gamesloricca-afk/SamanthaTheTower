import { describe, expect, it } from 'vitest'
import { loadEpGraph } from '../../../src/mechanics/ep-graph'

/**
 * Two edges were committed and retracted on 2026-08-19 because a sheet search
 * moved the cursor and the landing cell was recorded as the consumer. Both were
 * eyeballed; neither formula was ever read.
 *
 * So: an edge may quote the consuming formula, and if it does, the cell it
 * claims to consume has to actually be IN that formula. That is the whole
 * check. It is not clever, but it is the one thing neither retraction could
 * have passed.
 */

/** `$AZ$15` and `AZ15` are the same cell; sheet quoting varies. */
function normaliseFormula(text: string): string {
  return text.replace(/\$/g, '').toUpperCase()
}

/** Boundary-anchored so `AI21` does not match inside `AI210`. */
function mentionsCell(formula: string, cell: string): boolean {
  const c = cell.replace(/\$/g, '').toUpperCase()
  return new RegExp(`(?<![A-Z0-9])${c}(?![0-9])`).test(normaliseFormula(formula))
}

function columnIndex(letters: string): number {
  return [...letters].reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0)
}

/**
 * A spill anchor names a RANGE, not the cell it happens to cover.
 *
 * `'eEcon Discount'!AL3` is `={eEcon!AM3:AZ50}`, and that is the whole evidence
 * that eEcon `AZ14` reaches that tab. Requiring the literal token would reject
 * a true statement, so range membership counts too — but as an arithmetic
 * check, not as an exemption: the cell has to actually fall inside.
 */
function rangeCovers(formula: string, cell: string): boolean {
  const m = /^([A-Z]{1,3})(\d{1,4})$/.exec(cell.replace(/\$/g, '').toUpperCase())
  if (!m) return false
  const [, col, row] = m
  const target = { col: columnIndex(col), row: Number(row) }

  const ranges = normaliseFormula(formula)
    .matchAll(/(?<![A-Z0-9])([A-Z]{1,3})(\d{1,4}):([A-Z]{1,3})(\d{1,4})(?![0-9])/g)
  for (const [, c1, r1, c2, r2] of ranges) {
    const lo = { col: Math.min(columnIndex(c1), columnIndex(c2)), row: Math.min(Number(r1), Number(r2)) }
    const hi = { col: Math.max(columnIndex(c1), columnIndex(c2)), row: Math.max(Number(r1), Number(r2)) }
    if (target.col >= lo.col && target.col <= hi.col && target.row >= lo.row && target.row <= hi.row) {
      return true
    }
  }
  return false
}

function evidences(formula: string, cell: string): boolean {
  return mentionsCell(formula, cell) || rangeCovers(formula, cell)
}

describe('ep-graph edge formula excerpts', () => {
  const graph = loadEpGraph()
  const withExcerpt = graph.edges.filter((e) => e.evidence?.formulaExcerpt)

  it('every quoted formula contains the cell of the node it reads', () => {
    const broken: string[] = []
    for (const edge of withExcerpt) {
      const excerpt = edge.evidence!.formulaExcerpt!
      // feeds is reverse of reads→control: excerpt must mention the control (from).
      const targetId = edge.kind === 'feeds' ? edge.from : edge.to
      const target = graph.nodes[targetId]

      // A LAMBDA node has no cell — its identity is its name, and the formula
      // has to call it. Same discipline, different identifier: an edge saying
      // "this control is parsed by EPG_MODULE_LEVEL_LIMIT" is only evidence if
      // the quoted formula actually calls it.
      if (target?.lambdaName) {
        if (!normaliseFormula(excerpt).includes(target.lambdaName.toUpperCase())) {
          broken.push(`${edge.id}: ${target.lambdaName} is not called in ${excerpt}`)
        }
        continue
      }

      const cells = target?.sourceCells ?? []
      expect(cells.length, `${targetId} has no sourceCells to check against`).toBeGreaterThan(0)
      if (!cells.some((c) => evidences(excerpt, c.cell))) {
        broken.push(`${edge.id}: none of [${cells.map((c) => c.cell).join(', ')}] appear in ${excerpt}`)
      }
    }
    expect(broken).toEqual([])
  })

  it('the check can fail — a formula that omits the cell is rejected', () => {
    expect(mentionsCell('=IF(AX19="Tourney", 5, 6.25)', 'AX19')).toBe(true)
    expect(mentionsCell('=IF(AX19="Tourney", 5, 6.25)', 'AZ15')).toBe(false)
    // the boundary case the naive `includes` gets wrong
    expect(mentionsCell('=EPP_ITEM_NAME(EA4:ER150, MIN(145, AI210))', 'AI21')).toBe(false)
  })

  it('accepts a spill anchor only for cells its range actually covers', () => {
    const anchor = '={eEcon!AM3:AZ50}'
    expect(rangeCovers(anchor, 'AZ14')).toBe(true)
    expect(rangeCovers(anchor, '$AZ$14')).toBe(true)
    // one column past the right edge, and one row past the bottom
    expect(rangeCovers(anchor, 'BA14')).toBe(false)
    expect(rangeCovers(anchor, 'AZ51')).toBe(false)
    // and left of the origin, which is the offset this mirror actually has
    expect(rangeCovers(anchor, 'AL14')).toBe(false)
  })

  it('holds a floor of edges carrying a quoted formula', () => {
    // Ratchet: raise as more edges are settled from formula text. Never lower.
    expect(withExcerpt.length).toBeGreaterThanOrEqual(23)
  })
})
