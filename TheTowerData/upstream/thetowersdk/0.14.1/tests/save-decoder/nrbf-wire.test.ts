/** Literal NRBF wire fixtures verify integer limits, references, arrays, and decoder errors. */
import { describe, it, expect } from 'vitest'
import { NRBFReader, BinaryObject } from '../../src/node/nrbf/reader'
import { nrbfToJSON } from '../../src/node/nrbf/to-json'
import { decodeInflatedSave, decodeSaveFile } from '../../src/save-decoder/index'
import { decodePlayerInfoSaveBytes } from '../../src/node/decode-save'
const i32 = (n:number) => { const bytes=Buffer.alloc(4); bytes.writeInt32LE(n); return [...bytes] }
const str = (s:string) => [Buffer.byteLength(s), ...Buffer.from(s)]
const header = [0,...i32(1),...i32(-1),...i32(1),...i32(0)]
const wire = (...records:number[]) => Uint8Array.from([...header,...records])
const primitiveArray = (type:number, bytes:number[]) => wire(15,...i32(1),...i32(1),type,...bytes,11)
const cls = (names:string[], types:number[], primitiveTypes:number[], values:number[]) => wire(4,...i32(1),...str('Save'),...i32(names.length),...names.flatMap(str),...types,...primitiveTypes,...values)
describe('literal wire controls', () => {
 it('unsigned max stays 18446744073709551615',()=>expect(NRBFReader.readStream(primitiveArray(16,Array(8).fill(255)))).toEqual([18446744073709551615n]))
 it('positive signed max is correct',()=>expect(NRBFReader.readStream(primitiveArray(9,[255,255,255,255,255,255,255,127]))).toEqual([9223372036854775807n]))
})
describe('independent expected semantics',()=>{
 it('signed minus one',()=>expect(NRBFReader.readStream(primitiveArray(9,Array(8).fill(255)))).toEqual([-1n]))
 it('signed minimum',()=>expect(NRBFReader.readStream(primitiveArray(9,[0,0,0,0,0,0,0,128]))).toEqual([-9223372036854775808n]))
 it('negative timespan ticks yield minus one millisecond',()=>expect(NRBFReader.readStream(primitiveArray(12,[240,216,255,255,255,255,255,255]))).toEqual([-1]))
 it('wire array self-reference converts to circular marker',()=>{
   const value=NRBFReader.readStream(wire(16,...i32(1),...i32(1),9,...i32(1),11)) as unknown[]
   expect(value[0]).toBe(value)
   expect(nrbfToJSON(value)).toEqual(['[Circular]'])
 })
 it('special own member does not replace output prototype',()=>{
   const member=new BinaryObject(); member.addMember('injected',true)
   const root=new BinaryObject(); root.addMember('__proto__',member)
   const result=nrbfToJSON(root) as Record<string,unknown>

   expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
   expect(Object.prototype.hasOwnProperty.call(result,'__proto__')).toBe(true)
 })
 it('dangling member reference is rejected',()=>expect(()=>NRBFReader.readStream(cls(['child'],[2],[],[9,...i32(99),11]))).toThrow())
 it('early MessageEnd plus missing primitive is rejected',()=>{
   const bytes=cls(['child','count'],[2,0],[8],[11])

   expect(()=>NRBFReader.readStream(bytes)).toThrow()
 })
 it('negative single array length is rejected',()=>expect(()=>NRBFReader.readStream(wire(16,...i32(1),...i32(-1),11))).toThrow())
 it('trailing null run preserves array length and values',()=>expect(nrbfToJSON(NRBFReader.readStream(wire(16,...i32(1),...i32(2),13,2,11)))).toEqual([null,null]))
 it('string array forward reference resolves',()=>expect(NRBFReader.readStream(wire(17,...i32(1),...i32(1),9,...i32(2),6,...i32(2),...str('hello'),11))).toEqual(['hello']))
 it('inflated high-level decoder rejects array root',()=>expect(()=>decodeInflatedSave(wire(16,...i32(1),...i32(0),11))).toThrow())
 it('node high-level decoder rejects array root',()=>expect(()=>decodePlayerInfoSaveBytes(wire(16,...i32(1),...i32(0),11))).toThrow())
 it('browser high-level decoder rejects array root',async()=>await expect(decodeSaveFile(wire(16,...i32(1),...i32(0),11))).rejects.toThrow())
})



