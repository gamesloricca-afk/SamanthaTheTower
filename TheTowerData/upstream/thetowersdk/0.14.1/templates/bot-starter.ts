/**
 * A complete Tower bot: every calculator, one hand-written command, and a health check.
 *
 * Run it without a gateway at all — the registry is plain functions, so this file is its
 * own demo and its own test harness:
 *
 *     npx tsx templates/bot-starter.ts              # list the commands
 *     npx tsx templates/bot-starter.ts lab-research labName="Damage" targetLevel=10
 *
 * Wiring it to Discord is the last step and the smallest one; see the adapter at the
 * bottom and `docs/BUILDING_A_BOT.md`.
 */
import { calculatorCommands, createTowerBot, markUncacheable } from 'thetowersdk/bot'
import type { BotCommand, BotReply } from 'thetowersdk/bot'
import { getSharedToolLabs } from 'thetowersdk/data'
import { formatLargeNumber } from 'thetowersdk/formatting'

/*
 * ---------------------------------------------------------------------------
 * 1. A hand-written command, for anything the builders do not cover.
 * ---------------------------------------------------------------------------
 *
 * Note what is NOT here: no catalog loading, no lazy init, no cache. The catalogs are
 * module-level and static, so the work happens once when the process starts rather than on
 * the first person to ask. See the performance section of docs/BUILDING_A_BOT.md.
 */
const LAB_INDEX = new Map(
  getSharedToolLabs().map(lab => [lab.name.toLowerCase(), lab]),
)

const labLookup: BotCommand = {
  name: 'lab',
  description: 'Look a lab up by name and show what it costs at a level.',
  options: [
    { name: 'name', description: 'Lab name or slug', type: 'string', required: true },
    { name: 'level', description: 'Level to price', type: 'number', min: 1 },
  ],

  run({ args }): BotReply {
    const wanted = String(args.name ?? '').trim().toLowerCase()
    const lab = LAB_INDEX.get(wanted)

    if (!lab) {
      // Say what was searched. "Not found" without the term sends people round in circles.
      return { description: `No lab called “${args.name}”.`, isError: true }
    }

    const level = typeof args.level === 'number' ? args.level : 1
    const row = lab.levels?.find(entry => entry.level === level)

    if (!row) {
      const max = Math.max(0, ...(lab.levels ?? []).map(entry => Number(entry.level) || 0))
      // A level past the end is not free — it does not exist. Say which.
      return {
        title: lab.displayName ?? lab.name,
        description: `Level ${level} is not charted. This lab goes up to ${max}.`,
        isError: true,
      }
    }

    /*
     * `cost` is absolute coins — there is no currency suffix to apply. The field is
     * optional on the record, so it is checked rather than defaulted: a lab level with no
     * cost recorded is not a free one, and reporting 0 would say it was.
     */
    if (typeof row.cost !== 'number') {
      return {
        title: lab.displayName ?? lab.name,
        description: `Level ${level} exists but has no cost recorded.`,
        isError: true,
      }
    }

    return {
      title: lab.displayName ?? lab.name,
      fields: [
        { name: 'Level', value: String(level), inline: true },
        { name: 'Coin cost', value: formatLargeNumber(row.cost), inline: true },
        { name: 'Duration', value: String(row.duration), inline: true },
      ],
    }
  },
}

/*
 * ---------------------------------------------------------------------------
 * 2. The bot.
 * ---------------------------------------------------------------------------
 */
export const bot = createTowerBot({
  commands: [...calculatorCommands(), labLookup],
  cacheSize: 200,
})

/*
 * Anything reading a save, a sheet or a database goes here. Replies are memoised by
 * command and arguments, which is only correct while the answer depends on nothing else.
 * Forgetting this is how one player gets shown another player's numbers.
 */
markUncacheable('import-save')

/*
 * ---------------------------------------------------------------------------
 * 3. Run it from the command line.
 * ---------------------------------------------------------------------------
 */
function renderReply(reply: BotReply): string {
  const lines: string[] = []
  if (reply.title) lines.push(reply.title)
  if (reply.description) lines.push(reply.description)
  for (const field of reply.fields ?? []) lines.push(`  ${field.name}: ${field.value}`)
  // Always rendered. A clamped input or a skipped level has to reach the reader.
  for (const note of reply.notes ?? []) lines.push(`  note: ${note}`)
  return lines.join('\n')
}

async function main(argv: readonly string[]): Promise<number> {
  const [name, ...rest] = argv

  if (!name) {
    const listing = await bot.run('help', { args: {} })
    console.log(renderReply(listing))
    return 0
  }

  const args: Record<string, string> = {}
  for (const pair of rest) {
    const eq = pair.indexOf('=')
    if (eq > 0) args[pair.slice(0, eq)] = pair.slice(eq + 1)
  }

  const reply = await bot.run(name, { args })
  console.log(renderReply(reply))
  return reply.isError ? 1 : 0
}

main(process.argv.slice(2))
  .then(code => { process.exitCode = code })
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
