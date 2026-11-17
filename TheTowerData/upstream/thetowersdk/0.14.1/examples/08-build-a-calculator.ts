/**
 * Example 8 — Build a calculator without writing any calculator.
 *
 * A builder carries its own defaults, a description of every input, a pure
 * `compute`, and notes explaining anything it could not do. That is enough to
 * render a whole tool generically: this file draws a form and a result table for
 * a calculator it never names.
 *
 * Swap the id on the command line and the same twenty lines render a different
 * calculator. That is the point — the UI is yours, the plumbing is not.
 *
 * Run it:
 *   npx tsx examples/08-build-a-calculator.ts
 *   npx tsx examples/08-build-a-calculator.ts uw.stones
 */
import { CALCULATOR_BUILDERS, findCalculatorBuilder } from 'thetowersdk/builders'
import { formatDuration, formatLargeNumber } from 'thetowersdk/formatting'

const requestedId = process.argv[2] ?? 'lab.research'
const builder = findCalculatorBuilder(requestedId)

if (!builder) {
  console.error(`No calculator "${requestedId}". Available:`)
  for (const option of CALCULATOR_BUILDERS) console.error(`  ${option.id.padEnd(20)} ${option.title}`)
  process.exit(1)
}

console.log(`${builder.title} — ${builder.summary}\n`)

/*
 * Step 1 — render the form.
 *
 * Nothing below knows which calculator this is. `fields` says what each input is
 * called, what kind of control it needs, its range, and its options; `defaults`
 * says what to show before the user touches anything.
 */
const defaults = builder.defaults as Record<string, unknown>
console.log('Inputs:')
for (const field of builder.fields) {
  const bits: string[] = [field.kind]
  if (field.unit) bits.push(field.unit)
  if (field.min !== undefined || field.max !== undefined) bits.push(`${field.min ?? '-'}..${field.max ?? '-'}`)
  if (field.options) bits.push(`${field.options.length} options`)

  /*
   * A `number-list` default is a whole row, so it is summarised rather than printed —
   * a real UI would render one control per entry here.
   */
  const shown = Array.isArray(defaults[field.key])
    ? `[${(defaults[field.key] as unknown[]).length} values]`
    : String(defaults[field.key])

  console.log(`  ${field.label.padEnd(22)} ${shown.padEnd(16)} (${bits.join(', ')})`)
  if (field.help) console.log(`  ${' '.repeat(22)} ${field.help}`)
}
console.log()

/*
 * Step 2 — compute.
 *
 * `compute` takes a partial, so you can hand it exactly what the user has typed
 * so far. Missing fields fall back to the defaults; out-of-range ones are
 * clamped. It does not throw, so no try/catch is needed around a keystroke.
 */
const result = builder.compute({} as never) as unknown as Record<string, unknown>

console.log('Result:')
for (const [key, value] of Object.entries(result)) {
  if (key === 'notes') continue

  // Rows render as a count; a UI would draw the table.
  if (Array.isArray(value)) {
    console.log(`  ${key.padEnd(22)} ${value.length} row(s)`)
    continue
  }
  if (typeof value === 'number') {
    /*
     * Pick the formatter by what the number MEANS, not by its type.
     *
     * `formatLargeNumber` rounds to whole numbers below its first suffix — right for coins,
     * because nobody holds 0.5 of one, but it turns a 0.5 ratio into "1". A fraction has to
     * go through a percentage instead.
     */
    const shown = /hours?$/i.test(key)
      ? formatDuration(value * 3600)
      : /ratio|reduction|share|fraction/i.test(key)
          ? `${(value * 100).toFixed(1)}%`
          : /percent$/i.test(key)
              ? `${value.toFixed(1)}%`
              : formatLargeNumber(value)
    console.log(`  ${key.padEnd(22)} ${shown}`)
    continue
  }
  console.log(`  ${key.padEnd(22)} ${String(value)}`)
}

/*
 * Step 3 — show what it could not do.
 *
 * Every builder returns `notes`. Surfacing them is the difference between a tool
 * that says "nothing to buy, your target is below your current level" and one
 * that shows a confident zero.
 */
const notes = result.notes as string[]
if (notes.length > 0) {
  console.log('\nNotes:')
  for (const note of notes) console.log(`  - ${note}`)
}

console.log(`\nOther calculators: ${CALCULATOR_BUILDERS.map(b => b.id).join(', ')}`)
