/**
 * TEMPLATE — a calculator with typed inputs.
 *
 * The shape most tools end up with: a typed input object, a pure compute
 * function, and a formatter. Keeping compute pure — no I/O, no globals — is what
 * lets you unit-test it and run it in a worker.
 *
 * This one answers "how long until I can afford this?", which is the question
 * behind most planners.
 */
import { LAB_CATALOG } from 'thetowersdk/data'
import { formatDuration, formatLargeNumber, parseDurationToHours } from 'thetowersdk/formatting'

export interface AffordabilityInput {
  /** Coins the player has now. */
  readonly currentCoins: number
  /** Coins the player earns per hour. */
  readonly coinsPerHour: number
  /** Lab to price, by catalog name. */
  readonly labName: string
  /** Level they are on now (0 = unresearched). */
  readonly currentLevel: number
  /** Level they want. */
  readonly targetLevel: number
}

export interface AffordabilityResult {
  readonly labName: string
  readonly levels: number
  readonly coinCost: number
  readonly researchSeconds: number
  /** Null when `coinsPerHour` is zero — "never" is not the same as "instantly". */
  readonly hoursToAfford: number | null
  readonly notes: readonly string[]
}

/**
 * Pure: same input, same output, no side effects.
 *
 * Every reason a number is missing goes into `notes` rather than being swallowed.
 * A planner that silently returns 0 for an unknown lab is worse than one that
 * says it does not know the lab.
 */
export function computeAffordability(input: AffordabilityInput): AffordabilityResult {
  const notes: string[] = []
  const lab = LAB_CATALOG.find(entry => entry.name === input.labName)

  if (!lab) {
    return {
      labName: input.labName,
      levels: 0,
      coinCost: 0,
      researchSeconds: 0,
      hoursToAfford: null,
      notes: [`No lab named "${input.labName}" in the catalog.`],
    }
  }

  const levels = lab.levels ?? []
  const from = Math.max(0, Math.floor(input.currentLevel))
  const to = Math.min(levels.length, Math.floor(input.targetLevel))
  if (to <= from) notes.push('Target level is not above the current level; nothing to buy.')
  if (input.targetLevel > levels.length) {
    notes.push(`${lab.name} caps at level ${levels.length}; the target was clamped.`)
  }

  // Levels are 1-indexed in the game and 0-indexed in the array.
  const wanted = levels.slice(from, to)
  const coinCost = wanted.reduce((sum, level) => sum + (level.cost ?? 0), 0)
  // Durations are text and not all one shape — mostly "HH:MM:SS" with hours past
  // 24, but some rows are "0s". `parseDurationToHours` reads both; splitting on
  // ":" yourself returns NaN on the "0s" rows.
  const researchSeconds = wanted.reduce(
    (sum, level) => sum + parseDurationToHours(level.duration) * 3600,
    0,
  )

  const shortfall = Math.max(0, coinCost - input.currentCoins)
  const hoursToAfford = shortfall === 0
    ? 0
    : input.coinsPerHour > 0
      ? shortfall / input.coinsPerHour
      : null
  if (hoursToAfford === null) notes.push('No coins-per-hour given, so time-to-afford is unknown.')

  return { labName: lab.name, levels: wanted.length, coinCost, researchSeconds, hoursToAfford, notes }
}

/** Presentation, kept separate so the numbers above stay testable. */
export function formatAffordability(result: AffordabilityResult): string {
  const lines = [
    `${result.labName}: ${result.levels} level(s)`,
    `  coin cost      ${formatLargeNumber(result.coinCost)}`,
    `  research time  ${formatDuration(result.researchSeconds)}`,
    `  time to afford ${result.hoursToAfford === null
      ? 'unknown'
      : formatDuration(result.hoursToAfford * 3600)}`,
  ]
  for (const note of result.notes) lines.push(`  note: ${note}`)
  return lines.join('\n')
}
