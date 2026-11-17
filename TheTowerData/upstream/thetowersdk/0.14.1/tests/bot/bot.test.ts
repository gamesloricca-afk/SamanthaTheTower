import { describe, expect, it } from 'vitest'
import { CALCULATOR_BUILDERS } from '../../src/builders'
import { calculatorCommand, calculatorCommands, createTowerBot, markUncacheable } from '../../src/bot'
import type { BotCommand } from '../../src/bot'

const labResearch = CALCULATOR_BUILDERS.find(builder => builder.id === 'lab.research')!

describe('a builder becomes a command without per-calculator code', () => {
  it('covers every builder', () => {
    const commands = calculatorCommands()
    expect(commands.length).toBe(CALCULATOR_BUILDERS.length)
    expect(new Set(commands.map(command => command.name)).size).toBe(commands.length)
  })

  it('declares an option for every field a slash command can express', () => {
    /*
     * The failure this guards is the one the whole codebase keeps producing: an input the
     * model reads that the wiring never offers. Here it would be a calculator field with
     * no command option — the number comes back on the default and nothing says so.
     */
    const missing: string[] = []
    for (const builder of CALCULATOR_BUILDERS) {
      const command = calculatorCommand(builder)
      const declared = new Set(command.options.map(option => option.name))
      for (const field of builder.fields) {
        // `number-list` is the one kind a slash command genuinely cannot carry.
        if (field.kind !== 'number-list' && !declared.has(field.key)) {
          missing.push(`${builder.id}.${field.key}`)
        }
      }
    }
    expect(missing, `fields with no option: ${missing.join(', ')}`).toEqual([])
  })

  it('says which fields it could not offer rather than dropping them quietly', () => {
    // Dissonance takes a personal best per tier, which no single option can express.
    const dissonance = CALCULATOR_BUILDERS.find(builder => builder.id === 'dissonance.boost')!
    const reply = calculatorCommand(dissonance).run({ args: {} }) as { notes?: readonly string[] }
    expect(reply.notes?.join(' ')).toMatch(/Not settable here/)
  })

  it('maps a select to choices, not to free text', () => {
    const command = calculatorCommand(labResearch)
    const labOption = command.options.find(option => option.name === 'labName')
    expect(labOption?.type).toBe('string')
    expect((labOption?.choices?.length ?? 0)).toBeGreaterThan(10)
  })

  it('carries the builder notes into the reply', () => {
    // The clamped-level and dead-lab notes are the whole reason the result carries them.
    const workshop = CALCULATOR_BUILDERS.find(builder => builder.id === 'workshop.upgrade')!
    const reply = calculatorCommand(workshop).run({
      args: { costKey: 'WSP_ATTACK_SPEED', currentLevel: 0, targetLevel: 500 },
    }) as { notes?: readonly string[] }
    expect(reply.notes?.join(' ')).toMatch(/priced to level 75/)
  })

  it('ignores arguments the command never declared', () => {
    const command = calculatorCommand(labResearch)
    const reply = command.run({ args: { targetLevel: 5, somethingElse: 999, __proto__: 'x' } as never })
    expect((reply as { isError?: boolean }).isError).toBeFalsy()
  })

  it('actually computes — the numbers move with the input', () => {
    const command = calculatorCommand(labResearch)
    const value = (args: Record<string, unknown>) => {
      const reply = command.run({ args: args as never }) as { fields?: readonly { name: string, value: string }[] }
      return reply.fields?.find(field => /coin/i.test(field.name))?.value
    }
    const small = value({ labName: 'Damage', currentLevel: 0, targetLevel: 2 })
    const large = value({ labName: 'Damage', currentLevel: 0, targetLevel: 8 })
    expect(small).toBeTruthy()
    expect(large).not.toBe(small)
  })
})

