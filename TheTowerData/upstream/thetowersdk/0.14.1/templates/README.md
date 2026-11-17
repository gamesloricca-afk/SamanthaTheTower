# Templates

Starting points to copy into your own project, rather than scripts to read. Each is complete,
type-checked against the package source, and commented where the shape of the SDK is easy to
get wrong.

| File | For | Runtime |
|---|---|---|
| [`save-cli.ts`](save-cli.ts) | A command-line tool that reads a player's save | Node |
| [`browser-widget.ts`](browser-widget.ts) | A UI module with no Node built-ins anywhere | Browser |
| [`calculator.ts`](calculator.ts) | A calculator: typed input, pure compute, separate formatting | Either |
| [`bot-starter.ts`](bot-starter.ts) | A complete bot: every calculator, a hand-written command, a CLI | Node |
| [`sheets-client.ts`](sheets-client.ts) | The googleapis adapter for `thetowersdk/sheets` | Node |
| [`.env.example`](.env.example) | Every variable a bot or sheet client needs, with the warnings | — |

## The three things they encode

**Decode once.** `decodePlayerInfoSaveBytes` is the only step that needs Node. The save root it
returns is a plain object that extractors read and never mutate, so run as many as you like over
one root.

**Only `thetowersdk/node` needs Node.** `data`, `save`, `formatting`, `mechanics`, `wiki`,
`charts`, `knowledge` and `inputs` are all browser-safe. A widget that never opens an official game export
never imports the decoder — that is why `browser-widget.ts` exists as a separate file.

**Say what you could not do.** Extractors return `null` for features a save predates and carry a
`warnings` array; `calculator.ts` returns a `notes` array for the same reason. A planner that
silently returns `0` for an unknown lab is worse than one that says it does not know the lab.

## Two traps these avoid

- **Durations are text, and not all one shape.** Most catalog rows are `"HH:MM:SS"` with hours
  running past 24 (`"500:00:00"`), but some are `"0s"`. Use `parseDurationToHours`; splitting on
  `":"` yourself returns `NaN` on the `"0s"` rows and poisons the whole sum.
- **Format with the game's ladder.** If your tool prints `1.4e21` where the game prints `1.4s`,
  a player cannot check your answer against their screen — and that is the only way they can
  trust it. `formatLargeNumber` and `parseResource` round-trip.
