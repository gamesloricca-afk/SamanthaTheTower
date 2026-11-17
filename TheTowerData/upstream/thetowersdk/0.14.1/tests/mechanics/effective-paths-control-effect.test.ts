import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { computeEffectiveDamage } from '../../src/mechanics/effective-paths/edamage-compute'
import { DAMAGE_PLAN_VARIANTS, planEffectiveDamagePath } from '../../src/mechanics/effective-paths/edamage-plan'
import { configFromSheet, levelsFromSheet } from './helpers/effective-paths-damage-sheet'
import type { SheetCells } from './helpers/effective-paths-damage-sheet'
import states from '../../fixtures/mechanics/effective-paths-edamage-states.fixtures.json'
import { loadEpGraph } from '../../src/mechanics/ep-graph'
import { join } from 'node:path'
import { SRC } from '../helpers/paths'

/**
 * Which of the sheet's controls does the port actually read?
 *
 * ## What was already proven, and what was not
 *
 * The parity fixtures compare the port against the live spreadsheet across
 * randomised accounts with every toggle varied — ten states for eDamage, twelve
 * for eEcon, forty for eHP, plus a single-point shadow per candidate that
 * proves the ORDERING and not merely the starting number. That answers "are the
 * numbers right for these states".
 *
 * It cannot answer two things, and both are this repo's signature defect:
 *
 * 1. **Is an exposed input wired?** A control both the sheet and the port
 *    ignore agrees perfectly. Flipping it and requiring the answer to move is
 *    the only check that separates "modelled" from "read".
 * 2. **Is an input exposed at all?** A control the port never accepts cannot
 *    disagree with the sheet — it simply is not offered, and a parity suite
 *    stays green while the planner answers for one configuration.
 *
 * The second is the larger finding here and it is a SCOPE statement, not a bug:
 * `EffectiveDamageConfig` covers the stat controls and none of the path
 * controls. Those are enumerated below from `ep-graph`, so the list cannot
 * quietly go stale as either side changes.
 */

interface SheetState { cells: SheetCells }

const STATES = states as unknown as SheetState[]

const CONFIG_SOURCE = readFileSync(
  join(SRC, 'mechanics', 'effective-paths', 'edamage-config.ts'),
  'utf8',
)

function columnIndex(letters: string): number {
  return [...letters].reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0)
}

function splitCell(cell: string): { col: number, row: number } | null {
  const m = /^([A-Z]{1,3})(\d{1,4})$/.exec(cell)
  return m ? { col: columnIndex(m[1]), row: Number(m[2]) } : null
}

/**
 * Does the config cite this cell — directly, or inside a range it cites?
 *
 * The five UW perk toggles at `AY67:AY71` are cited once, as the RANGE
 * `eDamage!AT63:AY71`, because the port models them as a record rather than as
 * five fields. A matcher that only reads single cells calls all five
 * unmodelled, which is how a scope report acquires five false findings. The
 * same range-covers-cell arithmetic the edge-evidence check uses.
 */
function configCites(cell: string): boolean {
  // The WHOLE module, not the interface body. `AT63:AY71` is cited on the
  // DAMAGE_PERKS const above the interface, and slicing from the interface
  // start loses it — which reported five modelled perks as unmodelled.
  const body = CONFIG_SOURCE
  if (new RegExp(`\`[^\`]*(?<![A-Z0-9])${cell}(?![0-9])`).test(body)
    && !/:/.test(cell)) {
    if (new RegExp(`\`(?:eDamage!)?${cell}\``).test(body)) return true
  }
  const target = splitCell(cell)
  if (!target) return false
  for (const [, c1, r1, c2, r2] of body.matchAll(
    /`(?:eDamage!)?([A-Z]{1,3})(\d{1,4}):([A-Z]{1,3})(\d{1,4})`/g,
  )) {
    const lo = { col: Math.min(columnIndex(c1), columnIndex(c2)), row: Math.min(+r1, +r2) }
    const hi = { col: Math.max(columnIndex(c1), columnIndex(c2)), row: Math.max(+r1, +r2) }
    if (target.col >= lo.col && target.col <= hi.col
      && target.row >= lo.row && target.row <= hi.row) return true
  }
  return false
}

