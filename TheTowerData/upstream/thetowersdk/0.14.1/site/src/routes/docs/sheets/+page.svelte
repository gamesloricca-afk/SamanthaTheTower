<script lang="ts">
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import { href } from '$lib/paths';
</script>

<h1 class="text-3xl font-semibold">Spreadsheets</h1>
<p class="mt-3 text-muted">
	Read a Google Sheet, write catalogs into one, and work with A1 ranges without writing the parsing
	yourself. <code>TowerSheets</code> handles the reading and writing; you supply the transport, so the
	same code runs against the Google API, a service account, a cache, or a fixture in a test.
</p>

<h2 class="mt-10 text-xl font-semibold">A1 Ranges</h2>
<p class="mt-3 text-muted">
	The range helpers are standalone and need no client at all — useful whenever you are building
	ranges by hand.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import {
  buildA1Range,
  parseA1RangeToCoordinates,
  columnIndexToLabel,
  columnLabelToIndex,
  sheetNameFromRange,
  a1RangeCellCount,
  splitA1Range
} from 'thetowersdk/sheets'

// Coordinates are zero-based; the A1 string is not.
buildA1Range({ startRow: 0, startCol: 0, endRow: 9, endCol: 2 }, 'My Sheet')
// "'My Sheet'!A1:C10"   — the tab name is quoted for you

parseA1RangeToCoordinates('A1:C10')
// { startRow: 0, startCol: 0, endRow: 9, endCol: 2 }

columnIndexToLabel(27)       // 'AB'
columnLabelToIndex('AB')     // 27
sheetNameFromRange("'My Sheet'!A1:C10")   // 'My Sheet'
a1RangeCellCount('A1:C10')   // 30`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Splitting A Large Range</h2>
<p class="mt-3 text-muted">
	The Sheets API rejects a request whose range is too large. <code>splitA1Range</code> cuts one range
	into row-wise chunks of at most the cell count you give it, and every chunk is still a rectangle, so
	the pieces reassemble by concatenation.
