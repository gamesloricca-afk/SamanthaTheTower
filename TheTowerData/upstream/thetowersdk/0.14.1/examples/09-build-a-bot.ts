/**
 * A bot in ten lines, and what you get for free.
 *
 *   npx tsx examples/09-build-a-bot.ts
 *
 * `templates/bot-starter.ts` is the same thing with a hand-written command and a CLI.
 */
import { calculatorCommands, createTowerBot } from 'thetowersdk/bot'

/*
 * Every calculator in the SDK, as a command. There is no per-calculator code here and none
 * in your bot: `fields` already describes each input, so a builder added to the SDK later
 * shows up without anyone editing this file.
 */
// >>> snippet: bot-in-one-line
const bot = createTowerBot({ commands: calculatorCommands() })
// <<< snippet

async function main(): Promise<void> {
  console.log(`${bot.commands.length} commands, including a generated /help:\n`)
  for (const command of bot.commands.slice(0, 6)) {
    console.log(`  /${command.name}  (${command.options.length} options)`)
  }
  console.log('  …\n')

  /*
   * Running one. Arguments arrive from a gateway as strings and are coerced against the
   * options the command declared; anything undeclared is dropped rather than forwarded.
   */
  const reply = await bot.run('lab-research', {
    args: { labName: 'Damage', currentLevel: '0', targetLevel: '10' },
  })

  console.log(reply.title)
  for (const field of reply.fields ?? []) console.log(`  ${field.name}: ${field.value}`)

  /*
   * `notes` is not decoration. A calculator that clamped a level, priced nothing for a lab,
   * or could not offer an input says so here — and a bot that drops them shows a smaller
   * number with no explanation. Render them every time.
   */
  for (const note of reply.notes ?? []) console.log(`  note: ${note}`)

  /*
   * The same question twice is served from cache. Every builder is a pure function of its
   * arguments, so a repeat cannot differ — which is what makes memoising it safe. A command
   * that reads a save or a sheet is not pure; mark those with `markUncacheable`.
   */
  const started = Date.now()
  for (let i = 0; i < 500; i += 1) {
    await bot.run('lab-research', { args: { labName: 'Damage', targetLevel: '10' } })
  }
  console.log(`\n500 repeat calls in ${Date.now() - started}ms`)

  /*
   * Unknown commands and thrown ones come back as replies rather than exceptions, so a
   * gateway handler cannot leave someone watching a spinner until the interaction expires.
   */
  const missing = await bot.run('no-such-command', { args: {} })
  console.log(`unknown command -> isError=${missing.isError}: ${missing.description}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
