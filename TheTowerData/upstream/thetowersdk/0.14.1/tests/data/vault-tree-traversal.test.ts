import { describe, expect, it } from 'vitest'
import { harmonyTreeNodes, powerTreeNodes } from '../../src/data/vault/tree'
import { buildVaultChartSlotIndexById } from '../../src/save/catalogs/vault/slot-bindings'
import {
  buildVaultPowerLevelSlotIndexById,
  buildVaultTreeBfsOrder,
  buildVaultTreeBfsSlotIndexById,
} from '../../src/data/vault/tree-traversal'

describe('vault-tree-traversal', () => {
  it('orders power siblings by parent-child BFS (col then row)', () => {
    const order = buildVaultTreeBfsOrder(powerTreeNodes)
    const chart = powerTreeNodes.map(node => node.id)
    const bfsIndex = buildVaultTreeBfsSlotIndexById(powerTreeNodes)
    const levelIndex = buildVaultPowerLevelSlotIndexById(powerTreeNodes)

    expect(order[0]).toBe('ultdmg1')
    expect(bfsIndex.dmgmeter).toBe(3)
    expect(levelIndex.dmgmeter).toBe(3)
    expect(levelIndex.cash).toBe(4)
    expect(levelIndex.botrange2).toBe(15)
    expect(bfsIndex.tier2).toBe(16)
    expect(levelIndex.knockback).toBe(19)
    expect(levelIndex.orbspeed).toBe(22)
    expect(levelIndex.freeatk).toBe(21)
    expect(levelIndex.freedef).toBe(24)
    expect(levelIndex.freeutil).toBe(27)
    expect(levelIndex.deathdefy).toBe(38)
    expect(levelIndex.multichance).toBe(39)
    expect(levelIndex.bouncchance).toBe(42)
    expect(order.indexOf('tier2')).toBeLessThan(order.indexOf('thorn'))
    expect(chart.indexOf('tier2')).toBeLessThan(chart.indexOf('botrange2'))
  })

  it('diverges from chart document order on harmony (layout-only array)', () => {
    const chart = buildVaultChartSlotIndexById(harmonyTreeNodes)
    const bfs = buildVaultTreeBfsSlotIndexById(harmonyTreeNodes)
    const mismatches = harmonyTreeNodes.filter(node => chart[node.id] !== bfs[node.id]).length
    expect(mismatches).toBeGreaterThan(40)
  })
})
