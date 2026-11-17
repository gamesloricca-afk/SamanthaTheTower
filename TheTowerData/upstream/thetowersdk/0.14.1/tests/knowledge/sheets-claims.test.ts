import { describe, expect, it } from 'vitest'
import {
  columnIndexToLabel,
  quoteSheetName,
  type SheetsTransport,
  splitA1Range,
  a1RangeCellCount,
  sheetNameFromRange,
  TowerSheets,
} from '../../src/sheets'
import { allNodes, GAME_KNOWLEDGE } from '../../src/knowledge'

/**
 * The sheets compartment says how the API behaves. This checks it against code that does.
 *
 * An oracle entry is only worth having if it cannot quietly go stale, and prose cannot be
 * compared to anything. The assertions carry the values, and these tests put the same
 * values through the implementation — so a claim that stops being true fails here rather
 * than misleading whoever reads it next.
 */
const SHEET_NODES = allNodes(GAME_KNOWLEDGE).filter(node => node.id.startsWith('sheets.'))

function assertedValue(nodeId: string, predicate: string): string | number | boolean {
  const node = SHEET_NODES.find(entry => entry.id === nodeId)
  expect(node, `no oracle node ${nodeId}`).toBeTruthy()
  const claim = node!.assertions?.find(entry => entry.predicate === predicate)
  expect(claim, `no assertion ${nodeId}.${predicate}`).toBeTruthy()
  return claim!.value
}

describe('the sheets compartment describes what the code actually does', () => {
  it('carries the compartment at all', () => {
    // Guards every test below from passing vacuously on an empty filter.
    expect(SHEET_NODES.length).toBeGreaterThanOrEqual(6)
    expect(SHEET_NODES.every(node => (node.traps?.length ?? 0) > 0)).toBe(true)
  })

  it('quotes an apostrophe exactly the way it claims', () => {
    expect(quoteSheetName("Player's Data")).toBe(assertedValue('sheets.rangeNaming', 'apostropheInTabNameDoubles'))
  })

  it('labels columns exactly the way it claims', () => {
    expect(columnIndexToLabel(25)).toBe(assertedValue('sheets.rangeNaming', 'columnLabelAtIndex25'))
    expect(columnIndexToLabel(26)).toBe(assertedValue('sheets.rangeNaming', 'columnLabelAtIndex26'))
    expect(columnIndexToLabel(701)).toBe(assertedValue('sheets.rangeNaming', 'columnLabelAtIndex701'))
  })

  it('throws on a protected write, as claimed, rather than skipping', async () => {
    expect(assertedValue('sheets.writing', 'protectedWriteThrowsRatherThanSkipping')).toBe(true)

    const writes: unknown[] = []
    const transport: SheetsTransport = {
      async readValues() { return [] },
      async writeValues(request) { writes.push(request) },
    }
    const sheets = new TowerSheets({
      transport,
      spreadsheetId: 'theirs',
      protectSpreadsheets: ['theirs'],
    })

    await expect(sheets.writeValues('A1:A1', [[1]])).rejects.toThrow()
    expect(writes, 'a refused write must not reach the transport').toEqual([])
  })

  it('keeps the full width when it splits, as claimed', () => {
    expect(assertedValue('sheets.readingEfficiently', 'chunksPreserveFullWidth')).toBe(true)

    const chunks = splitA1Range('Tab!A1:E200', 50)
    expect(chunks.length).toBeGreaterThan(1)
    // Same total area and same tab: the pieces reassemble by concatenation.
    const area = chunks.reduce((sum, chunk) => sum + a1RangeCellCount(chunk), 0)
    expect(area).toBe(a1RangeCellCount('Tab!A1:E200'))
    expect(chunks.every(chunk => /!A\d+:E\d+$/.test(chunk))).toBe(true)
    expect(chunks.every(chunk => sheetNameFromRange(chunk) === 'Tab')).toBe(true)
  })

  it('reports a formula read that is mostly spill, as claimed', async () => {
    expect(assertedValue('sheets.spilledCells', 'formulaReadReturnsEmptyForSpillTargets')).toBe(true)

    const transport: SheetsTransport = {
      async readValues({ valueRenderOption }) {
        return valueRenderOption === 'FORMULA'
          ? [['=SEQUENCE(5)'], [''], [''], [''], ['']]
          : [[1], [2], [3], [4], [5]]
      },
    }
    const sheets = new TowerSheets({ transport, spreadsheetId: 'mine' })
    const result = await sheets.readFormulas('Tab!A1:A5')

    expect(result.likelySpilled).toBe(true)
    expect(result.cellsWithFormulas).toBe(1)
    expect(result.cellsWithValues).toBe(5)
  })

  it('pads a truncated read, as claimed', async () => {
    expect(assertedValue('sheets.blankIsNotMissing', 'trailingEmptyCellsAreTruncated')).toBe(true)

    const transport: SheetsTransport = { async readValues() { return [['a']] } }
    const sheets = new TowerSheets({ transport, spreadsheetId: 'mine' })

    const grid = await sheets.readGrid('Tab!A1:C3')
    expect(grid.length).toBe(3)
    expect(grid.every(row => row.length === 3)).toBe(true)
  })

  it('names the scopes and the credentials variable the templates actually use', () => {
    /*
     * These are the strings someone copies out of the oracle into their own code. A wrong
     * one costs an afternoon of 403s, so they are pinned rather than described.
     */
    expect(assertedValue('sheets.access', 'readOnlyScope'))
      .toBe('https://www.googleapis.com/auth/spreadsheets.readonly')
    expect(assertedValue('sheets.access', 'readWriteScope'))
      .toBe('https://www.googleapis.com/auth/spreadsheets')
    expect(assertedValue('sheets.access', 'credentialsEnvVar')).toBe('GOOGLE_APPLICATION_CREDENTIALS')
  })
})
