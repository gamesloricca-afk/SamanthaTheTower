import { describe, expect, it } from 'vitest'
import { readGuardiansFromSaveRoot } from '../../src/save/guardians/read'
import { readToolExportJson } from '../../src/save/access/json'

describe('Guardian guild eligibility input', () => {
  it('preserves known membership and non-membership without coercion', () => {
    expect(readGuardiansFromSaveRoot({ inGuild: true })?.inGuild).toBe(true)
    expect(readGuardiansFromSaveRoot({ inGuild: false })?.inGuild).toBe(false)
  })
  it('keeps absent or malformed membership unknown', () => {
    for (const value of [undefined, 0, 1, 'true', null]) {
      const result = readGuardiansFromSaveRoot({ inGuild: value })!
      expect(result.inGuild).toBeNull()
      expect(result.warnings).toContain('Guild membership is unavailable; Guardian battle eligibility is not established.')
    }
  })
  it('reads the official PascalCase flag through the existing canonical decoder', () => {
    const root = readToolExportJson(new TextEncoder().encode(JSON.stringify({
      ExportVersion: 1, UpgradeWorkshopLevel: [], InGuild: false,
    })))
    expect(readGuardiansFromSaveRoot(root)?.inGuild).toBe(false)
  })
})