describe('valid graphs and structural boundaries', () => {
  it('preserves a shared child without labelling it circular', () => {
    const child = new BinaryObject()
    child.addMember('value', 7)
    const root = new BinaryObject()
    root.addMember('left', child)
    root.addMember('right', child)
    expect(nrbfToJSON(root)).toEqual({
      typeName: '', left: { typeName: '', value: 7 }, right: { typeName: '', value: 7 },
    })
  })
  it('retains the existing object-cycle representation', () => {
    const root = new BinaryObject()
    root.addMember('self', root)
    expect(nrbfToJSON(root)).toEqual({ typeName: '', self: '[Circular]' })
  })
  it('uses the provided subarray bounds without changing bytes', () => {
    const bytes = primitiveArray(9, [255,255,255,255,255,255,255,255])
    const padded = new Uint8Array(bytes.length + 9)
    padded.set(bytes, 4)
    const view = padded.subarray(4, 4 + bytes.length)
    expect(NRBFReader.readStream(view)).toEqual([-1n])
    expect(view).toEqual(bytes)
    expect(() => NRBFReader.readStream(view.subarray(0, view.length - 2))).toThrow(RangeError)
  })
  it.each([
    [1, [1]], [2, [255]], [3, [65,0]], [6, [0,0,0,0,0,0,240,63]],
    [7, [255,127]], [8, [255,255,255,127]], [9, [1,0,0,0,0,0,0,0]],
    [10, [127]], [11, [0,0,128,63]], [12, [16,39,0,0,0,0,0,0]],
    [13, [0,128,181,247,245,127,159,8]], [14, [255,255]], [15, [255,255,255,255]],
    [16, [255,255,255,255,255,255,255,255]],
  ] as Array<[number, number[]]>)('rejects a truncated fixed-width primitive type %i', (type, bytes) => {
    const complete = primitiveArray(type, bytes)
    expect(() => NRBFReader.readStream(complete.subarray(0, complete.length - 2))).toThrow(RangeError)
  })
  it('directs incomplete binary save uploads to the official game export', () => {
    const bytes = cls(['count'], [0], [8], [1])
    expect(() => decodeInflatedSave(bytes)).toThrow('External Tools Export')
  })
  it('rejects a string payload shorter than its declared length', () => {
    expect(() => NRBFReader.readStream(wire(6, ...i32(1), 4, 65))).toThrow(RangeError)
  })
  it.each([[[128,128,128,128,128,0]], [[255,255,255,255,15]]])('rejects an invalid string length prefix %s', prefix => {
    expect(() => NRBFReader.readStream(wire(6, ...i32(1), ...prefix))).toThrow(/string length/)
  })
  it.each([0, 3, -1])('rejects null run %i for a two-element array', count => {
    expect(() => NRBFReader.readStream(wire(16, ...i32(1), ...i32(2), 14, ...i32(count), 11))).toThrow(/null run/)
  })
  it('preserves inline strings, backward references and trailing nulls', () => {
    expect(NRBFReader.readStream(wire(
      17, ...i32(1), ...i32(4), 6, ...i32(2), ...str('hello'), 9, ...i32(2), 13, 2, 11,
    ))).toEqual(['hello', 'hello', null, null])
  })
  it('rejects a dangling string reference', () => {
    expect(() => NRBFReader.readStream(wire(17, ...i32(1), ...i32(1), 9, ...i32(99), 11))).toThrow(/reference: 99/)
  })
  it('resolves a forward reference in an empty-named object member', () => {
    expect(nrbfToJSON(NRBFReader.readStream(cls([''], [2], [], [
      9, ...i32(2), 6, ...i32(2), ...str('value'), 11,
    ])))).toEqual({ typeName: 'Save', '': 'value' })
  })
  it('rejects a forward string reference resolving to a non-string', () => {
    expect(() => NRBFReader.readStream(wire(
      17, ...i32(1), ...i32(1), 9, ...i32(2), 16, ...i32(2), ...i32(0), 11,
    ))).toThrow(/string array element/)
  })
  it('requires the declared root object to exist', () => {
    expect(() => NRBFReader.readStream(wire(11))).toThrow(/reference: 1/)
  })
  it('requires class metadata references to exist', () => {
    expect(() => NRBFReader.readStream(wire(1, ...i32(1), ...i32(99), 11))).toThrow(/class metadata/)
  })
  it('preserves valid ClassWithId metadata reuse', () => {
    expect(nrbfToJSON(NRBFReader.readStream(wire(
      4, ...i32(2), ...str('Save'), ...i32(1), ...str('count'), 0, 8, ...i32(7),
      1, ...i32(1), ...i32(2), ...i32(9), 11,
    )))).toEqual({ typeName: 'Save', count: 9 })
  })
  it('preserves empty binary arrays without consuming the end marker as an element', () => {
    expect(NRBFReader.readStream(wire(7, ...i32(1), 0, ...i32(1), ...i32(0), 2, 11))).toEqual([])
  })
  it('preserves rectangular binary array null runs', () => {
    expect(NRBFReader.readStream(wire(7, ...i32(1), 2, ...i32(2), ...i32(2), ...i32(2), 2, 13, 4, 11)))
      .toEqual([[null, null], [null, null]])
  })
  it('rejects a binary array null run exceeding its dimensions', () => {
    expect(() => NRBFReader.readStream(wire(7, ...i32(1), 0, ...i32(1), ...i32(1), 2, 13, 2, 11))).toThrow(/null run/)
  })
  it('rejects zero-rank binary arrays', () => {
    expect(() => NRBFReader.readStream(wire(7, ...i32(1), 0, ...i32(0), 2, 11))).toThrow(/rank/)
  })
  it('rejects binary object roots on all high-level export readers', async () => {
    const bytes = cls(['count'], [0], [8], [...i32(7), 11])
    expect(() => decodeInflatedSave(bytes)).toThrow('External Tools Export')
    expect(() => decodePlayerInfoSaveBytes(bytes)).toThrow('External Tools Export')
    await expect(decodeSaveFile(bytes)).rejects.toThrow('External Tools Export')
  })
})
