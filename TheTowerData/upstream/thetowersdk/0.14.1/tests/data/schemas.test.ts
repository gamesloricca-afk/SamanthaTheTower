/**
 * Validates each data table that HAS a declared schema, against that schema.
 *
 * A table can drift from its documented shape without types noticing, because
 * types are gone at runtime. This is the check that actually reads the values.
 *
 * It used to say "every public data table", which it never did: it iterates
 * `DATA_TABLE_SCHEMAS`, and that holds eleven of 138 exported tables. The
 * coverage gap is measured in `schemas-cover-what-they-claim.test.ts` rather
 * than implied away here.
 */
import { describe, expect, it } from 'vitest'

import * as data from '../../src/data'
import * as save from '../../src/save'
import { DATA_TABLE_SCHEMAS } from '../../src/data/reference/validate'

// Tables live in whichever entry point owns them: catalogs used for save import
// are exported from `save`, everything else from `data`. The schema contract is
// about shape, not location, so both are searched.
const publicApi: Record<string, unknown> = { ...data, ...save }

describe('public data tables match their schemas', () => {
  for (const [exportName, spec] of Object.entries(DATA_TABLE_SCHEMAS)) {
    it(`${exportName}`, () => {
      const value = publicApi[exportName]
      expect(value, `${exportName} is not exported from thetowersdk/data or /save`).toBeDefined()

      const failures: string[] = []
      const check = (candidate: unknown, where: string) => {
        const result = spec.schema.safeParse(candidate)
        if (!result.success && failures.length < 5) {
          failures.push(`${where}: ${result.error.issues[0]?.message ?? 'invalid'}`)
        }
      }

      if (spec.kind === 'array') {
        expect(Array.isArray(value)).toBe(true)
        ;(value as unknown[]).forEach((entry, i) => check(entry, `[${i}]`))
      } else if (spec.kind === 'record') {
        for (const [key, entry] of Object.entries(value as object)) check(entry, key)
      } else if (spec.kind === 'recordOfRecords') {
        for (const [outer, inner] of Object.entries(value as object)) {
          for (const [key, entry] of Object.entries(inner as object)) check(entry, `${outer}.${key}`)
        }
      } else if (spec.kind === 'recordOfArrays') {
        for (const [group, entries] of Object.entries(value as object)) {
          if (!Array.isArray(entries)) continue
          entries.forEach((entry, i) => check(entry, `${group}[${i}]`))
        }
      }

      expect(failures, `${exportName} has entries that do not match its schema`).toEqual([])
    })
  }
})
