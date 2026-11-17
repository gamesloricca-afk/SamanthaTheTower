<script lang="ts">
	import { sdkFacts, spelled } from '$lib/sdk-facts';
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import { href } from '$lib/paths';
</script>

<h1 class="text-3xl font-semibold">Discord Bots</h1>
<p class="mt-3 text-muted">
	Every <a href={href('/docs/builders/')}>builder</a> is already a command.
	<code>thetowersdk/bot</code>
	turns the {spelled(sdkFacts.builders)} builders into {spelled(sdkFacts.builders)} commands with their
	options declared, runs them, and returns a reply shaped like an embed — title, description, fields.
	Nothing here talks to Discord, so the same commands serve a Discord bot, a Slack app, or an HTTP endpoint.
</p>

<h2 class="mt-10 text-xl font-semibold">The Commands</h2>
<div class="mt-4">
	<CodeBlock
		code={`import { calculatorCommands } from 'thetowersdk/bot'

const commands = calculatorCommands()
console.log(commands.length)   // 15

console.log(commands.map((command) => command.name))
// ['assist-stones', 'bot-upgrade', 'economy-coins-per-kill', 'damage-reduction',
//  'dissonance-boost', 'drops-enemy', 'enemy-wave', 'guardian-upgrade',
//  'uw-inner-land-mines', 'lab-research', 'module-cost', 'thorns-damage',
//  'uw-stones', 'uptime-ratio', 'workshop-upgrade']`}
	/>
</div>
<p class="mt-3 text-muted">
	Each command carries a <code>name</code>, a <code>description</code>, its
	<code>options</code>, and a <code>run</code> function. The options are the builder's own fields, already
	converted to the shape a command registration expects.
</p>
<div class="mt-4">
	<CodeBlock
		code={`const uptime = commands.find((command) => command.name === 'uptime-ratio')

console.log(uptime.description)
// 'What share of the time an ultimate weapon is active, from its duration and cooldown.'

console.log(uptime.options)
// [ { name: 'durationSeconds', description: 'Duration', type: 'number', min: 0 },
//   { name: 'cooldownSeconds', description: 'Measured from activation, so duration ≥
//     cooldown means permanent uptime.', type: 'number', min: 0 } ]`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Run One</h2>
<p class="mt-3 text-muted">
	<code>run</code> takes a context object with an <code>args</code> record, and returns a reply ready
	to send.
</p>
<div class="mt-4">
	<CodeBlock
		code={`const reply = await uptime.run({
  args: { durationSeconds: 23, cooldownSeconds: 220 }
})

console.log(reply)
// {
//   title: 'Ability uptime',
//   description: 'What share of the time an ultimate weapon is active, …',
//   fields: [
//     { name: 'Ratio', value: '0.1045', inline: true },
//     { name: 'Percent', value: '10.4545', inline: true },
//     { name: 'Permanent', value: 'no', inline: true },
//     { name: 'Downtime Seconds', value: '197', inline: true }
//   ],
//   notes: []
// }`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Build The Bot</h2>
<p class="mt-3 text-muted">
	<code>createTowerBot</code> takes the commands and gives you one place to look them up and run
	them. It adds a <code>help</code> command listing everything it knows, and caches replies — commands
	are pure functions of their arguments, so the same question returns the same answer.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { createTowerBot, calculatorCommands } from 'thetowersdk/bot'

const bot = createTowerBot({ commands: calculatorCommands() })

console.log(bot.commands.length)   // ${sdkFacts.builders + 1} — the ${spelled(sdkFacts.builders)} builders plus help

const reply = await bot.run('uptime-ratio', {
  args: { durationSeconds: 23, cooldownSeconds: 220 }
})

const help = await bot.run('help', { args: {} })
// { title: 'Commands', fields: [ { name: '/assist-stones', value: '…' }, … ] }`}
	/>
</div>
<p class="mt-3 text-muted">
	<code>bot.commands</code> is a property, not a method. <code>bot.get(name)</code> returns one
	command or <code>undefined</code>, which is the check to make before running whatever a user
	typed.
</p>

<h2 class="mt-10 text-xl font-semibold">Arguments Arrive As Strings</h2>
<p class="mt-3 text-muted">
	Chat platforms hand over text. The bot coerces each argument to the type its option declares, so
	you can pass what the platform gave you without parsing it first.
</p>
<div class="mt-4">
	<CodeBlock
		code={`// Both of these produce the same reply.
await bot.run('uptime-ratio', { args: { durationSeconds: 23, cooldownSeconds: 220 } })
await bot.run('uptime-ratio', { args: { durationSeconds: '23', cooldownSeconds: '220' } })`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Register With Discord</h2>
<p class="mt-3 text-muted">
	The command list is data, so registering is a map from the SDK's option shape to the library's.
	This is the whole integration for discord.js.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { SlashCommandBuilder } from 'discord.js'
import { createTowerBot, calculatorCommands } from 'thetowersdk/bot'

const bot = createTowerBot({ commands: calculatorCommands() })

const slashCommands = bot.commands.map((command) => {
  const builder = new SlashCommandBuilder()
    .setName(command.name)
    .setDescription(command.description.slice(0, 100))

  for (const option of command.options ?? []) {
    const describe = (input) =>
      input.setName(option.name.toLowerCase()).setDescription(option.description.slice(0, 100))

    if (option.type === 'number') builder.addNumberOption(describe)
    else builder.addStringOption(describe)
  }

  return builder.toJSON()
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const args = Object.fromEntries(
    interaction.options.data.map((option) => [option.name, option.value])
  )

  const reply = await bot.run(interaction.commandName, {
    args,
    userId: interaction.user.id
  })

  await interaction.reply({ embeds: [reply] })
})`}
	/>
</div>
<p class="mt-3 text-muted">
	The reply's <code>title</code>, <code>description</code> and <code>fields</code> already match
	Discord's embed shape, so it can go straight into <code>embeds</code>.
</p>

<h2 class="mt-10 text-xl font-semibold">Add Your Own Command</h2>
<p class="mt-3 text-muted">
	A command is a plain object, so anything you can compute can join the same list — and appears in
	<code>help</code> alongside the rest.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { createTowerBot, calculatorCommands, markUncacheable } from 'thetowersdk/bot'
import { searchPatchNotes } from 'thetowersdk/knowledge'

const whenChanged = {
  name: 'when-changed',
  description: 'The most recent patch notes mentioning a mechanic.',
  options: [{ name: 'mechanic', description: 'What to search for', type: 'string' }],

  run({ args }) {
    const notes = searchPatchNotes(String(args.mechanic ?? ''), 5)
    return {
      title: \`Patch notes: \${args.mechanic}\`,
      fields: notes.map((note) => ({
        name: \`\${note.postedAt.slice(0, 10)} \${note.version ?? ''}\`.trim(),
        value: note.title
      }))
    }
  }
}

const bot = createTowerBot({ commands: [...calculatorCommands(), whenChanged] })`}
	/>
</div>
<p class="mt-3 text-muted">
	Replies are cached by command and arguments. If a command reads a save, a spreadsheet or a
	database, call <code>markUncacheable('your-command')</code> so each invocation runs fresh.
</p>

<p class="mt-8 text-sm">
	<a href={href('/docs/builders/')}>Builders →</a>
	·
	<a href={href('/docs/patch-notes/')}>Patch Notes →</a>
	·
	<a href={href('/docs/charts/')}>Charts →</a>
</p>
