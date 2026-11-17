import { describe, expect, it } from 'vitest'
import { decodeSaveFile, decodeInflatedSave, isEncryptedSave } from '../../src/save-decoder'
import { decodePlayerInfoSaveBytes, decodePlayerInfoSaveBytesAsync } from '../../src/node/decode-save'
const exportBytes = new TextEncoder().encode(JSON.stringify({ ResearchLevel: [4, 2], BattleHistory: [] }))
const unsupported = [new Uint8Array(), new Uint8Array([0x54, 0x44, 0x53, 0x31, 1]), new Uint8Array([0x1f, 0x8b, 8]), new Uint8Array([0, 1, 0, 0, 0])]
describe('official game exports only', () => {
  it('normalizes official JSON through browser and Node readers', async () => {
    const expected = { researchLevel: [4, 2], battleHistory: [] }
    expect(await decodeSaveFile(exportBytes)).toEqual(expected)
    expect(decodeInflatedSave(exportBytes)).toEqual(expected)
    expect(decodePlayerInfoSaveBytes(exportBytes).parsedRoot).toEqual(expected)
    expect((await decodePlayerInfoSaveBytesAsync(exportBytes)).parsedRoot).toEqual(expected)
    expect(decodePlayerInfoSaveBytes(exportBytes).wasGzip).toBe(false)
  })
  it.each(unsupported)('rejects private, encrypted, compressed and empty input on every reader', async bytes => {
    expect(() => decodeInflatedSave(bytes)).toThrow('External Tools Export')
    expect(() => decodePlayerInfoSaveBytes(bytes)).toThrow('violates The Tower Terms of Service')
    await expect(decodeSaveFile(bytes)).rejects.toThrow('Manual Export')
    await expect(decodePlayerInfoSaveBytesAsync(bytes)).rejects.toThrow('External Tools Export')
  })
  it('keeps encrypted-file detection without accepting keys', () => {
    expect(isEncryptedSave(unsupported[1])).toBe(true)
    expect(isEncryptedSave(exportBytes)).toBe(false)
  })
  it('rejects unrelated JSON rather than inventing account data', async () => {
    await expect(decodeSaveFile(new TextEncoder().encode('{"unrelated":true}'))).rejects.toThrow()
  })
})
