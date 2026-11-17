# Reading and writing Google Sheets

Community Tower spreadsheets hold things no game file does — planner workbooks, tier lists,
guild rosters — and a tool that reads one goes further than a tool that does not. This is
how to get access, and what to know before you trust what comes back.

`thetowersdk/sheets` carries no `googleapis` dependency. It describes the two calls it needs
and you supply them, so the package stays browser-safe and you keep control of your auth
library. [`templates/sheets-client.ts`](../templates/sheets-client.ts) is the adapter.

---

## Getting access: a service account

A **service account** is a Google account for a program. It has its own email address, it
holds its own key, and you share a spreadsheet with it exactly as you would with a person.
Nothing about it is tied to your own Google login, which is the point: your bot keeps
working when you change your password, and it can only ever see the sheets you shared.

### 1. Make a project

Open the [Google Cloud console](https://console.cloud.google.com/) and create a project, or
pick one you already have. The name is for you; nothing depends on it.

### 2. Turn the Sheets API on

**APIs & Services → Library → Google Sheets API → Enable.**

Skipping this is the most common first failure, and the error does not say so plainly — it
comes back as a `403` mentioning that the API "has not been used in project *number*". If
you have just enabled it, wait a minute before retrying; propagation is not instant.

### 3. Create the account

**IAM & Admin → Service Accounts → Create service account.**

Give it a name you will recognise in a share dialog a year from now — `tower-bot-reader`
rather than `service-account-1`. **Skip the optional role step.** Roles grant access to
*cloud* resources; access to a *spreadsheet* comes from sharing that spreadsheet, and
granting project roles here does not help and can over-permission the account.

### 4. Download a key

Open the account → **Keys → Add key → Create new key → JSON**. The file downloads once.

That file is a password to every sheet the account can see. Treat it accordingly:

- put it outside your repository, or make sure your `.gitignore` covers it by name at any
  depth before you save it anywhere near your code;
- never paste it into a chat, an issue, or a config file you will commit;
- if it leaks, **delete the key in the console** — IAM → Service Accounts → Keys. Rotating
  the file on disk does nothing on its own; the old key stays valid until you delete it.

### 5. Share the sheet with it

Copy the account's email — it looks like
`tower-bot-reader@your-project.iam.gserviceaccount.com` — and share your spreadsheet with
it from the normal Share dialog.

- **Viewer** if the tool only reads. This is the right default.
- **Editor** only for a sheet the tool actually writes.

There is no notification and no accept step; access is live immediately.

### 6. Point your code at it

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
export SHEET_ID=1AbC...     # from https://docs.google.com/spreadsheets/d/THIS_PART/edit
```

[`templates/.env.example`](../templates/.env.example) lists every variable with the same
warnings attached.

```ts
import { createTowerSheets } from './sheets-client'

const sheets = createTowerSheets()
const grid = await sheets.readGrid('Costs!A1:C50')
```

---

## Scopes: ask for less

```ts
const READ_ONLY  = ['https://www.googleapis.com/auth/spreadsheets.readonly']
const READ_WRITE = ['https://www.googleapis.com/auth/spreadsheets']
```

Default to read-only. A token that cannot write cannot be made to write by a bug, a bad
range, or a command someone gets to run that you did not expect. Widen to `spreadsheets`
only in the process that genuinely writes, and preferably only that one.

---

## Protecting sheets you do not own

A published community workbook belongs to whoever made it. A write there lands immediately,
is not undone by noticing quickly, and nobody agreed to your tool editing it.

```ts
new TowerSheets({
  transport,
  spreadsheetId: MY_COPY,
  protectSpreadsheets: [COMMUNITY_WORKBOOK],
})
```

Any write to a listed id throws. That is deliberately a throw and not a quiet skip: a silent
refusal has your bot report success while nothing happened, which is the worse outcome. To
work on a community sheet, copy it, share the copy with your service account as an Editor,
and point at the copy.

---

## Two things a read will not tell you

These are not edge cases. Both are the normal behaviour of the API, both look like ordinary
data, and both have produced wrong tools here.

### A spilled cell has no formula

An `ARRAYFORMULA` (or `SEQUENCE`, or any spilling function) writes **one** formula and fills
many cells. Read the formulas of that range and every cell except the anchor comes back
empty — so the range reads as plain typed data, and a tool that concluded "no formulas here"
has concluded the opposite of the truth.

```ts
const result = await sheets.readFormulas('Derived!A1:A200')
if (result.likelySpilled) {
  // Read the values instead, and look for the anchor above or to the left.
}
```

`readFormulas` compares how many cells hold a value against how many hold a formula and
tells you when the two disagree, rather than leaving you to notice.

### Blank is not missing

The API drops trailing empty cells and trailing empty rows. Ask for `A1:C50` on a sheet with
two filled rows and you get two rows, one of them possibly two cells wide. Index into that
and a cell that is merely *empty* reads as `undefined` — identical to a column that is not
there at all.

```ts
const rows = await sheets.readValues('Costs!A1:C50')  // ragged, exactly as returned
const grid = await sheets.readGrid('Costs!A1:C50')    // padded to 50 x 3
```

Use `readGrid` when the shape matters. Before concluding a column is absent, count what is
actually populated — an empty range and a mistyped tab name return exactly the same thing.

---

## Naming things

Tab names go through `quoteSheetName` before they go in a range:

```ts
quoteSheetName("Player's Data")   // "'Player''s Data'"
```

An apostrophe doubles inside the quotes. Getting this wrong does not raise an error — the
API looks for a tab that does not exist and returns an empty result, which is indistinguishable
from an empty range.

And **never index a record with a tab name you did not author**:

```ts
const byTab = { Costs: [], Derived: [] }
byTab[nameFromTheSheet]                              // 'constructor' -> the Object function
```

Sheet names come from a document you do not control. `ownLookup` from the SDK, or
`Object.prototype.hasOwnProperty.call`, is the whole fix. `??` cannot reject a function.

---

## Reading a lot without being rate-limited

The Sheets API rejects a single range that is too large, and rate-limits a caller that asks
too often. `TowerSheets` splits an oversized read into row-aligned rectangles that
reassemble by concatenation:

```ts
new TowerSheets({ transport, spreadsheetId, maxCellsPerRead: 50_000 })
```

Beyond that, the usual shape wins: read a wide range once rather than many narrow ranges,
cache what does not change within a run, and remember that a workbook's own recalculation is
often the slow part rather than the network.

---

## When it does not work

| What you see | What it means |
|---|---|
| `403` naming a project number | The Sheets API is not enabled, or was enabled seconds ago |
| `404` on a spreadsheet id | Wrong id, or the sheet was never shared with the service account |
| `403` on write, read works | Shared as Viewer; it needs Editor |
| Empty result, no error | Mistyped tab name, an actually-empty range, or an unquoted apostrophe |
| Formulas empty but values present | A spilled range — see above |
| `Refusing to write to protected spreadsheet` | Working as intended; point at your own copy |

---

## See also

- [`templates/sheets-client.ts`](../templates/sheets-client.ts) — the googleapis adapter
- [`templates/.env.example`](../templates/.env.example) — every variable, with the warnings
- [`examples/10-read-a-sheet.ts`](../examples/10-read-a-sheet.ts) — the traps, reproduced runnably
- [`BUILDING_A_BOT.md`](BUILDING_A_BOT.md) — where sheet reads belong in a bot
