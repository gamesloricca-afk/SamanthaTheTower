/**
 * TEMPLATE — a command-line tool that reads a player's save.
 *
 * Copy this file into your own project and edit `report()`. The parts around it
 * are the bits that are easy to get wrong: locating the file, decoding once,
 * and handling saves that predate a feature.
 *
 * Needs Node (the decoder reads bytes). For a browser build see `browser-widget.ts`.
 *
 *   npx tsx save-cli.ts <path-to-tool_export.json>
 */
import { readFile } from 'node:fs/promises'
import { decodePlayerInfoSaveBytesAsync } from 'thetowersdk/node'
import {
  readLabsFromSaveRoot,
  readWorkshopFromSaveRoot,
} from 'thetowersdk/save'
import { formatLargeNumber } from 'thetowersdk/formatting'

/** Everything you want out of one save, gathered in one pass. */
function report(parsedRoot: Record<string, unknown>): void {
  /*
   * Extractors return null when the save has no data for that feature rather
   * than throwing, so an older save degrades to a missing section instead of
   * crashing the whole tool. Check before you read.
   */
  const labs = readLabsFromSaveRoot(parsedRoot)
  if (labs) {
    console.log(`Labs: ${labs.researchedCount} researched, ${labs.maxedCount} maxed`)
    // `warnings` is values the extractor could not interpret. Non-empty usually
    // means the save shape changed — surface it rather than silently continuing.
    if (labs.warnings.length) console.warn('  warnings:', labs.warnings)
  } else {
    console.log('Labs: not present in this save')
  }

  const workshop = readWorkshopFromSaveRoot(parsedRoot)
  if (workshop) {
    console.log(
      `Workshop: ${workshop.workshopStatCount} upgrades, `
      + `${workshop.enhancementStatCount} enhancements, ${workshop.presets.length} saved presets`,
    )
  }

  // Format anything you print with the game's own ladder, so a player can check
  // your output against their screen.
  console.log(`\n(example formatting: ${formatLargeNumber(1.234e18)})`)
}

async function main(): Promise<void> {
  const savePath = process.argv[2]
  if (!savePath) {
    console.error('Usage: tsx save-cli.ts <path-to-tool_export.json>')
    process.exit(1)
  }

  // Decode once. The save root is a plain object and extractors never mutate it,
  // so run as many as you like over the same root.
  const { parsedRoot } = await decodePlayerInfoSaveBytesAsync(await readFile(savePath))
  report(parsedRoot)
}

main().catch((error: unknown) => {
  console.error('Failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
