/**
 * Example 7 — Show numbers the way the game does.
 *
 * The Tower deals in numbers that run past 1e30, and it has its own conventions
 * for shortening them. If your tool prints `1.4e21` where the game prints
 * `1.40Sx`, players cannot check your answer against their screen — which is the
 * only way they can trust it.
 *
 * This entry point is browser-safe and has no game-data dependency.
 *
 * Run it:
 *   npx tsx examples/07-format-like-the-game.ts
 */
import {
  formatCoin,
  formatDuration,
  formatLargeNumber,
  formatMultiplier,
  parseDuration,
  parseResource,
} from 'thetowersdk/formatting'

// Large numbers use the game's own suffix ladder, not scientific notation.
console.log('Coins as the game shows them:')
for (const value of [950, 12_500, 4.2e6, 8.9e9, 1.4e15, 7.7e21, 3.3e33]) {
  console.log(`  ${String(value).padEnd(10)} -> ${formatLargeNumber(value)}`)
}
console.log()

// `formatCoin` is the same ladder with the rounding a coin figure wants.
console.log(`A coin total: ${formatCoin(1.234e18)}`)
console.log(`A multiplier: ${formatMultiplier(13.4567)}`)
console.log()

// Durations round-trip. Lab research times arrive as "HH:MM:SS" strings in the
// catalogs, so parse before you add them together and format after.
console.log('Durations:')
const research = ['02:30:00', '18:45:30', '240:00:00']
let totalHours = 0
for (const text of research) {
  const hours = parseDuration(text) / 3600
  totalHours += hours
  console.log(`  ${text.padEnd(12)} -> ${hours.toFixed(2)}h -> ${formatDuration(hours * 3600)}`)
}
console.log(`  total        -> ${formatDuration(totalHours * 3600)}`)
console.log()

/*
 * Going the other way matters more than it looks. Players paste values straight
 * out of the game — "1.4Sx", "12.5K" — into whatever you build. `parseResource`
 * reads that back to a number so you do not have to ask them to retype it, and
 * whatever `formatLargeNumber` prints, this parses — the two round-trip.
 *
 * It returns `{ error: true }` rather than a number it guessed. That matters more
 * than it sounds: "12abc" must not quietly become 12, and unparseable text must
 * not become a 0 you cannot tell from a real one. Check `error` before `value`.
 */
console.log('Parsing what a player pasted in:')
for (const text of ['7.7s', '12.5K', '900', '3.3D', '12abc', 'not a number']) {
  const parsed = parseResource(text)
  const shown = parsed.error || parsed.value === undefined
    ? '(unparseable)'
    : parsed.value.toExponential(3)
  console.log(`  ${text.padEnd(14)} -> ${shown}`)
}
