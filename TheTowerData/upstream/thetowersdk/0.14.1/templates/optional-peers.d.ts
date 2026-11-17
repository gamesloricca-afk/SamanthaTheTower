/**
 * Modules the templates demonstrate but this package deliberately does not depend on.
 *
 * `templates/sheets-client.ts` shows how to drive `thetowersdk/sheets` with `googleapis`. The
 * SDK does not depend on it — that would pull a large Node-only tree into a package most
 * consumers use for game data — so the template is meant to be copied into a project that
 * installs it. Which leaves the template itself unable to type-check here.
 *
 * These declarations describe only the two calls the template actually makes, so it is checked
 * rather than skipped. They are NOT a substitute for the real types: a project that installs
 * `googleapis` gets its own, and never sees this file, because only `sheets-client.ts` is
 * copied out.
 *
 * Without this the whole template failed to resolve, and every destructured parameter in it
 * became an implicit `any` — six errors that all pointed at the template and none of which were
 * about the template.
 */
declare module 'googleapis' {
  interface SheetsValuesApi {
    get(params: {
      spreadsheetId: string
      range: string
      valueRenderOption?: string
    }): Promise<{ data: { values?: unknown[][] } }>
    update(params: {
      spreadsheetId: string
      range: string
      valueInputOption?: string
      requestBody?: { values: unknown[][] }
    }): Promise<unknown>
  }

  interface SheetsApi {
    spreadsheets: { values: SheetsValuesApi }
  }

  export const google: {
    auth: {
      GoogleAuth: new (options: {
        scopes: readonly string[]
        /** Path to a service-account JSON key. See docs/GOOGLE_SHEETS.md. */
        keyFile?: string
      }) => {
        getClient(): Promise<unknown>
      }
    }
    sheets(options: { version: string, auth: never }): SheetsApi
  }
}