/** Single cells the config cites, for the floor assertion below. */
function cellsCitedByConfig(): Set<string> {
  const body = CONFIG_SOURCE.slice(
    CONFIG_SOURCE.indexOf('export interface EffectiveDamageConfig'),
  )
  return new Set([...body.matchAll(/`(A[A-Z]\d{1,2})`/g)].map(m => m[1]))
}

/**
 * eDamage controls the port does not accept, and what each one governs.
 *
 * Every one of these decides which rows the PATH contains, not what a level is
 * worth. That is a coherent boundary — the port computes effective damage and
 * plans against it — but it is a boundary, and it is the answer to "does my
 * version match whatever is toggled": for these, there is nothing to toggle.
 */
const PATH_ONLY_CONTROLS: Record<string, string> = {
  // Not path-only, but genuinely not an input here: AI17 is upstream of the
  // BH35 ownership gate (=AND(AI17, IDS_UW_OWN("Poison Swamp"), ...)), and the
  // port takes that gate as its input instead. Listed so the count is honest
  // about why, rather than filed under a heading that does not fit.
  AI17: 'PS Beta Testing — upstream of the BH35 Poison Swamp ownership gate, which the port takes as an input',
  AU23: 'Ignore Lab Target Levels — blanks BD5:BD50 so the path stops capping at targets',
  AY23: 'Ignore UW Target Levels — 4th arg of EPG_UW_TARGET_LEVEL on eDamage Stone',
  AY24: 'Hide UW Cooldown — removes the DW and SM cooldown columns on eDamage Stone',
  AY25: 'Hide non-UW Upgrades — row-2 hide flags on seven columns',
  // AY26 (Hide Non-unlocked Labs) and AY27 (Show Labs on Coin path) are now
  // config-cited fields (hideNonUnlockedLabs / showLabsOnCoinPath), so they are
  // modelled rather than unmodelled path-only. They gate the PLAN, not the
  // effectiveDamage stat — see the path-only boolean handling in the sweep below.
  AI21: 'Rows Calculated — how many path rows to plan',
  /*
   * The coin level band, `eDamage Coins!BO5:CM5`. These are not switches at
   * all: they are the levels the COIN path buys, and row 6 is `BO5+FZ5`, so
   * each one is a running total rather than a setting. The port takes them
   * through `levels.coin` rather than through the config, which is why
   * `configCites` cannot see them.
   *
   * `BS5` is listed once and means two different cells: the Critical Factor
   * enhancement on `eDamage Coins` and the Poison Swamp lab on `eDamage`. This
   * check compares by column letter with the sheet dropped, so it cannot tell
   * them apart -- recorded here rather than worked around, because the same
   * blindness is what makes a letter-keyed lookup unsafe across these tabs.
   */
  BO5: 'Damage enhancement level on the eDamage Coins band — a path input via levels.coin, not a toggle',
  BS5: 'Critical Factor enhancement on the eDamage Coins band, and separately the Poison Swamp lab on eDamage — both path inputs',
}

function flip(value: unknown): unknown {
  if (typeof value === 'boolean') return !value
  if (typeof value === 'number') return value === 0 ? 1 : 0
  return value
}

describe('control coverage against the sheet', () => {
  const graph = loadEpGraph()

  const panelControls = Object.values(graph.nodes)
    .filter(n => n.family === 'eDamage' && n.type === 'control')
    .flatMap(n => (n.sourceCells ?? []).map(c => c.cell))

  it('accounts for every eDamage control: modelled, or path-only with a reason', () => {
    const unmodelled = [...new Set(panelControls.filter(cell => !configCites(cell)))].sort()

    // Derived on both sides — the graph supplies the controls, the config's own
    // comments supply what it reads. Neither is a list maintained by hand.
    expect(unmodelled).toEqual(Object.keys(PATH_ONLY_CONTROLS).sort())
  })

  it('models the stat controls it claims to', () => {
    // The other half of the same statement, so a config that stopped citing
    // cells would fail rather than make the check above trivially pass.
    const cited = cellsCitedByConfig()
    for (const cell of ['AX19', 'AY29', 'AY30', 'AY31', 'AY33', 'AY34', 'AY35', 'AY39', 'AY61']) {
      expect(cited.has(cell), `config no longer cites ${cell}`).toBe(true)
    }
    expect(cited.size).toBeGreaterThanOrEqual(18)
  })

  it('says where each path-only control IS read', () => {
    // A reason has to point somewhere. "It does nothing here" is only a result
    // when it comes with where it does something.
    for (const [cell, reason] of Object.entries(PATH_ONLY_CONTROLS)) {
      expect(reason, cell).toMatch(/eDamage Stone|eDamage Coins|row-2|HORIZON|path|targets|ownership gate/)
      expect(panelControls, `${cell} is not a control in ep-graph`).toContain(cell)
    }
  })
})

