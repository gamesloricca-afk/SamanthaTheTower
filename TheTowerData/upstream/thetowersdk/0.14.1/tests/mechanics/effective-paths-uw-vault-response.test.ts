import { describe, expect, it } from 'vitest'
import { computeEffectiveDamage } from '../../src/mechanics/effective-paths/edamage-compute'
import { configFromSheet, levelsFromSheet } from './helpers/effective-paths-damage-sheet'
import type { SheetCells } from './helpers/effective-paths-damage-sheet'
import states from '../../fixtures/mechanics/effective-paths-edamage-states.fixtures.json'

/**
 * The ultimate weapon vault has to REACH the ultimate weapons.
 *
 * `eDamage!CX6` is `(1 + $BL$39) * (1 + $BM$39)` — the ultimate weapon damage
 * relic times its vault — and the port reads it as one finished number. A
 * captured product is a constant, so for a long time buying a vault level
 * moved `spotlightDamage` and nothing else: the ultimate weapon half could not
 * respond to the one path that exists to buy vault levels.
 *
 * Nothing reported it, and nothing could have. The COMPOSITION was exactly
 * right — the constant carries the correct product, so every eDamage answer
 * matched the sheet to 1e-9 across 22 captured accounts. Only the CANDIDATE
 * was wrong. That is this repo's standing bug shape almost word for word:
 *
 *   supported by the model · never set by the wiring · nothing anywhere
 *   reports it
 *
 * Two independent claims are asserted here, both by MOVING an input and
 * watching the answer, never by restating the expression:
 *
 *   1. `config.ultimateWeaponDamageVaultPct` is READ. It was declared in the
 *      config, read from `BM39` by the sheet reader, and populated by the app
 *      from the player's vault tracker — and consumed by nothing whatsoever.
 *   2. `levels.keys.ultimateWeaponDamage` moves effective damage by more than
 *      Spotlight alone, which is what lets the keys planner rank the vault's
 *      Ultimate Weapon Damage node on its whole effect.
 */

interface SheetState { cells: SheetCells }
const STATES = states as unknown as SheetState[]

/** An account with a real vault, so the term under test is not zero. */
function account(index: number) {
  const cells = STATES[index].cells
  return { config: configFromSheet(cells), levels: levelsFromSheet(cells) }
}

describe('the ultimate weapon vault reaches the ultimate weapons', () => {
  it('reads config.ultimateWeaponDamageVaultPct at all', () => {
    /*
     * The dead-field guard. `damageBoost` divides `CX6` by
     * `1 + ultimateWeaponDamageVaultPct` so that the captured product can be
     * re-expressed at a different vault level; raising ONLY that field and
     * leaving the levels alone therefore has to lower the answer.
     *
     * If the field goes back to being unread, both sides are identical and
     * this fails — which is the whole point of asserting it this way round
     * rather than checking that some expression contains the name.
     */
    const { config, levels } = account(1)
    const low = computeEffectiveDamage(
      { ...config, ultimateWeaponDamageVaultPct: 0 }, levels,
    ).effectiveDamage
    const high = computeEffectiveDamage(
      { ...config, ultimateWeaponDamageVaultPct: 0.5 }, levels,
    ).effectiveDamage

    expect(low).toBeGreaterThan(0)
    expect(high).toBeLessThan(low)
  })

  it('answers a bought vault level, not just a bought Spotlight', () => {
    /*
     * `levels.keys.ultimateWeaponDamage` and `config.ultimateWeaponDamageVaultPct`
     * are `eDamage!BM39` twice — once divided by 5%, once as the percentage —
     * so at the account's own state the two cancel and `CX6` passes through
     * untouched. Raising the LEVEL alone is what a keys purchase does.
     *
     * The comparison is against the same bump with the vault response
     * neutralised (by moving the config field in step with the level), which
     * leaves only the Spotlight route. That was the whole of the old
     * behaviour, so this asserts the difference between then and now rather
     * than merely that the number moved.
     */
    const { config, levels } = account(1)
    const owned = levels.keys.ultimateWeaponDamage
    const bumped = { ...levels, keys: { ...levels.keys, ultimateWeaponDamage: owned + 1 } }

    const base = computeEffectiveDamage(config, levels).effectiveDamage
    const withVault = computeEffectiveDamage(config, bumped).effectiveDamage
    // Spotlight-only: move the denominator with the level so the UW half sees
    // no change, which is exactly what a frozen `CX6` used to do.
    const spotlightOnly = computeEffectiveDamage(
      { ...config, ultimateWeaponDamageVaultPct: config.ultimateWeaponDamageVaultPct + 0.05 },
      bumped,
    ).effectiveDamage

    expect(withVault).toBeGreaterThan(base)
    expect(withVault).toBeGreaterThan(spotlightOnly)
  })

  it('leaves the account at its own levels exactly where it was', () => {
    /*
     * The guard on the guard. The response above is a RATIO, and it is 1 at the
     * account's own state — `BM39/5% * 5%` is `BM39`. If it were ever not 1,
     * every captured comparison in this directory would shift at once, so it is
     * asserted rather than assumed.
     *
     * Checked on all ten states, including `effective-paths-edamage-states`'
     * own, whose `CX6` is a free literal that does not equal
     * `(1+BL39)*(1+BM39)` for any of them. The identity holds anyway, because
     * it never depended on `CX6` being consistent.
     */
    for (const [index] of STATES.entries()) {
      const { config, levels } = account(index)
      const derived = levels.keys.ultimateWeaponDamage * 0.05
      expect(derived, `state ${index}`).toBeCloseTo(config.ultimateWeaponDamageVaultPct, 12)
    }
  })
})
