import { describe, expect, it } from 'vitest'
import { waveSkipExpectedSkipsPerProc } from '../../src/mechanics/enemies/drops-simulation'
import { buildResourceDropsCoinMultipliers } from '../../src/mechanics/resource-drops/coin-simulation'
import { simulateWaveCoinRows } from '../../src/mechanics/resource-drops/simulate-wave-coins'
import { simulateWaveEconRows, accumulateWaveEcon } from '../../src/mechanics/resource-drops/simulate-wave-econ'
import {
  waveSkipChainIncomeFactor,
  waveSkipIncomeEv,
  waveSkipSpawnFraction,
} from '../../src/mechanics/resource-drops/wave-skip-per-wave'
import { baseCoinInput } from './resource-drops-coin-simulation.test'

describe('simulate-wave-econ', () => {
  it.each([
    ['coins', simulateWaveCoinRows],
    ['economy', simulateWaveEconRows],
  ] as const)('%s rows prioritize option yield over stored yield', (_name, simulate) => {
    const none = { randomBasicGatePassRate: 0, enemyDoubleSpawnChance: 0 }
    const positive = { randomBasicGatePassRate: 1, enemyDoubleSpawnChance: 0 }
    const input = baseCoinInput({ tier: 1, targetWave: 3, useAccountSpawnYield: true, spawnYield: positive })
    const options = { maxRows: 3, coinsPerWaveMult: 1 }
    expect(simulate(input, { ...options, spawnYield: none })[0]?.expectedKills).toBe(0)
    expect(simulate({ ...input, spawnYield: none }, options)[0]?.expectedKills).toBe(0)
    expect(simulate({ ...input, spawnYield: none }, { ...options, spawnYield: positive })[0]?.expectedKills).toBeGreaterThan(0)
  })

  it('includes positive cells at T20 W100', () => {
    const rows = simulateWaveEconRows(baseCoinInput({ tier: 20, targetWave: 100 }), { maxRows: 100 })
    const w100 = rows.find(r => r.wave === 100)
    expect(w100).toBeDefined()
    expect(w100!.cells).toBeGreaterThan(0)
  })
  it('boss wave row has reroll shards on boss interval', () => {
    const rows = simulateWaveEconRows(baseCoinInput({ tier: 1, targetWave: 20 }), { maxRows: 20 })
    const bossRow = rows.find(r => r.wave === 10)
    expect(bossRow?.isBossWave).toBe(true)
    expect(bossRow!.rerollShards).toBeGreaterThan(0)
  })
  it('cells increase with cells per kill bonus workshop level', () => {
    const low = simulateWaveEconRows(baseCoinInput({ tier: 20, targetWave: 100, cellsPerKillBonusLevel: 0 }), { maxRows: 100 }).find(r => r.wave === 100)!
    const high = simulateWaveEconRows(baseCoinInput({ tier: 20, targetWave: 100, cellsPerKillBonusLevel: 50 }), { maxRows: 100 }).find(r => r.wave === 100)!
    expect(high.cells).toBeGreaterThan(low.cells)
  })

  it('high wave skip lowers expected kills at the same wave', () => {
    const lowSkip = simulateWaveEconRows(
      baseCoinInput({ tier: 20, targetWave: 100, waveSkipCardLevel: 1, waveSkipMasteryLevel: 0 }),
      { maxRows: 100 },
    ).find(r => r.wave === 100)!
    const highSkip = simulateWaveEconRows(
      baseCoinInput({ tier: 20, targetWave: 100, waveSkipCardLevel: 7, waveSkipMasteryLevel: 9 }),
      { maxRows: 100 },
    ).find(r => r.wave === 100)!
    expect(highSkip.expectedKills).toBeLessThan(lowSkip.expectedKills)
    expect(highSkip.spawnFraction).toBeLessThan(1)
  })

  it('skip cells are positive when wave skip is active', () => {
    const rows = simulateWaveEconRows(
      baseCoinInput({ tier: 20, targetWave: 100, waveSkipCardLevel: 7, waveSkipMasteryLevel: 9 }),
      { maxRows: 100 },
    )
    const mid = rows.find(r => r.wave === 50)
    expect(mid?.skipCells).toBeGreaterThan(0)
  })

  it('wave skip spawn fraction drops with mastery depth', () => {
    const shallow = waveSkipSpawnFraction(0.19, waveSkipExpectedSkipsPerProc(0))
    const deep = waveSkipSpawnFraction(0.19, waveSkipExpectedSkipsPerProc(9))
    expect(deep).toBeLessThan(shallow)
  })

  it('skip kill coins appear in per-wave coin rows', () => {
    const input = baseCoinInput({ tier: 20, targetWave: 50, waveSkipCardLevel: 7, waveSkipMasteryLevel: 9 })
    const rows = simulateWaveCoinRows(input, {
      maxRows: 50,
      coinsPerWaveMult: buildResourceDropsCoinMultipliers(input).coinsPerWaveMult,
    })
    expect(rows.some(r => r.skipKillCoins > 0)).toBe(true)
  })

  it('coin weight per kill rises with tier spawn mix', () => {
    const low = simulateWaveEconRows(baseCoinInput({ tier: 1, targetWave: 50 }), { maxRows: 50 }).find(r => r.wave === 50)!
    const high = simulateWaveEconRows(baseCoinInput({ tier: 12, targetWave: 50 }), { maxRows: 50 }).find(r => r.wave === 50)!
    expect(high.coinWeightPerKill).toBeGreaterThan(low.coinWeightPerKill)
  })

  it('fleet module shards one-type is quarter of all-types total', () => {
    const rows = simulateWaveEconRows(baseCoinInput({ tier: 20, targetWave: 5000 }), { maxRows: 5000 })
    const fleet = rows.find(r => r.isFleetWave && r.moduleShards > 0)
    expect(fleet).toBeDefined()
    expect(fleet!.moduleShardsOneType).toBeCloseTo(fleet!.moduleShards / 4, 4)
  })

  it('multi-skip chain factor exceeds single 1.1 payout', () => {
    const factor = waveSkipChainIncomeFactor(waveSkipExpectedSkipsPerProc(9))
    expect(factor).toBeGreaterThan(1.1)
  })

  it('wave skip income EV exceeds linear-only model at high mastery', () => {
    const prevTotal = 1000
    const anchor = 800
    const skipChance = 0.19
    const expectedSkips = waveSkipExpectedSkipsPerProc(9)
    const spawnFraction = waveSkipSpawnFraction(skipChance, expectedSkips)
    const compound = waveSkipIncomeEv(prevTotal, anchor, skipChance, expectedSkips, spawnFraction)
    const linearOnly = (1 - spawnFraction) * 1.1 * prevTotal
    expect(compound).toBeGreaterThan(linearOnly)
  })

  it('useSpawnGates additive probe lowers expected kills vs calibrated account yield', () => {
    const input = baseCoinInput({
      tier: 1,
      targetWave: 50,
      waveAcceleratorMasteryLevel: 9,
      useAccountSpawnYield: true,
    })
    const mult = buildResourceDropsCoinMultipliers(input).coinsPerWaveMult
    const calibrated = accumulateWaveEcon(input, { maxRows: 50, coinsPerWaveMult: mult }).expectedKills
    const modeled = accumulateWaveEcon(
      { ...input, useSpawnGates: true, useSpawnQuantum: false },
      { maxRows: 50, coinsPerWaveMult: mult },
    ).expectedKills
    expect(modeled).toBeLessThan(calibrated)
    expect(calibrated).toBeGreaterThan(0)
  })

  it('high wave skip mastery yields more skip cells than low mastery at mid wave', () => {
    const low = simulateWaveEconRows(
      baseCoinInput({ tier: 20, targetWave: 100, waveSkipCardLevel: 1, waveSkipMasteryLevel: 0 }),
      { maxRows: 100 },
    ).find(r => r.wave === 50)!
    const high = simulateWaveEconRows(
      baseCoinInput({ tier: 20, targetWave: 100, waveSkipCardLevel: 7, waveSkipMasteryLevel: 9 }),
      { maxRows: 100 },
    ).find(r => r.wave === 50)!
    expect(high.skipCells).toBeGreaterThan(low.skipCells)
  })

})