</p>
<div class="mt-4">
	<CodeBlock
		code={`splitA1Range("'My Sheet'!A1:C10", 20)
// [ "'My Sheet'!A1:C6", "'My Sheet'!A7:C10" ]

// Read a whole tab in pieces and join them back together.
const rows = []
for (const chunk of splitA1Range(fullRange, 50_000)) {
  rows.push(...(await sheets.readValues(chunk)))
}`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Connect A Sheet</h2>
<p class="mt-3 text-muted">
	A transport is any object with a <code>readValues</code> method, plus <code>writeValues</code> if you
	want to write. That is the whole interface — the client never imports a Google library, so nothing about
	your auth is assumed.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { TowerSheets } from 'thetowersdk/sheets'

const sheets = new TowerSheets({
  spreadsheetId: '1YwZtKP6B4WYhRba5T6APJ1YxKNdfnIGQnprgnxmO7zc',
  transport: {
    async readValues({ spreadsheetId, range, valueRenderOption }) {
      const url =
        \`https://sheets.googleapis.com/v4/spreadsheets/\${spreadsheetId}\` +
        \`/values/\${encodeURIComponent(range)}?valueRenderOption=\${valueRenderOption}\`

      const response = await fetch(url, {
        headers: { authorization: \`Bearer \${accessToken}\` }
      })
      const payload = await response.json()
      return payload.values ?? []
    }
  },
  // Sheets listed here refuse writes. Include any community workbook you read.
  protectSpreadsheets: ['1YwZtKP6B4WYhRba5T6APJ1YxKNdfnIGQnprgnxmO7zc']
})

console.log(sheets.isReadOnly)   // true, because that id is protected`}
	/>
</div>

<h2 id="connecting-with-a-google-service-account" class="mt-10 text-xl font-semibold">
	Connecting With A Google Service Account
</h2>
<p class="mt-3 text-muted">
	The transport above needs a token. For a tool that runs unattended — a bot, a sync job, a build
	step — the identity to use is a <strong>service account</strong>: a robot with its own email
	address, which reaches exactly the sheets you share with it and nothing else. No OAuth screen and
	no user to keep signed in.
</p>
<ol class="mt-4 list-decimal space-y-2 pl-5 text-muted">
	<li>In the Google Cloud console, create or pick a project.</li>
	<li>Enable the <strong>Google Sheets API</strong> for it.</li>
	<li>
		<strong>IAM &amp; Admin → Service Accounts → Create.</strong> Access is granted per sheet by sharing,
		so it needs no project roles at all.
	</li>
	<li>
		<strong>Keys → Add key → Create new key → JSON.</strong> It downloads once. Treat it as a password
		and keep it out of version control.
	</li>
	<li>
		Copy the account's email — it looks like
		<code>something@project-id.iam.gserviceaccount.com</code>.
	</li>
	<li>
		<strong>Share the spreadsheet with that email.</strong> Viewer is enough to read. Editor is only needed
		if you write.
	</li>
</ol>
<p class="mt-4 text-muted">
	Then mint a token the way you would for any Google API and hand it to the transport. The SDK never
	imports a Google library, so this stays entirely your choice — <code>google-auth-library</code>
	is the usual one.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { GoogleAuth } from 'google-auth-library'
import { TowerSheets } from 'thetowersdk/sheets'

const auth = new GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
})
const client = await auth.getClient()

const sheets = new TowerSheets({
  spreadsheetId: process.env.SHEET_ID,
  transport: {
    async readValues({ spreadsheetId, range, valueRenderOption }) {
      const url =
        \`https://sheets.googleapis.com/v4/spreadsheets/\${spreadsheetId}\` +
        \`/values/\${encodeURIComponent(range)}?valueRenderOption=\${valueRenderOption}\`

      const { data } = await client.request({ url })
      return data.values ?? []
    }
  }
})`}
	/>
</div>
<p class="mt-3 text-muted">
	<strong>An unshared sheet reads as an empty range, not an error.</strong> That is the single most common
	way this looks broken: the call succeeds, the rows come back empty, and nothing says why. If a read
	returns nothing, check the sharing before you check anything else.
</p>

<h2 class="mt-10 text-xl font-semibold">Read Values</h2>
<p class="mt-3 text-muted">
	<code>readValues</code> gives you what the API returned. <code>readGrid</code> gives you a
	rectangle of exactly the size you asked for, so <code>rows[3][7]</code> is the cell you meant even when
	the sheet's last columns are blank.
</p>
<div class="mt-4">
	<CodeBlock
		code={`// Ragged: trailing empty cells are simply absent.
const raw = await sheets.readValues("'Labs'!A1:H50")

// Rectangular: always 50 rows of 8, padded where the sheet is empty.
const grid = await sheets.readGrid("'Labs'!A1:H50")

console.log(grid.length, grid[0].length)   // 50 8`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Read Formulas</h2>
<p class="mt-3 text-muted">
	<code>readFormulas</code> returns what was typed into each cell alongside a count of how many cells
	hold a value and how many hold a formula of their own — which is how you tell a column of typed formulas
	from a single formula spilling across a range.
</p>
<div class="mt-4">
	<CodeBlock
		code={`const result = await sheets.readFormulas("'Costs'!B2:B200")

console.log(result.formulas[0])        // '=A2*1.15' — what was typed
console.log(result.cellsWithValues)    // 199
console.log(result.cellsWithFormulas)  // 1
console.log(result.likelySpilled)      // true — one formula filling the range
console.log(result.notes)`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Write A Catalog Into A Sheet</h2>
<p class="mt-3 text-muted">
	<code>writeValues</code> takes rows. Pass <code>'USER_ENTERED'</code> when the strings are
	formulas you want the sheet to evaluate, and <code>'RAW'</code> when they are literal values.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { LAB_CATALOG } from 'thetowersdk/data'

const lab = LAB_CATALOG.find((entry) => entry.name === 'Attack Speed')

const rows = [
  ['Level', 'Coins', 'Research time'],
  ...lab.levels.map((level) => [level.level, level.cost, level.duration])
]

await sheets.writeValues("'Attack Speed'!A1", rows, 'RAW')`}
	/>
</div>
<p class="mt-3 text-muted">
	Writing formulas instead of values keeps the sheet live for whoever opens it — they can change an
	input and watch the totals move.
</p>
<div class="mt-4">
	<CodeBlock
		code={`const withFormulas = lab.levels.map((level, index) => {
  const row = index + 2
  return [level.level, level.cost, \`=B\${row}*(1-$F$1)\`]
})

await sheets.writeValues("'Attack Speed'!A2", withFormulas, 'USER_ENTERED')`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Test Without A Network</h2>
<p class="mt-3 text-muted">
	Because the transport is yours, a fixture is a transport too — so the code that reads your live
	sheet is the code your tests exercise.
</p>
<div class="mt-4">
	<CodeBlock
		code={`const fixture = new TowerSheets({
  spreadsheetId: 'test',
  transport: {
    async readValues() {
      return [
        ['Level', 'Coins'],
        [1, 30],
        [2, 60]
      ]
    }
  }
})

const grid = await fixture.readGrid('A1:B3')`}
	/>
</div>

<p class="mt-8 text-sm">
	<a href={href('/docs/data/')}>Catalogs →</a>
	·
	<a href={href('/docs/charts/')}>Charts →</a>
	·
	<a href={href('/docs/mcp/')}>The Sheet Oracle →</a>
</p>
