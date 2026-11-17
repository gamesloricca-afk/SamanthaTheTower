/**
 * The googleapis adapter for `thetowersdk/sheets`. Copy this into your project.
 *
 * The SDK deliberately does not depend on `googleapis`: it would pull a large Node-only
 * dependency into a package that otherwise runs in a browser, and it would decide for you
 * which auth library and version you use. Instead it describes the two calls it needs, and
 * this file is the twenty lines that satisfy them.
 *
 *     npm install googleapis
 *
 * Credentials come from a **service account** — a robot Google account with its own email
 * address. You share the spreadsheet with that address exactly as you would with a person.
 * `docs/GOOGLE_SHEETS.md` walks through creating one.
 *
 *     export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
 *     export SHEET_ID=1AbC...                     # the id from the sheet's URL
 *
 * Never commit the key file. It is a password to every sheet the account can see.
 */
import { google } from 'googleapis'
import { type SheetsTransport, TowerSheets } from 'thetowersdk/sheets'

/**
 * Spreadsheets this client must never write to.
 *
 * Put every published or community workbook you read in here. A write to a shared sheet is
 * immediate and is not undone by noticing quickly — and the person who owns it did not
 * agree to your bot editing it. Copy it, share the copy with your service account as an
 * Editor, and point `SHEET_ID` at the copy.
 */
const PROTECTED_SPREADSHEETS: readonly string[] = [
  // '1ExampleCommunityWorkbookIdGoesHere',
]

/**
 * Scopes.
 *
 * `spreadsheets.readonly` is the right default: a token that cannot write cannot be made
 * to write by a bug. Widen to `spreadsheets` only in the process that actually writes.
 */
const READ_ONLY = ['https://www.googleapis.com/auth/spreadsheets.readonly']
const READ_WRITE = ['https://www.googleapis.com/auth/spreadsheets']

export interface CreateTransportOptions {
  /** Path to the service-account JSON key. Defaults to GOOGLE_APPLICATION_CREDENTIALS. */
  readonly keyFile?: string
  readonly allowWrites?: boolean
}

export function createSheetsTransport(options: CreateTransportOptions = {}): SheetsTransport {
  const keyFile = options.keyFile ?? process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!keyFile) {
    throw new Error(
      'No Google credentials. Set GOOGLE_APPLICATION_CREDENTIALS to the path of your '
      + 'service-account JSON key, and share the sheet with that account’s email address. '
      + 'See docs/GOOGLE_SHEETS.md.',
    )
  }

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: options.allowWrites ? READ_WRITE : READ_ONLY,
  })

  /*
   * One client for the process. Each `google.sheets()` call builds a new HTTP stack and
   * re-resolves credentials, which turns a cheap read into a slow one — and a bot reads
   * constantly. Built lazily so importing this file does not require credentials.
   */
  let clientPromise: Promise<ReturnType<typeof google.sheets>> | null = null
  const client = () => {
    clientPromise ??= auth.getClient().then(authed =>
      google.sheets({ version: 'v4', auth: authed as never }))
    return clientPromise
  }

  return {
    async readValues({ spreadsheetId, range, valueRenderOption }) {
      const api = await client()
      const response = await api.spreadsheets.values.get({
        spreadsheetId,
        range,
        valueRenderOption: valueRenderOption ?? 'UNFORMATTED_VALUE',
      })
      return response.data.values ?? []
    },

    async writeValues({ spreadsheetId, range, values, valueInputOption }) {
      if (!options.allowWrites) {
        throw new Error('This transport was created read-only; pass { allowWrites: true }.')
      }
      const api = await client()
      await api.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: valueInputOption ?? 'RAW',
        requestBody: { values: values as unknown[][] },
      })
    },
  }
}

/** A ready-to-use client for the sheet named by `SHEET_ID`. */
export function createTowerSheets(options: CreateTransportOptions = {}): TowerSheets {
  const spreadsheetId = process.env.SHEET_ID
  if (!spreadsheetId) throw new Error('Set SHEET_ID to the id in your spreadsheet’s URL.')

  return new TowerSheets({
    transport: createSheetsTransport(options),
    spreadsheetId,
    protectSpreadsheets: PROTECTED_SPREADSHEETS,
  })
}
