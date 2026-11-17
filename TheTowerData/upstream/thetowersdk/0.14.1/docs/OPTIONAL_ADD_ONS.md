# Optional add-ons

Two packages sit alongside this SDK. Neither is a dependency of it and neither is bundled:
install one when you want what it does, and the SDK works exactly the same if you never do.

| Package | What it adds | Install |
|---|---|---|
| [`towerai`](https://www.npmjs.com/package/towerai) | A knowledge base and an answering layer over the SDK's data | `npm install towerai` |
| [`adb-bridge`](https://www.npmjs.com/package/adb-bridge) | Pulls a save off an Android device and serves it to a local page | `npx adb-bridge` |

They are separate on purpose. `towerai` carries a knowledge corpus and `adb-bridge` is a
local program that talks to your phone — neither belongs inside a package whose whole
premise is that it is small, pure and runs in a browser. What the SDK guarantees is that
they fit: the data shapes line up, the entry points do not collide, and nothing here has to
change when you add one.

---

# TowerAI

TowerAI answers questions about the game. The SDK gives it the numbers; TowerAI adds the
corpus of prose that explains what they mean, and a retrieval layer over it.

```bash
npm install towerai
```

| Import | Contains |
|---|---|
| `towerai/kb` | The knowledge base — chunks, validation, versioning |
| `towerai/core` | The answering layer, aliases and action contracts |
| `towerai/tools` | The packaged tool registry — charts, calculators |
| `towerai/game-data` | Game data shaped for retrieval |

## Using the shipped knowledge base

```ts
import {
  buildTrackerAiCanonicalKbChunks,
  buildCanonicalKbVersion,
  validateCanonicalKbArray,
} from 'towerai/kb'

const knowledgeBase = buildTrackerAiCanonicalKbChunks()

validateCanonicalKbArray(knowledgeBase)
console.log(buildCanonicalKbVersion(knowledgeBase), knowledgeBase.length, 'chunks')
```

`validateCanonicalKbArray` tells you what is malformed **now** rather than failing at query
time, which matters more than it sounds: a chunk with a missing `topic` does not error when
you build the base, it just never gets retrieved, and a knowledge base that quietly answers
nothing looks identical to one that has nothing to say.

## Curating your own

A chunk is a small, self-contained answer with enough metadata to be found. The required
fields:

```ts
{
  chunk_type: 'atomic',        // or 'relational', for a chunk about how two things interact
  chunk_id: 'lab_cost_damage', // stable and unique — it is the identity, not a label
  kb_version: '...',           // from buildCanonicalKbVersion
  source: 'My Notes',
  section: 'Labs',
  topic: 'Damage lab cost',
  title: 'Damage lab cost',
  disambiguation: 'Cost to max this lab, not research order.',
  content: 'The Damage lab has 100 levels …',
  mechanics: ['Damage'],
}
```

**`disambiguation` is the field that earns its keep.** Retrieval finds chunks that look
relevant, and "Damage lab cost" and "damage lab research order" look equally relevant to a
question about damage labs. The disambiguation is what stops the wrong one being used to
answer confidently.

### Derive the numbers; do not type them

This is the whole reason the two packages are worth using together:

```ts
import { LAB_CATALOG } from 'thetowersdk/data'

const mine = LAB_CATALOG.map(lab => ({
  chunk_type: 'atomic' as const,
  chunk_id: `lab_cost_${lab.name}`,
  source: 'My Notes',
  section: 'Labs',
  topic: `${lab.name} cost`,
  title: `${lab.name} cost`,
  disambiguation: 'Cost to max this lab, not research order.',
  mechanics: [lab.name],
  tags: ['labs', lab.name.toLowerCase()],
  // The number comes from the catalog, so the prose cannot go stale.
  content: `${lab.name} has ${lab.levels?.length ?? 0} levels.`,
}))
```

A hand-typed "the Damage lab has 100 levels" is correct until a game update, and then it is
wrong and nothing reports it — the chunk still retrieves, still reads plausibly, and is
simply false. Generating the sentence from `LAB_CATALOG` means the corpus moves when the
catalog does.

The same applies to anything the SDK already knows: costs, caps, level counts, stat names.
Write prose about *meaning*, and interpolate *numbers*.

### Extending the shipped base rather than replacing it

```ts
const knowledgeBase = [...buildTrackerAiCanonicalKbChunks(), ...mine]
validateCanonicalKbArray(knowledgeBase)
```

Prefix your `chunk_id`s (`mine_…`) so a collision with a future shipped chunk is impossible.
Two chunks with the same id is not an error — one silently wins, and which one depends on
ordering.

### Keeping it honest

The SDK's own knowledge graph (`thetowersdk/knowledge`) takes the harder line: every
objective claim carries a machine-checkable assertion, and a test compares the asserted
value against the code that implements it. If your corpus makes claims that matter, do the
same — put the number in an assertion and test it against `thetowersdk/data`, rather than
leaving it in a sentence nothing can check. See
[`../src/knowledge/sheets-claims.test.ts`](../src/knowledge/sheets-claims.test.ts) for the
pattern.

---

# adb-bridge

A save file lives on the device. `adb-bridge` is a small local program that pulls it over
ADB and serves the bytes to a page running in your browser, over a WebSocket on loopback.

```bash
npx adb-bridge
```

It installs Google's official platform-tools if you do not have them, pulls only, never
writes to the device, and does not require root. Nothing leaves the machine except to the
local port your page connects to.

**One bridge, many games.** It was once `tracker-bridge`, one install per game; it is now
`adb-bridge`, serving several from one install. The old package still forwards to it, so
existing instructions keep working.

## Connecting from a page

```ts
const BRIDGE_PORT = 43781
const MIN_PROTOCOL = 1

const socket = new WebSocket(`ws://127.0.0.1:${BRIDGE_PORT}`)
```

Three things about that are not obvious, and each of them cost a real debugging session:

**Gate on the protocol, never the version.** The bridge reports both. The release number is
not a compatibility contract and cannot be one across a rename: `tracker-bridge` was on 1.x,
`adb-bridge` restarted at 0.x, so a check of `0.2.1 >= 1.4.0` reported a perfectly good
bridge as too old. `BRIDGE_PROTOCOL_VERSION` moves only when the wire format changes in a
way an older page cannot handle, so ordinary releases never touch it.

```ts
if ((handshake.protocol ?? 0) < MIN_PROTOCOL) { /* genuinely too old */ }
```

**Try both loopback spellings.** `localhost` and `127.0.0.1` are not interchangeable for a
WebSocket: browsers block some cross-spelling connections, and which one works depends on
how the page itself was served. Prefer the spelling the page is on, then fall back to the
other.

**A page on `https://` cannot open `ws://`.** Mixed content is blocked, and modern browsers
additionally gate a public page reaching a private address behind Private Network Access.
Serving the page over plain HTTP on loopback during development, or proxying the socket
through your dev server on the same origin, avoids both.

## The message shape

Requests are `{ type: '…' }` and replies name their own type, so a caller waits for the
reply it expects rather than the next message that arrives:

```ts
socket.send(JSON.stringify({ type: 'PING' }))        // -> PONG
socket.send(JSON.stringify({ type: 'LINK_ACCOUNT', … }))  // -> ACCOUNT_LINKED
```

## Handing the bytes to the SDK

The bridge gives you the save file; the SDK reads it. That is the entire integration:

```ts
import { decodePlayerInfoSaveBytes } from 'thetowersdk/node'
import { readBotsFromSaveRoot } from 'thetowersdk/save'

const decoded = decodePlayerInfoSaveBytes(bytes)
const bots = readBotsFromSaveRoot(decoded.parsedRoot)
```

Extractors return `null` and report `warnings` rather than throwing, which is what you want
behind a bridge: a save from an older client version should degrade to "this part could not
be read", not take the page down.

---

## See also

- [`SAVE_FILES.md`](../README.md#reading-a-save) — what a decoded save contains
- [`BUILDING_A_BOT.md`](BUILDING_A_BOT.md) — where a save read belongs in a bot
- [`DESKTOP_AND_MOBILE.md`](DESKTOP_AND_MOBILE.md) — shipping this as an app, where the
  bridge runs **inside** the process rather than as a program the user has to install and
  keep running. That is the main practical reason to ship a desktop build.