describe('the bot registry', () => {
  const echo = (name: string, value: string): BotCommand => ({
    name,
    description: `echo ${name}`,
    options: [{ name: 'text', description: 'text', type: 'string' }],
    run: ({ args }) => ({ description: `${value}:${String(args.text ?? '')}` }),
  })

  it('refuses two commands with the same name', () => {
    // Silently keeping one means the other never runs and nothing reports it.
    expect(() => createTowerBot({ commands: [echo('a', '1'), echo('a', '2')] }))
      .toThrow(/Duplicate bot command/)
  })

  it('answers rather than throwing for an unknown command', async () => {
    const bot = createTowerBot({ commands: [echo('a', '1')] })
    const reply = await bot.run('nope', { args: {} })
    expect(reply.isError).toBe(true)
  })

  it('turns a thrown command into an error reply', async () => {
    /*
     * A gateway handler that throws leaves the person who asked watching a spinner until
     * the interaction times out, with nothing logged where they can see it.
     */
    const bot = createTowerBot({
      commands: [{
        name: 'boom',
        description: 'throws',
        options: [],
        run: () => { throw new Error('kaboom') },
      }],
    })
    const reply = await bot.run('boom', { args: {} })
    expect(reply.isError).toBe(true)
    expect(reply.description).toMatch(/kaboom/)
  })

  it('coerces the strings a gateway hands over', async () => {
    const seen: unknown[] = []
    const bot = createTowerBot({
      commands: [{
        name: 'types',
        description: 'x',
        options: [
          { name: 'n', description: 'n', type: 'number' },
          { name: 'b', description: 'b', type: 'boolean' },
        ],
        run: ({ args }) => { seen.push(args); return { description: 'ok' } },
      }],
      cacheSize: 0,
    })

    await bot.run('types', { args: { n: '42', b: 'yes' } })
    expect(seen[0]).toEqual({ n: 42, b: true })
  })

  it('leaves an unparseable number undefined so the builder default wins', async () => {
    // Coercing to 0 would look like the user asked for zero.
    const seen: unknown[] = []
    const bot = createTowerBot({
      commands: [{
        name: 'n',
        description: 'x',
        options: [{ name: 'v', description: 'v', type: 'number' }],
        run: ({ args }) => { seen.push(args); return { description: 'ok' } },
      }],
      cacheSize: 0,
    })
    await bot.run('n', { args: { v: 'abc' } })
    expect(seen[0]).toEqual({})
  })

  it('memoises a repeat question, and keeps different arguments apart', async () => {
    let calls = 0
    const bot = createTowerBot({
      commands: [{
        name: 'count',
        description: 'x',
        options: [{ name: 'v', description: 'v', type: 'number' }],
        run: () => { calls += 1; return { description: String(calls) } },
      }],
      cacheSize: 10,
    })

    await bot.run('count', { args: { v: 1 } })
    await bot.run('count', { args: { v: 1 } })
    expect(calls, 'the second identical call should have been served from cache').toBe(1)

    await bot.run('count', { args: { v: 2 } })
    expect(calls, 'different arguments must not share a cache entry').toBe(2)
  })

  it('never caches a command that reads something other than its arguments', async () => {
    let calls = 0
    const bot = createTowerBot({
      commands: [{
        name: 'mysave',
        description: 'x',
        options: [],
        run: () => { calls += 1; return { description: String(calls) } },
      }],
      cacheSize: 10,
    })
    markUncacheable('mysave')

    await bot.run('mysave', { args: {} })
    await bot.run('mysave', { args: {} })
    expect(calls, 'a save-reading command must not be memoised').toBe(2)
  })

  it('never serves one user a reply computed for another', async () => {
    // A per-user command shares a cache key with every other user unless userId opts out.
    let calls = 0
    const bot = createTowerBot({
      commands: [{
        name: 'me',
        description: 'x',
        options: [],
        run: () => { calls += 1; return { description: String(calls) } },
      }],
      cacheSize: 10,
    })

    await bot.run('me', { args: {}, userId: 'alice' })
    await bot.run('me', { args: {}, userId: 'bob' })
    expect(calls).toBe(2)
  })

  it('does not cache an error, so a transient failure is not sticky', async () => {
    let attempt = 0
    const bot = createTowerBot({
      commands: [{
        name: 'flaky',
        description: 'x',
        options: [],
        run: () => {
          attempt += 1
          if (attempt === 1) throw new Error('first time fails')
          return { description: 'recovered' }
        },
      }],
      cacheSize: 10,
    })

    expect((await bot.run('flaky', { args: {} })).isError).toBe(true)
    expect((await bot.run('flaky', { args: {} })).description).toBe('recovered')
  })

  it('ships a help command that lists the real commands', async () => {
    const bot = createTowerBot({ commands: calculatorCommands() })
    const reply = await bot.run('help', { args: {} })
    expect(reply.fields?.length).toBe(CALCULATOR_BUILDERS.length)

    const one = await bot.run('help', { args: { command: 'lab-research' } })
    expect(one.title).toBe('/lab-research')
    expect((one.fields?.length ?? 0)).toBeGreaterThan(0)
  })

  it('leaves help alone when a bot defines its own', () => {
    const bot = createTowerBot({ commands: [echo('help', 'mine')] })
    expect(bot.get('help')?.description).toBe('echo help')
  })
})
