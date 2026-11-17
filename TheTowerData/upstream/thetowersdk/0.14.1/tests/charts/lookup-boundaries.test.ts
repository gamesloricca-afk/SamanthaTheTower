/** Untrusted chart keys must resolve to actual cells, including explicitly named special keys. */
import { expect, it } from 'vitest'
import { buildChartLookupTable, getLookupCellByKeys, resolveCanonicalToolDataset } from '../../src/charts/tables/lookup'

it('never returns inherited cells and can store an explicit __proto__ column', () => {
  const row = JSON.parse('{"id":"row","__proto__":42,"normal":7}')
  const table = buildChartLookupTable('test', { title: 'Test', columns: [{ key: '__proto__', label: 'Special' }, { key: 'normal', label: 'Normal' }], rows: [row] })
  expect(getLookupCellByKeys(table, 'row', 'constructor')).toBeNull()
  expect(getLookupCellByKeys(table, 'row', 'toString')).toBeNull()
  expect(getLookupCellByKeys(table, 'row', '__proto__')?.value).toBe(42)
  expect(getLookupCellByKeys(table, 'row', 'normal')?.value).toBe(7)
})

it('uses the documented category fallback for prototype names', () => {
  expect(resolveCanonicalToolDataset('module-substat-values', ['constructor'])).toEqual(resolveCanonicalToolDataset('module-substat-values', ['Cannon']))
})
