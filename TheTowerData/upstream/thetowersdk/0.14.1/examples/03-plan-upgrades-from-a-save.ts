/**
 * Example 3 — Build a tool: what should this player buy next?
 *
 * Puts the three layers together, which is what most tools do:
 *
 *   node      → decode the save file
 *   save      → read what the player has
 *   mechanics → rank what to buy next (Effective Paths)
 *
 * Run it:
 *   npx tsx examples/03-plan-upgrades-from-a-save.ts <path-to-tool_export.json>
 */
import { readFile } from 'node:fs/promises'
import { decodePlayerInfoSaveBytesAsync } from 'thetowersdk/node'
import { buildEffectiveEconomyInputsFromSave, computeCoinsPerHourFromSaveRoot } from 'thetowersdk/save'
import { EFFECTIVE_ECONOMY_UPGRADES, planEffectiveEconomyPath } from 'thetowersdk/mechanics'

async function main(): Promise<void> {
  const savePath = process.argv[2]
  if (!savePath) {
    console.error('Usage: tsx examples/03-plan-upgrades-from-a-save.ts <path-to-tool_export.json>')
    process.exit(1)
  }

  const { parsedRoot } = await decodePlayerInfoSaveBytesAsync(await readFile(savePath))

  /*
   * Step 1 — turn the save into planner inputs.
   *
   * `levels` is what the player has bought and `config` is what they own and
   * have unlocked. The candidates are spread across labs, ultimate weapons,
   * bots, workshop enhancements and equipped modules, so this reads all five
   * rather than one — a labs-only pass reaches about two thirds of them and
   * leaves every weapon locked.
   *
   * Whatever the save cannot answer comes back in `unmapped` with a reason,
   * instead of sitting at zero and reading like a real level.
   */
  const { config, levels, mapped, unmapped } = buildEffectiveEconomyInputsFromSave(parsedRoot)

  console.log(`Mapped ${mapped.length} of ${EFFECTIVE_ECONOMY_UPGRADES.length} candidates from this save.`)
  if (unmapped.length > 0) {
    console.log('Not mapped:')
    for (const entry of unmapped) {
      console.log(`  ${entry.sheetName.padEnd(28)} ${entry.reason}`)
    }
  }
  console.log(`Ultimate weapons unlocked: ${config.unlockedUltimateWeaponCount}`)

  const coinsPerHour = computeCoinsPerHourFromSaveRoot(parsedRoot)
  console.log(coinsPerHour === null
    ? 'No battle history to derive a farm rate from — using the sheet default.\n'
    : `Farm rate from this save's best runs: ${coinsPerHour.toExponential(2)} coins/hour\n`)

  /*
   * Step 2 — plan.
   *
   * `estimates` is the one block no save records — kills a second, the share
   * of enemies dying inside a Black Hole — so it keeps the model's defaults.
   * Override them with what the player answers to match their account.
   */
  const plan = planEffectiveEconomyPath({
    config,
    levels,
    variant: 'time',
    steps: 10,
    /*
     * The time path costs a purchase in days: a lab's research duration plus
     * the time to farm its coins. That second half needs a rate, and the
     * default is the sheet's own 100,000 coins/hour — far below a developed
     * account, which makes every cost look astronomical.
     *
     * The save can answer it. `computeCoinsPerHourFromSaveRoot` averages the
     * player's best runs, so the days below are their days rather than a
     * placeholder's. It is a peak and not a sustained rate; a player who farms
     * below their best should pass their own number instead.
     */
    coinsPerHour: coinsPerHour ?? undefined,
  })

  if (plan.issues.length > 0) {
    console.error('The levels could not be used:', plan.issues)
    process.exit(1)
  }

  console.log('Next 10 purchases, best return first:')
  for (const step of plan.steps) {
    console.log(`  ${String(step.step).padStart(2)}. ${step.name.padEnd(30)} `
      + `→ L${step.level}   ${step.cost.toFixed(2)} days`)
  }

  console.log('\nNot offered, and why:')
  for (const entry of plan.excluded.slice(0, 8)) {
    console.log(`  ${entry.sheetName.padEnd(30)} ${entry.reason}`)
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
