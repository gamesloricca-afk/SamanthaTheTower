import { describe, expect, it } from 'vitest'
import CAPTURE from '../../fixtures/mechanics/effective-paths-edamage-path-switches.fixtures.json'

/**
 * The sheet's four eDamage paths under fifteen control settings.
 *
 * The existing control capture varies the RUN -- run type, cards, perks, Chrono
 * Field. This one varies what the planner is ALLOWED TO OFFER: the five
 * exclusion switches, alone and in the combinations that can mask each other.
 * That is the half where a port and a sheet disagree without either number
 * being wrong, and it had never been captured.
 *
 * It also reads all four bands. Comparing only the time path let a switch that
 * reorders the stone board pass unnoticed, and the exclusion switches act
 * mostly on stone.
 */

interface Step { name: string, level: unknown }
interface State {
  id: string
  overrides: Record<string, unknown>
  controls: Record<string, unknown>
  paths: Record<string, Step[]>
}
const STATES = (CAPTURE as unknown as { states: State[] }).states
const BANDS = ['time', 'stone', 'coin', 'keys'] as const

const signature = (steps: Step[] | undefined) =>
  (steps ?? []).map(step => `${step.name}@${step.level}`).join('>')

describe('the eDamage paths under toggled switches', () => {
  it('captured every state and every band', () => {
    // Guards the guard: a short capture would make each comparison below pass
    // on whatever happened to be there.
    expect(STATES).toHaveLength(15)
    for (const state of STATES) {
      expect(Object.keys(state.paths).sort(), state.id).toEqual([...BANDS].sort())
    }
  })

  it('applied each state’s overrides rather than relabelling one state', () => {
    /*
     * A state whose overrides never reached the sheet is the base state under
     * another name, and fifteen of those look exactly like a thorough sweep.
     */
    for (const state of STATES) {
      if (state.id === 'tourney-all-on') continue
      expect(Object.keys(state.overrides).length, state.id).toBeGreaterThan(0)
      for (const [cell, value] of Object.entries(state.overrides)) {
        /*
         * Normalised, because the sheet hands a boolean back as the STRING
         * "TRUE"/"FALSE". Comparing raw made every override look unapplied,
         * which is the same signal as a capture that never wrote anything --
         * and would have hidden a real one.
         */
        const seen = String(state.controls[cell]).toLowerCase()
        expect(seen, `${state.id} ${cell}`).toBe(String(value).toLowerCase())
      }
    }
  })

  it('is control-sensitive on three of the four bands', () => {
    /*
     * time 4, stone 5, keys 4 distinct orderings. A capture where every state
     * agrees is what a BROKEN capture looks like, so the counts are asserted
     * rather than merely "> 1".
     *
     * `coin` is 1, and that is the copy rather than the switches: this working
     * copy has no IDS link, so `IDS_LAB_LEVEL` returns 0 for every lab and the
     * coin band plans nothing at all. It is kept so the day it starts planning
     * is visible.
     */
    const distinct = Object.fromEntries(BANDS.map(band =>
      [band, new Set(STATES.map(state => signature(state.paths[band]))).size]))
    expect(distinct).toEqual({ time: 4, stone: 5, coin: 1, keys: 4 })
  })

  it('records that the five exclusion switches move NOTHING on this copy', () => {
    /*
     * The finding, and it is about the ACCOUNT rather than the switches.
     *
     * All five leave every band identical to `tourney-all-on`, because this
     * copy has all-zero levels and no IDS link: no lab target and no UW target
     * is set, so "ignore targets" has nothing to ignore; the stone band is
     * buying Spotlight, so "hide UW cooldown" has no cooldown on the board.
     *
     * Written down because the opposite reading -- that the switches are dead
     * -- is the one this file would otherwise invite, and it is wrong: their
     * behaviour is pinned against the sheet's own hide flags in
     * `plan-limits.test.ts`, where `eDamage!AY24` is shown to gate exactly two
     * cooldown columns and `AY25` exactly ten columns.
     */
    const base = signature(STATES.find(s => s.id === 'tourney-all-on')!.paths.stone)
    const inert = [
      'ignore-lab-targets', 'ignore-uw-targets',
      'hide-uw-cooldown', 'hide-non-uw', 'hide-uw-cooldown+non-uw',
    ]
    for (const id of inert) {
      const state = STATES.find(s => s.id === id)
      expect(state, id).toBeTruthy()
      expect(signature(state!.paths.stone), `${id} moved the stone band`).toBe(base)
    }
  })

  it('shows the controls that DO bite, so the capture is not inert', () => {
    // Cards and perks reorder the stone band; without at least one mover the
    // test above would be satisfied by a capture that never wrote anything.
    const base = signature(STATES.find(s => s.id === 'tourney-all-on')!.paths.stone)
    for (const id of ['cards-off', 'perks-off', 'cards-and-perks-off']) {
      expect(signature(STATES.find(s => s.id === id)!.paths.stone), id).not.toBe(base)
    }
  })
})
