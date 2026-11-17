# Building a bot on this SDK

A Tower bot answers the same few hundred questions over and over, from data that does not
change between releases. Almost everything that makes one feel fast follows from taking that
seriously, and almost everything that makes one feel slow comes from doing per-request what
could have been done once.

[`templates/bot-starter.ts`](../templates/bot-starter.ts) is a complete working bot. This
explains why it is shaped the way it is.

```bash
npm run bot:demo                                          # list the commands
npm run bot:demo -- lab-research labName=Damage targetLevel=10
npm run bot:test                                          # the registry's own tests
```

---

## The shape

```
gateway adapter  ──▶  TowerBot registry  ──▶  commands  ──▶  thetowersdk
(discord.js)          dispatch, coerce,       pure where      builders,
                      cache, errors           they can be     mechanics, data
```

Three properties matter, and they all come from the same decision — **commands do not know
what a gateway is**:

- a command is a function from named arguments to a reply, so it runs at full speed in a
  test and you can prove behaviour without a network;
- a command that cannot reach the gateway cannot accidentally await it, which is the usual
  reason a bot gets mysteriously slow under load;
- swapping library, or adding a CLI or an HTTP endpoint alongside Discord, is an adapter and
  not a rewrite.

```ts
import { calculatorCommands, createTowerBot } from 'thetowersdk/bot'

export const bot = createTowerBot({
  commands: [...calculatorCommands(), myOwnCommand],
  cacheSize: 200,
})
```

`calculatorCommands()` turns every builder in the SDK into a command — options, parsing,
formatting and all — because each builder already describes its own inputs. A builder added
to the SDK later shows up in your bot without you editing anything.

---

## Performance

### Load catalogs once, at module scope

The game data is static. Build your indexes at import time, not inside a handler:

```ts
// module scope — paid once, when the process starts
const LAB_INDEX = new Map(getSharedToolLabs().map(lab => [lab.name.toLowerCase(), lab]))

run({ args }) {
  const lab = LAB_INDEX.get(String(args.name).toLowerCase())   // a hash lookup
}
```

This is worth more than it looks. `getSharedToolLabs()` used to rebuild all 225 lab records
on every call — half a millisecond each — and helpers that resolved one lab per level turned
a cost table into seconds of pure lookup. It is cached now, but a `.find()` over a few
hundred entries inside a per-level loop is the same mistake one layer up. Index once.

### Let the registry memoise

Every builder is a pure function of its arguments, so the same question always has the same
answer:

```ts
createTowerBot({ commands, cacheSize: 200 })
```

Repeat calls are served from the cache — five hundred of them in about a millisecond. Two
rules keep that correct:

- **Mark anything impure.** A command that reads a save, a sheet or a database is not a
  function of its arguments. `markUncacheable('import-save')`, or one person's numbers will
  be shown to the next person who asks.
- **Per-user commands opt out automatically.** Passing `userId` in the context skips the
  cache, because a reply computed for one account must never be handed to another.

Errors are never cached, so a transient failure does not stick.

### Do the slow things off the request

Network calls — a sheet read, a wiki fetch, a database query — do not belong inline in a
command that people wait on. Refresh them on a timer into memory and have the command read
the memory:

```ts
let roster: Roster = EMPTY
setInterval(async () => { roster = await loadRosterFromSheet() }, 5 * 60_000)
```

A command then answers instantly and, importantly, answers *at all* when the sheet is
briefly unavailable. If you must fetch inline, defer the reply first — most gateways give
you three seconds before the interaction expires.

### Keep replies bounded

A result with a `levels` array can have hundreds of rows. `calculatorCommand` caps displayed
fields and summarises row lists rather than dumping them, because a reply that exceeds an
embed limit fails at send time — after the work is done, and usually only for the accounts
with the biggest numbers.

### Measure the calculation, not the round trip

Because commands are pure functions, a benchmark is a loop:

```ts
const started = Date.now()
for (let i = 0; i < 1000; i += 1) await bot.run('lab-research', { args })
```

