import { describe, expect, it } from 'vitest'
import {
  a1RangeCellCount,
  buildA1Range,
  columnIndexToLabel,
  columnLabelToIndex,
  parseA1RangeToCoordinates,
  quoteSheetName,
  sheetNameFromRange,
  splitA1Range,
  type SheetsTransport,
  TowerSheets,
} from '../../src/sheets'

describe('A1 notation', () => {
  it('preserves blank rows between API chunks', async () => {
    const sheets = new TowerSheets({
      spreadsheetId: 'test', maxCellsPerRead: 2,
      transport: fakeTransport({ 'A1:A2': [[1]], 'A3:A4': [[3], [4]] }),
    })
    expect(await sheets.readValues('A1:A4')).toEqual([[1], [], [3], [4]])
    expect(await sheets.readGrid('A1:A4')).toEqual([[1], [null], [3], [4]])
  })

  it('refuses invalid read budgets before issuing transport requests', () => {
    for (const maxCellsPerRead of [0, -1, NaN, Infinity, 1.5]) {
      expect(() => new TowerSheets({ spreadsheetId: 'test', transport: fakeTransport({}), maxCellsPerRead })).toThrow('maxCellsPerRead must be a positive safe integer')
    }
  })
  it('round-trips every column label up past ZZ', () => {
    // Bijective base-26 has no zero digit, so the carry is where this breaks.
    const wrong: string[] = []
    for (let index = 0; index < 800; index += 1) {
      const label = columnIndexToLabel(index)
      if (columnLabelToIndex(label) !== index) wrong.push(`${index} -> ${label}`)
    }
    expect(wrong.slice(0, 5), wrong.join(', ')).toEqual([])
  })

  it('knows the boundaries a naive base-26 conversion gets wrong', () => {
    expect(columnIndexToLabel(0)).toBe('A')
    expect(columnIndexToLabel(25)).toBe('Z')
    expect(columnIndexToLabel(26)).toBe('AA')
    expect(columnIndexToLabel(51)).toBe('AZ')
    expect(columnIndexToLabel(701)).toBe('ZZ')
    expect(columnIndexToLabel(702)).toBe('AAA')
  })

  it('rejects things that are not column labels rather than scoring them', () => {
    for (const bad of ['', '1', 'A1', 'a-b', ' ']) expect(columnLabelToIndex(bad), bad).toBe(-1)
  })

  it('doubles the apostrophe in a tab name, which is the one that fails silently', () => {
    /*
     * A wrongly quoted tab name does not error — the API finds no such tab and returns an
     * empty result, which reads exactly like an empty range.
     */
    expect(quoteSheetName("Player's Data")).toBe("'Player''s Data'")
    expect(quoteSheetName('eEcon')).toBe('eEcon')
    expect(quoteSheetName('Has Space')).toBe("'Has Space'")
    expect(quoteSheetName('2024')).toBe("'2024'")
  })

  it('parses a range with or without a tab, and recovers the tab name', () => {
    expect(parseA1RangeToCoordinates('A1:C10')).toEqual({ startRow: 0, startCol: 0, endRow: 9, endCol: 2 })
    expect(parseA1RangeToCoordinates('eEcon!G6:O50')?.startCol).toBe(6)
    expect(sheetNameFromRange("'Player''s Data'!A1:B2")).toBe("Player's Data")
    expect(sheetNameFromRange('A1:B2')).toBeNull()
  })

  it('normalises a reversed range instead of returning an empty one', () => {
    expect(parseA1RangeToCoordinates('C10:A1')).toEqual(parseA1RangeToCoordinates('A1:C10'))
  })

  it('tolerates whitespace around the colon and ends (the platform parser contract it replaced)', () => {
    const expected = { startRow: 0, startCol: 0, endRow: 9, endCol: 2 }
    expect(parseA1RangeToCoordinates('A1 : C10')).toEqual(expected)
    expect(parseA1RangeToCoordinates(' A1:C10 ')).toEqual(expected)
    expect(parseA1RangeToCoordinates('A1: C10')).toEqual(expected)
    expect(parseA1RangeToCoordinates('Sheet1!A1 : C10')).toEqual(expected)
    // Lowercase columns still resolve; more than one range separator still refuses.
    expect(parseA1RangeToCoordinates('a1:c10')).toEqual(expected)
    expect(parseA1RangeToCoordinates('A1:B2:C3')).toBeNull()
  })

  it('refuses an open-ended range rather than inventing a last row', () => {
    // Only the sheet knows where `A:C` stops, and guessing produces a confident wrong count.
    for (const open of ['A:C', 'A1:C', 'Tab!A:C', 'nonsense']) {
      expect(parseA1RangeToCoordinates(open), open).toBeNull()
    }
  })

  it('refuses coordinates that cannot be represented exactly', () => {
    expect(parseA1RangeToCoordinates('A1:A999999999999999999999')).toBeNull()
    expect(parseA1RangeToCoordinates('A1:ZZZZZZZZZZZZZZZZZZ1')).toBeNull()
    expect(columnIndexToLabel(Infinity)).toBe('')
  })

  it('round-trips through buildA1Range', () => {
    const range = "'Player''s Data'!B2:D11"
    const at = parseA1RangeToCoordinates(range)!
    expect(buildA1Range(at, sheetNameFromRange(range)!)).toBe(range)
  })

  it('counts cells, and splits a big range into rectangles that reassemble', () => {
    expect(a1RangeCellCount('A1:C10')).toBe(30)

    const chunks = splitA1Range('Tab!A1:C300', 30)
    expect(chunks.length).toBeGreaterThan(1)
    // Every chunk keeps the full width, so concatenating rows rebuilds the original block.
    const total = chunks.reduce((sum, chunk) => sum + a1RangeCellCount(chunk), 0)
    expect(total).toBe(a1RangeCellCount('Tab!A1:C300'))
    expect(chunks.every(chunk => sheetNameFromRange(chunk) === 'Tab')).toBe(true)
  })
})

