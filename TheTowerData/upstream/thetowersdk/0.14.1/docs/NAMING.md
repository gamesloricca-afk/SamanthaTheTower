# Naming

One rule per idea, applied the same way in every domain. This exists because the SDK grew four
different words for "fetch a value" and names like
`computeChainThunderReductionFractionFromAccumulated` (51 characters), and a reader cannot tell from
`resolveX` and `getX` whether one of them costs more than the other.

## Verbs

Pick by **what the call does**, not by which word sounds better. Every exported function starts with
exactly one of these.

| Verb | Means | Returns |
|---|---|---|
| `get` | direct lookup, no work worth thinking about | the value |
| `find` | a search that can come up empty | `T \| undefined` |
| `is` / `has` | a question | `boolean` |
| `list` | everything of a kind | `T[]` |
| `build` | assemble a new object or collection | the new thing |
| `read` | pull structure out of a save or file | `T \| null`, plus `warnings` |
| `parse` | text to structure | `T \| null` |
| `format` | value to text for a human | `string` |
| `to` | a total conversion between two shapes | the other shape |
| `compute` | real calculation, formulas, iteration | a number or record |
| `sum` / `count` / `clamp` | exactly what they say | a number |
| `apply` | fold a change into existing state | the updated state |
| `normalize` | coerce ragged input into the canonical shape | the canonical shape |

Retired, and what replaced them:

- `resolve*` — meant lookup, computation and coercion in different files. Use `get`, `find` or
  `compute`.
- `calculate*` — the same as `compute`. Use `compute`.
- `create*` / `make*` — the same as `build`. Use `build`, **except when the call actually creates a
  record in a remote system.** `createOrUpdateDocument` and `createOrUpdateCloudDocument` write to
  Appwrite, and `build` promises a pure value you can throw away. Those keep `create`. This is the
  one place the verb table bends, and it bent because a codemod renamed all three and the failing
  test was the only thing that noticed.
- `derive*` / `extract*` — the same as `read` when the source is a save. Use `read`.

## Shape

```
verb + subject + qualifier?
```

- **Say the subject once.** `formatWorkshopCategoryFilterOptionLabel` says four kinds of thing
  and returns one string; `buildWorkshopFilterLabel` is the same function.
- **Drop the preposition tail.** `FromSaveRoot`, `FromSettings`, `FromAccumulated` describe the
  parameter, and the parameter is right there in the signature. Keep it only where two functions
  genuinely differ by source: `readLabsFromSave` beside `readLabsFromReport`.
- **Aim for four words, hard-stop at five.** Anything longer is a sign the function does more than
  one thing.
- **No abbreviations except the game's own.** `ILM`, `UW`, `BC` and `GT` are what the game calls
  them; `redux`, `cfg` and `calc` are not words.

## Constants

`SCREAMING_SNAKE_CASE`, grouped by the domain first so related constants sort together:

```
WAVE_INFO_BOSS_HP_DIVISOR        not  BOSS_HP_DIVISOR_WAVE_INFO
LAB_CATALOG                      not  CATALOG_OF_LABS
```

## Per-domain consistency

The same concept keeps the same word everywhere. A lab's ceiling is `levelMax` in every file that
has one — not `maxLevel` in one module and `levelCap` in the next. Where the game has a word,
the game wins.

| Concept | Name |
|---|---|
| a lab, workshop stat or module's ceiling | `levelMax` |
| a cost in coins | `cost`, always absolute coins |
| a duration on a data row | `duration`, a string the game's format |
| the position a thing occupies in the save | `saveIndex` |
| the catalog key | `slug` |
| what a human sees | `displayName` |

## Changing a name

The SDK is published. A rename is a breaking change for anyone using it, so it is a minor bump under
0.x and it goes in the changelog — not a quiet edit. Rename in one commit per group, with the
consumers updated in the same commit, so the tree never sits in a state where half the callers use
the old name.
