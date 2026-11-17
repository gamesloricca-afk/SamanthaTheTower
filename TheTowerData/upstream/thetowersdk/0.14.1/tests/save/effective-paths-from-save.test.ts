import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildEffectiveEconomyInputsFromSave } from '../../src/save/effective-paths/from-save'
import { decodePlayerInfoSaveBytes } from '../../src/node/decode-save'
import { EFFECTIVE_ECONOMY_UPGRADES } from '../../src/mechanics/effective-paths/eecon-plan'

/**
 * A save file to Effective Paths planner inputs.
 *
 * ## Why this file exists
 *
 * The only worked path from a save to a plan filled `levels` from labs alone
 * against a zero config. On a real account that reached 31 of 48 candidates,
 * excluded every ultimate-weapon upgrade as "the weapon is not unlocked" on a
 * save with all nine unlocked, and returned an empty plan. Nothing reported
 * any of it: the missing candidates sat at zero, which reads exactly like a
 * level a player has not bought.
 *
 * So the properties here are about reach and about honesty — how much of the
 * catalog a real save answers, and that whatever it cannot answer is named.
 *
 * The real-save cases need `TOWER_TEST_SAVE` pointing at a `playerInfo.dat`.
 * Without one they skip and the adversarial half still runs, so this stays
 * useful on a fresh clone.
 */

const savePath = process.env.TOWER_TEST_SAVE
const hasSave = Boolean(savePath && existsSync(savePath))
const describeSave = hasSave ? describe : describe.skip

function realSaveInputs() {
  const { parsedRoot } = decodePlayerInfoSaveBytes(readFileSync(savePath as string))
  return buildEffectiveEconomyInputsFromSave(parsedRoot)
}

/** Inputs that are not a save root, in the shapes a real failure produces. */
const NOT_A_SAVE: Array<{ what: string, value: unknown }> = [
  { what: 'null', value: null },
  { what: 'undefined', value: undefined },
  { what: 'an empty object', value: {} },
  { what: 'an array', value: [] },
  { what: 'a string', value: 'playerInfo' },
  { what: 'a number', value: 42 },
  { what: 'keys with null values', value: { labs: null, workshop: null } },
  { what: 'an array where a record belongs', value: { labs: [] } },
]

describe('building planner inputs from something that is not a save', () => {
  for (const { what, value } of NOT_A_SAVE) {
    it(`never throws on ${what}`, () => {
      expect(() => buildEffectiveEconomyInputsFromSave(value)).not.toThrow()
    })
  }

  it('accounts for every candidate even when it can fill none', () => {
    const { mapped, unmapped } = buildEffectiveEconomyInputsFromSave({})

    // The point of the whole exercise: a candidate is filled, or it is
    // explained. Never neither, and never silently zero.
    expect(mapped.length + unmapped.length).toBe(EFFECTIVE_ECONOMY_UPGRADES.length)
  })

  it('gives a reason for everything it could not map', () => {
    const { unmapped } = buildEffectiveEconomyInputsFromSave({})

    expect(unmapped.length).toBeGreaterThan(0)
    for (const entry of unmapped) {
      expect(entry.reason, entry.sheetName).toBeTruthy()
    }
  })

  it('owns no weapon when there is no save to read one from', () => {
    const { config } = buildEffectiveEconomyInputsFromSave({})

    expect(config.unlockedUltimateWeaponCount).toBe(0)
    expect(config.weapons.goldenTower.unlocked).toBe(false)
  })
})

describeSave('building planner inputs from a real save', () => {
  it('reaches far more of the catalog than labs alone can', () => {
    const { mapped } = realSaveInputs()

    /*
     * Labs alone reached 31. The eleven stone-band candidates are ultimate
     * weapon stat levels and the rest are bot, enhancement and module levels,
     * so a labs-only pass cannot get near this number however well it matches
     * names — which is the regression this guards.
     */
    expect(mapped.length).toBeGreaterThan(40)
  })

  it('reads the ultimate weapons the player has actually unlocked', () => {
    const { config } = realSaveInputs()

    // The original defect: every weapon-gated economy upgrade was excluded as
    // "the weapon is not unlocked" on an account that owns all nine.
    expect(config.unlockedUltimateWeaponCount).toBeGreaterThan(0)
    expect(config.weapons.goldenTower.unlocked).toBe(true)
  })

  it('carries weapon stat levels, not just the unlock flag', () => {
    const { config } = realSaveInputs()

    // A flag alone would let the candidate through and then rank it off zero.
    expect(config.weapons.goldenTower.duration).toBeGreaterThan(0)
    expect(config.weapons.goldenTower.cooldown).toBeGreaterThan(0)
  })

  it('fills the generator rarity alongside its level', () => {
    const { config, levels } = realSaveInputs()

    /*
     * These two travel together. `atLevel` reads the module bonus as
     * `computeModuleStat({ rarityLabel, level })` and silently falls back to a
     * flat bonus when the rarity is missing, so a mapped level with no rarity
     * buys levels that move nothing.
     */
    const generatorLevel = (levels as unknown as Record<string, Record<string, number>>)
      .time.primaryModuleGenerator
    if (generatorLevel > 0) expect(config.generator.primaryRarity).toBeTruthy()
  })

  it('still names whatever it could not map', () => {
    const { unmapped } = realSaveInputs()

    for (const entry of unmapped) {
      expect(entry.reason, entry.sheetName).toBeTruthy()
    }
  })
})