/** A transport backed by a literal grid, so the traps can be reproduced exactly. */
function fakeTransport(grid: Record<string, unknown[][]>): SheetsTransport & { writes: unknown[] } {
  const writes: unknown[] = []
  return {
    writes,
    async readValues({ range, valueRenderOption }) {
      const key = `${range}|${valueRenderOption}`
      return grid[key] ?? grid[range] ?? []
    },
    async writeValues(request) {
      writes.push(request)
    },
  }
}

describe('TowerSheets', () => {
  it('pads a truncated read to the rectangle that was asked for', async () => {
    /*
     * The API drops trailing empty cells and rows, so a 3x3 request can return one short
     * row. Code that indexes into that gets `undefined` and reads it as "column absent"
     * when the truth is "cell empty" — the same confusion that hides a missing column.
     */
    const sheets = new TowerSheets({
      transport: fakeTransport({ 'Tab!A1:C3': [['a', 'b']] }),
      spreadsheetId: 'mine',
    })

    const grid = await sheets.readGrid('Tab!A1:C3')
    expect(grid.length).toBe(3)
    expect(grid.every(row => row.length === 3)).toBe(true)
    expect(grid[0]).toEqual(['a', 'b', null])
    expect(grid[2]).toEqual([null, null, null])
  })

  it('reports a spilled range instead of calling it plain data', async () => {
    // One anchor formula, nine spilled values — what ARRAYFORMULA actually looks like.
    const values = Array.from({ length: 10 }, (_, i) => [i + 1])
    const formulas = [['=SEQUENCE(10)'], [''], [''], [''], [''], [''], [''], [''], [''], ['']]
    const sheets = new TowerSheets({
      transport: fakeTransport({
        'Tab!A1:A10|FORMULA': formulas,
        'Tab!A1:A10|UNFORMATTED_VALUE': values,
      }),
      spreadsheetId: 'mine',
    })

    const result = await sheets.readFormulas('Tab!A1:A10')
    expect(result.cellsWithValues).toBe(10)
    expect(result.cellsWithFormulas).toBe(1)
    expect(result.likelySpilled).toBe(true)
    expect(result.notes.join(' ')).toMatch(/spilled range/)
  })

  it('does not cry spill over a range that really is all formulas', async () => {
    // The guard has to discriminate, or it is just noise on every formula read.
    const rows = [['=A1+1'], ['=A2+1'], ['=A3+1'], ['=A4+1']]
    const sheets = new TowerSheets({
      transport: fakeTransport({
        'Tab!A1:A4|FORMULA': rows,
        'Tab!A1:A4|UNFORMATTED_VALUE': [[1], [2], [3], [4]],
      }),
      spreadsheetId: 'mine',
    })

    const result = await sheets.readFormulas('Tab!A1:A4')
    expect(result.likelySpilled).toBe(false)
    expect(result.notes).toEqual([])
  })

  it('says an empty range is empty, because a wrong tab name reads the same', async () => {
    const sheets = new TowerSheets({ transport: fakeTransport({}), spreadsheetId: 'mine' })
    const result = await sheets.readFormulas('Typo!A1:B2')
    expect(result.notes.join(' ')).toMatch(/Every cell in this range is empty/)
  })

  it('refuses to write to a protected spreadsheet, loudly', async () => {
    const transport = fakeTransport({})
    const sheets = new TowerSheets({
      transport,
      spreadsheetId: 'community-sheet',
      protectSpreadsheets: ['community-sheet'],
    })

    expect(sheets.isReadOnly).toBe(true)
    await expect(sheets.writeValues('Tab!A1:A1', [[1]])).rejects.toThrow(/Refusing to write/)
    // A silent no-op would have the bot report success while nothing changed.
    expect(transport.writes).toEqual([])
  })

  it('writes to a sheet that is not protected', async () => {
    const transport = fakeTransport({})
    const sheets = new TowerSheets({
      transport,
      spreadsheetId: 'my-copy',
      protectSpreadsheets: ['community-sheet'],
    })

    expect(sheets.isReadOnly).toBe(false)
    await sheets.writeValues('Tab!A1:B1', [[1, 2]], 'USER_ENTERED')
    expect(transport.writes).toHaveLength(1)
    expect(transport.writes[0]).toMatchObject({
      spreadsheetId: 'my-copy',
      range: 'Tab!A1:B1',
      valueInputOption: 'USER_ENTERED',
    })
  })

  it('fails rather than pretending, when the transport cannot write', async () => {
    const readOnly: SheetsTransport = { async readValues() { return [] } }
    const sheets = new TowerSheets({ transport: readOnly, spreadsheetId: 'mine' })
    await expect(sheets.writeValues('Tab!A1:A1', [[1]])).rejects.toThrow(/read-only/)
  })

  it('splits an oversized read and stitches the rows back together', async () => {
    const calls: string[] = []
    const transport: SheetsTransport = {
      async readValues({ range }) {
        calls.push(range)
        const at = parseA1RangeToCoordinates(range)!
        return Array.from({ length: at.endRow - at.startRow + 1 }, (_, i) => [at.startRow + i])
      },
    }
    const sheets = new TowerSheets({ transport, spreadsheetId: 'mine', maxCellsPerRead: 10 })

    const rows = await sheets.readValues('Tab!A1:A100')
    expect(calls.length).toBeGreaterThan(1)
    expect(rows.length).toBe(100)
    // Order preserved: chunk N must land before chunk N+1.
    expect(rows.map(row => row[0])).toEqual(Array.from({ length: 100 }, (_, i) => i))
  })
})
