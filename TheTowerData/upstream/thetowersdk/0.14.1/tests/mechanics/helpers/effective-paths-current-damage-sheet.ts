/** Current captured inputs, projected explicitly onto the shared historical test reader. */
import { configFromSheet, levelsFromSheet } from './effective-paths-damage-sheet'
import fixture from '../../../fixtures/mechanics/effective-paths-edamage-v5.11.08.10.fixtures.json'
import type { SheetCells } from './effective-paths-damage-sheet'

export interface CurrentDamageState {
  cells: SheetCells
  projectedInputs: SheetCells
}

export function currentDamageConfig(state: CurrentDamageState = fixture.baseline) {
  const config = configFromSheet(state.projectedInputs)
  return { ...config,
    modules: { ...config.modules,
      cannon: { ...config.modules.cannon, primaryBonus: Number(state.cells.AL4) },
      core: { ...config.modules.core, primaryBonus: Number(state.cells.AL23) },
    },
    framesPerSecond: Number(state.cells.AW23), lightSpeedShots: state.cells.DJ11 === true }
}

export function currentDamageLevels(state: CurrentDamageState = fixture.baseline) {
  const levels = levelsFromSheet(state.projectedInputs)
  for (const ref of ['CZ5', 'DA5']) {
    if (typeof state.cells[ref] !== 'number') throw new Error(`missing captured primary-module lab ${ref}`)
  }
  return { ...levels, lab: { ...levels.lab,
    primaryModuleBonusCannon: Number(state.cells.CZ5), primaryModuleBonusCore: Number(state.cells.DA5),
  } }
}

export const CURRENT_DAMAGE_COLUMN_REFS = ('CZ DA DB DC DD DE DF DG DH DI DJ DK DL DM DN DO DP DQ DR DS DT DU DV DW DX DY DZ EA EB EC ED EE EF EG EH EI EJ EK EL EM EN EO EP EQ ER ES ET')
  .split(' ').map(col => `${col}5`)

/** SDK diagnostic addresses retain their original v5.10 meanings; current source moved eleven columns. */
export function currentDamageOutputRef(old: string): string {
  const match = /^([A-Z]+)5$/.exec(old)
  if (!match) throw new Error(`not a captured A1 diagnostic: ${old}`)
  let index = 0
  for (const char of match[1]) index = index * 26 + char.charCodeAt(0) - 64
  index += 11
  let col = ''
  for (; index > 0; index = Math.floor((index - 1) / 26)) col = String.fromCharCode(65 + ((index - 1) % 26)) + col
  return `${col}5`
}