If that is fast and your bot is slow, the problem is in the adapter or the gateway, and no
amount of tuning the calculator will help.

---

## Correctness

### Always render `notes`

Every calculator result carries `notes`, and they are the difference between a number and an
answer. A clamped level, a lab that priced nothing, an input the command could not offer —
all of it arrives there.

```ts
for (const note of reply.notes ?? []) lines.push(`note: ${note}`)
```

Dropping them shows someone a smaller number with no explanation. This is the single easiest
way to make a correct SDK produce a misleading bot.

### Do not trust an argument because it was typed

Gateways hand over strings, and users type anything. The registry coerces against the
options each command declared and drops what was not declared — but inside your own command,
a name from a user is not a key you can index a record with:

```ts
BY_NAME[userInput]              // 'constructor' -> the Object function, and ?? will not catch it
ownLookup(BY_NAME, userInput)   // undefined
```

### Say what you could not do

"Not found" without the search term sends people round in circles. A level past a table's end
is not free, it does not exist:

```ts
return { description: `Level ${level} is not charted. This lab goes up to ${max}.`, isError: true }
```

---

## Wiring it to Discord

The adapter is the only part that knows about the gateway, and it stays small:

```ts
import { REST, Routes, Client, GatewayIntentBits } from 'discord.js'
import { bot } from './bot-starter'

// Registering: the SDK's option shape maps straight onto Discord's.
const body = bot.commands.map(command => ({
  name: command.name,
  description: command.description.slice(0, 100),   // Discord's limit
  options: command.options.map(option => ({
    name: option.name,
    description: option.description.slice(0, 100),
    type: option.type === 'number' ? 10 : option.type === 'boolean' ? 5 : 3,
    required: option.required ?? false,
    choices: option.choices?.slice(0, 25),          // Discord's limit
  })),
}))

await new REST().setToken(TOKEN).put(
  Routes.applicationGuildCommands(APP_ID, DEV_GUILD_ID),  // guild: instant; global: up to an hour
  { body },
)

// Dispatching.
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return

  const args: Record<string, string | number | boolean> = {}
  for (const option of interaction.options.data) {
    if (option.value !== undefined) args[option.name] = option.value as string | number | boolean
  }

  const reply = await bot.run(interaction.commandName, { args, userId: interaction.user.id })
  await interaction.reply({ embeds: [toEmbed(reply)] })
})
```

`bot.run` never throws — an unknown command, a bad argument or a command that blew up all
come back as a reply with `isError`. That matters here specifically: a handler that throws
leaves the person who asked watching a spinner until the interaction times out, with the
failure visible only in your logs.

Two limits worth knowing before you hit them: descriptions are capped at 100 characters, and
an option may have at most 25 choices. Slice rather than let the registration call fail.

---

## Secrets

Everything sensitive lives in the environment; see
[`templates/.env.example`](../templates/.env.example).

- `DISCORD_TOKEN` controls the bot. Anyone holding it *is* the bot.
- `GOOGLE_APPLICATION_CREDENTIALS` points at a key that opens every sheet the service
  account can see — [`GOOGLE_SHEETS.md`](GOOGLE_SHEETS.md) covers rotation.
- If a token leaks, reset it in the Discord developer portal. Removing it from a file does
  nothing; the old token stays valid until it is reset.

---

## Architecture, from three bots in production

The a caller runs three Discord bots on this package, and the rules that came out of
getting that wrong first — one router, component ids with a single owner, interactions that
check both the component id *and* the initiating user, guarding session tokens before
touching state — are in the README under
[Building a Bot On This](../README.md#building-a-bot-on-this). They are not repeated here;
they are not Discord-specific, and they matter more than anything on this page once a bot
has more than one person using it.

---

## See also

- [`templates/bot-starter.ts`](../templates/bot-starter.ts) — the whole bot, runnable
- [`examples/09-build-a-bot.ts`](../examples/09-build-a-bot.ts) — the ten-line version
- [`GOOGLE_SHEETS.md`](GOOGLE_SHEETS.md) — service accounts and sheet access
- [`../README.md`](../README.md) — the builders each command is generated from