describe('every exposed control changes the answer', () => {
  // The busiest state, so a control has the best chance to show. A barren
  // account would let a real wiring gap hide behind "nothing was on anyway".
  const richest = STATES.reduce((best, s) => {
    const count = (cells: SheetCells) => Object.values(cells).filter(v => v === true).length
    return count(s.cells) > count(best.cells) ? s : best
  }, STATES[0])

  const baseline = computeEffectiveDamage(
    configFromSheet(richest.cells),
    levelsFromSheet(richest.cells),
  )

  it('has a baseline worth perturbing', () => {
    // A zero total would make every flip "no effect" and the whole sweep
    // vacuous — the exact shape of a plant that proves nothing.
    expect(baseline.effectiveDamage).toBeGreaterThan(0)
    expect(Object.keys(baseline.columns).length).toBeGreaterThan(20)
  })

  const config = configFromSheet(richest.cells) as unknown as Record<string, unknown>
  const booleans = Object.keys(config).filter(k => typeof config[k] === 'boolean')

  // Booleans that gate the PLAN, not the effectiveDamage stat. EffectiveDamageConfig
  // carries them because the planner reads them (edamage-plan.ts: hideNonUnlockedLabs
  // filters lab upgrades off the path; showLabsOnCoinPath gates the coin path's
  // lab/module candidates), so flipping them moves the plan rather than the stat total
  // measured here. Their cells are the path-only AY26/AY27 documented above.
  const PATH_ONLY_BOOLEANS: Record<string, string> = {
    hideNonUnlockedLabs: 'AY26',
    showLabsOnCoinPath: 'AY27',
  }

  it('sweeps every top-level boolean the config has', () => {
    // Pinned separately: if the config loses a toggle the sweep gets quietly
    // easier, and a shrinking sweep still reports all-green.
    expect(booleans.sort()).toEqual([
      'cardsEquipped', 'chronoFieldEnabled', 'hasRendArmour', 'hideNonUnlockedLabs',
      'lightSpeedShots', 'perksEquipped', 'shockMultiplierUnlocked', 'showLabsOnCoinPath',
    ])
  })

  for (const key of Object.keys(PATH_ONLY_BOOLEANS)) {
    it(`${key} moves the plan (path control, not a stat control)`, () => {
      // A path boolean does not move effectiveDamage; it moves the plan. Prove it
      // does something rather than exempting it into silence: flipping it must change
      // the planned steps or first-step ROI on at least one (state, variant). Swept
      // across every fixture state because a path control's effect is conditional —
      // hideNonUnlockedLabs only bites where a lab is actually locked, which the
      // busiest (richest) state need not contain.
      expect(booleans, key).toContain(key)
      const moved = STATES.some(state => {
        const stateConfig = configFromSheet(state.cells) as unknown as Record<string, unknown>
        const levels = levelsFromSheet(state.cells)
        return DAMAGE_PLAN_VARIANTS.some(variant => {
          const base = planEffectiveDamagePath({ config: stateConfig as never, levels, variant })
          const after = planEffectiveDamagePath({
            config: { ...stateConfig, [key]: flip(stateConfig[key]) } as never,
            levels,
            variant,
          })
          return JSON.stringify(base.steps) !== JSON.stringify(after.steps)
            || JSON.stringify(base.firstStepRoi) !== JSON.stringify(after.firstStepRoi)
        })
      })
      expect(moved, `${key} changed no plan on any state/variant — it is exposed but not read`).toBe(true)
    })
  }

  for (const key of booleans.filter(k => !(k in PATH_ONLY_BOOLEANS))) {
    it(`reads ${key}`, () => {
      const after = computeEffectiveDamage(
        { ...config, [key]: flip(config[key]) } as never,
        levelsFromSheet(richest.cells),
      )
      const moved = after.effectiveDamage !== baseline.effectiveDamage
        || Object.keys(baseline.columns).some(col => after.columns[col] !== baseline.columns[col])
      expect(moved, `${key} changed nothing — it is exposed but not read`).toBe(true)
    })
  }
})
