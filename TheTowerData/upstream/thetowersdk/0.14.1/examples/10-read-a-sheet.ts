/**
 * Reading a Google Sheet, and the two ways a read lies to you.
 *
 *   npx tsx examples/10-read-a-sheet.ts
 *
 * This runs with no credentials: the transport below is a fixture, so the traps are
 * reproduced exactly rather than described. Swap it for `templates/sheets-client.ts` and
 * the same code reads a real spreadsheet — `docs/GOOGLE_SHEETS.md` covers the service
 * account and sharing.
 */
import { type SheetsTransport, TowerSheets } from 'thetowersdk/sheets'

/** A published workbook someone else owns. Read it; never write to it. */
const COMMUNITY_SHEET = '1CommunityWorkbookIdGoesHere'

/*
 * A fixture standing in for the API, shaped like real responses:
 *   - trailing empty cells and rows are dropped, so rows come back ragged;
 *   - only the ANCHOR of an ARRAYFORMULA carries a formula.
 */
const fixture: SheetsTransport = {
  async readValues({ range, valueRenderOption }) {
    if (range === 'Costs!A1:C4') {
      // Three columns asked for; the API returns what it has and truncates the rest.
      return [['Level', 'Coins'], [1, 5000], [2]]
    }
    if (range === 'Derived!A1:A6') {
      return valueRenderOption === 'FORMULA'
        ? [['=SEQUENCE(6)'], [''], [''], [''], [''], ['']]
        : [[1], [2], [3], [4], [5], [6]]
    }
    return []
  },
}

// >>> snippet: sheets-client
const sheets = new TowerSheets({
  transport: fixture,
  spreadsheetId: 'my-own-copy',
  protectSpreadsheets: [COMMUNITY_SHEET],
})
// <<< snippet

async function main(): Promise<void> {
  /*
   * 1. Blank is not missing.
   *
   * `readValues` hands back exactly what the API said — ragged. Code that indexes into it
   * reads `undefined` for a cell that is merely empty, and "column absent" and "cell blank"
   * become the same thing. `readGrid` pads to the rectangle you asked for.
   */
  const raw = await sheets.readValues('Costs!A1:C4')
  const grid = await sheets.readGrid('Costs!A1:C4')

  console.log('raw rows :', JSON.stringify(raw))
  console.log('padded   :', JSON.stringify(grid))
  console.log(`asked for 4x3; raw gave ${raw.length} rows, padded gives ${grid.length}\n`)

  /*
   * 2. A spilled cell has no formula.
   *
   * Reading formulas to learn how a range is computed is the obvious move, and it is
   * exactly where this misleads: one ARRAYFORMULA fills six cells, so five report nothing.
   * Read the formulas alone and the range looks like plain typed data.
   */
  const formulas = await sheets.readFormulas('Derived!A1:A6')
  console.log(`values: ${formulas.cellsWithValues}, formulas: ${formulas.cellsWithFormulas}`)
  console.log(`likelySpilled: ${formulas.likelySpilled}`)
  for (const note of formulas.notes) console.log(`  note: ${note}`)

  /*
   * 3. Writes to someone else's workbook are refused.
   *
   * A throw rather than a quiet no-op: a silent refusal has the bot report success while
   * the sheet never changed, which is the worse failure.
   */
  const community = new TowerSheets({
    transport: fixture,
    spreadsheetId: COMMUNITY_SHEET,
    protectSpreadsheets: [COMMUNITY_SHEET],
  })

  console.log(`\ncommunity sheet isReadOnly: ${community.isReadOnly}`)
  try {
    await community.writeValues('Costs!A1:A1', [['nope']])
  }
  catch (error) {
    console.log(`  refused: ${(error as Error).message}`)
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
