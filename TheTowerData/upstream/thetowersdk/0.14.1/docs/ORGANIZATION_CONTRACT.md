# The Organization Contract

**This is not advice. `npm run lint:organization` fails on every rule below, and it runs in `npm run verify`.**

This document exists because the package drifted. Not in one bad decision — in a hundred small ones,
each defensible on its own, which together produced a tree only its author could navigate: a
`mechanics/` folder holding one file next to one holding forty-six, three different names for the
same idea, and 30,470 lines of one website's plumbing shipped to the public as `thetowersdk/internal/*`.

Every rule here is written against a specific thing that actually went wrong.

---

## Rule 0 — The question that decides everything

> **Does this describe The Tower, or does it describe a program that uses The Tower?**

The Tower belongs here. A program that uses it does not.

This package answers questions about the game: what is in it, how its numbers behave, what a save
file contains. It does not know that anyone is building a website, a bot, or a spreadsheet, and it
must not be able to tell.

**A consumer builds their own platform layer on top of this package. So does its author.** The
`@tmrxjd/platform` package in this repository is that layer, and it is not special — it is exactly
what the README tells every other user to write. If something belongs in one user's platform layer,
it belongs in all of them, which means it does not belong here.

### The test, applied

| Belongs here | Belongs in a platform layer |
|---|---|
| The coin cost of lab level 47 | Which labs a user has favourited |
| How bot range scales with tower range | Which bot tab is open |
| The fields a `playerInfo.dat` contains | Which of those fields a site stores in its database |
| That Attack Speed has 300 levels | A dropdown of those 300 levels, with labels |
| The formula behind a damage number | The persisted settings blob that fed it |
| That relics grant Lab Speed | A cross-page hub that syncs Lab Speed between two views |

The right-hand column is not lesser work. It is *different* work, and mixing the two is what made
this package impossible to read.

### Forbidden outright, anywhere in `src/`

These are the shapes application state actually took here. Each is banned by name because each one
got in:

- **Persisted settings** — `normalize*Settings`, `default*Settings`, `*SettingsSchema`, and the same
  under `Preferences`, anything built to survive a page reload. The perk preferences a site's input
  hub stores sat in `save/perks` under that second word until the rule learned it.
- **A cross-page input hub** — `sharedToolInputs`, `overlayShared*`, `syncUptime*`, `hubLevels`.
  Two views agreeing about a number is an application concern.
- **UI option builders** — dropdown items, select options, labels, colours, icons.
- **UI control state** — sort keys, filter keys, active tabs, collapsed sections, column choices,
  presets.
- **Import orchestration for someone's storage** — planners, executors, skip reasons, "which
  trackers to import".
- **Local per-calculator state** — the shape a page keeps while a user types.
- **Any route, URL, icon name, or colour token.**

If a game fact is genuinely needed to build one of those, this package exports the *fact*, and the
platform layer builds the control.

---

## Rule 1 — There is no `internal/`

`internal/` was where things went when nobody wanted to decide. It grew to 72 files and 14,596
lines, **and it was publicly exported**: `"./internal/*"` in the exports map meant every consumer
could import this site's dropdown math. A private folder that ships is not private; it is a second,
undocumented public API.

There is no folder whose name means "not really part of this package". Either a module belongs to a
domain, or it belongs in the platform layer.

Shared helpers with no domain of their own live in `src/support/`. It has no public subpath and
holds only framework-free utilities with no game knowledge or application knowledge, capped at ten
files. The root explicitly exports `atIndex`, `hasOwnKey`, `ownLookup` and `ownLookupOr` so consumers
can apply the same record-access guarantees. Other support helpers remain private. If the folder
grows past ten files, something in it has a domain and should move to it.

---

## Rule 2 — The domains, and what may import what

Exactly these top-level domains exist. Adding one is a change to this document.

| Domain | Answers | May import |
|---|---|---|
| `formatting/` | How is a number written and read? | `support/` |
| `data/` | What is in the game? | `support/` |
| `mechanics/` | How do the game's numbers behave? | `data/`, `formatting/`, `support/` |
| `save/` | What is in a save file? | `data/`, `mechanics/`, `formatting/`, `support/` |
| `knowledge/` | What is known about the game, in prose? | `data/`, `support/` |
| `builders/` `calculators/` `charts/` `wiki/` `bot/` `sheets/` `node/` `assets/` | Ready-made things built from the above | any of the above |

Generated files obey this rule like any other. Being generated excuses a file's length, never its
direction: the calculator manifest was generated, lived in `mechanics/`, and imported every tier
above it.

Dependencies run **one way, down the table**. `data/` importing `mechanics/` is a contract
violation, not a design choice: the catalogs are what the formulas are *about*, and a catalog that
needs a formula to describe itself is a formula wearing a catalog's name.

`knowledge/` is prose and may name anything, but **nothing may import `knowledge/`**. A formula that
needs the knowledge graph to compute is not a formula.

---

## Rule 3 — Every domain has the same shape

```
<domain>/
  index.ts        the domain's public surface — required, and the only thing outside it may import
  MAP.md          generated by `npm run map` — required
  <subdomain>/    a folder per subject, same shape recursively
    index.ts
    MAP.md
    <module>.ts
```

**No loose files at a domain root except `index.ts`** — unless the domain declares itself flat. `data/` had twenty, including
`player-stats.ts` at 8,159 lines sitting beside a 24-line `campaign-tier.ts`, and nothing about the
folder said which of them was a subject and which was a stray thought. Every module belongs to a
subdomain; a subject with one module still gets a folder, because the alternative is deciding case
by case, and that is the decision that produced this.

### A domain may declare itself flat

A domain whose modules are genuinely PEERS — the same kind of thing, at comparable size — is
readable flat, and subdividing it invents groupings that later drift. `builders/` is the case:
fifteen builders between 90 and 242 lines, one per thing built, with `types.ts` already separate.

To be flat, a domain's `index.ts` must contain the line:

```
This domain is flat: <why its modules are peers>
```

The checker requires that sentence and reports the domain otherwise. An exception nobody had to
argue for is an exception nobody reads, which is the same reason `ALLOWED_CLASSES` carries a reason
per entry.

This does NOT cover `data/`, and the distinction is the point: twenty modules ranging from 24 lines
to 8,159 are not peers, and no sentence would make them so.

**A subdomain holds at most 12 modules.** Above twelve it is more than one subject — split it.
`mechanics/effective-paths/` holds 46 files, which is not a subject anybody chose.

There is deliberately **no lower bound**. An earlier draft of this rule said "below two, merge it
upward", which contradicted the paragraph above it in the same section — one says every subject gets
a folder even with a single module, the other says a single module is not a subject. The checker
found the contradiction the first time a domain was brought into shape: `formatting/duration` is
one subject and one file, and it is correct as it stands. Whether something is a subject is a
judgement a line count cannot make, so the mechanical rule keeps only the half that can be counted.

---

## Rule 4 — Names say what the thing is, once

- **A file never repeats its folder.** `data/labs/labs.ts` is `data/labs/overview.ts`.
  `mechanics/bots/bot-overlap.ts` is `mechanics/bots/overlap.ts`. The path is the name; saying it
  twice is noise that then gets abbreviated inconsistently, which is how `uw`, `ultimate-weapons`
  and `ultimateWeapon` all came to be the same thing.
- **`kebab-case.ts` for files, one subject per file.**
- **A lookup says it is one.** `X_BY_Y` for a map keyed by `Y`. A plural name is a list, not a map:
  `LAB_NAMES` is an array, `LAB_NAME_BY_SLUG` is a record. This rule already has a test
  (`names-say-their-shape.test.ts`) because the package shipped `DAMAGE_SUBSTATS` as a record.
- **No abbreviations outside the game's own vocabulary.** The game says `UW`, so `UW` is allowed;
  nobody says `epaths`, so it is `effective-paths` everywhere or it is nothing.
- **Never a consumer's word.** No `tracker`, no `site`. Both name one specific website and
  neither means anything to a reader who has not seen it — `SITE_LAB_SLUG_ALIASES` and
  `findSiteLabSlugForSaveIndex` are in `data/` today, aliasing lab slugs to what one app calls them.
  `page`, `app` and `store` are NOT banned: a wiki page is a real thing the game has
  (`fetchFandomPageAsMarkdown`), `itemsPerPage` is API pagination, and a data store is a data
  store. Banning a word that has honest uses trains everyone to ignore the rule. What a UI page
  *holds* is still forbidden by Rule 0 — it is the state that is out, not the noun.

---

## Rule 5 — Every file explains itself

Two headers, both required, both checked:

1. The generated file-map block (`npm run map`) — exports, dependencies, dependents.
2. **A prose docblock saying what the module is for and why it exists.** 263 of 491 files had none.
   A file with no explanation is one nobody can safely delete, which is why nothing here ever got
   deleted.

The docblock says what the thing is *for*, not what it contains. "Lab cost tables" is the file name
repeated; "the coin and time cost of every research level, which the planner prices upgrades
against" is a reason to keep it.

---

## Rule 6 — A file is at most 500 lines

Nineteen files exceeded 900, up to 9,731. A 9,731-line file is not a module, it is a directory that
never happened.

Generated files are exempt and must be named `*.generated.ts` or live in a `generated/` folder, so
the exemption is visible rather than assumed. Data tables that are genuinely one indivisible table
may exceed the cap **only** as `*.data.ts`, which declares "this is a transcription, not logic".

---

## Rule 7 — The public surface is deliberate

Every entry in `exports` names a domain from Rule 2 and nothing else. No wildcards into the source
tree: `"./internal/*"` is how 14,596 lines of app plumbing became public API without anyone
deciding to publish it.

A domain is exported, or it is not. There is no third state.

---

## Rule 8 — Every domain is composed the same way

Rule 3 fixes the folder shape. This fixes what is *inside* it, because identical shells holding
arbitrary contents is the state the package was already in: `mechanics/cards/` held three files and
`mechanics/effective-paths/` held forty-six, and no two subjects were built the same way.

Every subdomain is made of these parts, and only these:

| File | Holds | Required |
|---|---|---|
| `types.ts` | The subject's vocabulary: exported types, interfaces, enums, branded types | when the subject exports any type |
| `constants.ts` | Fixed values the game defines and nothing computes | when the subject has any |
| `<subject>.ts` | One subject per file — see the per-tier vocabulary below | at least one |
| `index.ts` | The curated surface: what leaves this folder | always |
| `MAP.md` | Generated by `npm run map` | always |

### The five roles

A module is named for the ROLE it plays, and there are five. Two subjects doing the same job are
built from the same parts, so a reader who has understood one domain has understood all of them.

| Role | Holds |
|---|---|
| `types.ts` | The subject's vocabulary: exported types, interfaces, enums, branded types |
| `data.ts` | The catalog rows themselves — or `*.data.ts` / `*.json` for a bulk transcription |
| `compute.ts` | Pure functions over that data. Given inputs, returns a number |
| `derive.ts` | Values computed FROM the data at module load — indexes, reverse maps, totals |
| `validate.ts` | Zod schemas, where untrusted input genuinely arrives. Optional, and rare |

Plus `index.ts` (the curated surface) and `MAP.md` (generated). Nothing else.

**A role that outgrows the 500-line cap becomes a folder of the same name**, one subject per file:
`compute.ts` becomes `compute/overlap.ts`, `compute/range.ts`. The role vocabulary is what stays
predictable; the split is how a large subject stays readable without inventing new words for it.

`derive.ts` and `compute.ts` are not the same thing and the distinction matters: `derive` runs once
and costs every consumer who imports the module, `compute` runs when called and costs only the
caller. A reverse lookup built at load time belongs in `derive`; a price for a given level belongs
in `compute`.

### Rule 8a — Types live in `types.ts`

**No exported `type`, `interface` or `enum` is declared anywhere but `types.ts`.** A type declared
beside the function that happens to return it is invisible to everyone else, so the next module
declares its own, and the same idea ends up with three names. That is how `uw`, `ultimate-weapons`
and `ultimateWeapon` became three spellings of one concept.

Types used only inside one file, and not exported, may stay in that file.

### Rule 8b — One subject, one source of truth

**Two modules may not both be authoritative for the same fact.** `data/workshop/` holds
`costs.ts` with `WSP_*_COSTS` for ten stats, and `table.json` with forty-eight stats whose rows
already carry `cash` and `coins`. Two cost tables for one subject, of different scope, reconciled
by nothing — and two max-level functions to match, one returning `lastIndex + 1` and the other the
raw last key.

That is not a duplicated file, which a diff would catch. It is a duplicated *claim*, and the only
thing that finds those is deciding which one is canonical and deleting the other. When a second
copy genuinely must exist — a transcription kept beside a derived form — the derived one says so in
its docblock and names the source it was derived from.

### Rule 8c — No orchestration, no entities

This package is tables and pure functions, and its structure says so.

- **No use-case or workflow modules.** Multi-step flows belong to the platform layer. A module
  named for a sequence of operations is an application in the wrong repository.
- **No entity classes or value objects.** Nothing here has identity or a lifecycle; a lab is a row,
  not an aggregate. Classes also cost consumers their tree-shaking, and a consumer importing one
  formula should not receive a domain model.
- **Validation is not business logic.** Where a schema is genuinely needed — the save decoder takes
  untrusted bytes — it lives in `schema.ts` beside the subject it validates, and the formulas do
  not import it.

## Rule 9 — A formula where a formula is provable, a table where it is not

A table is a transcription; a formula is an explanation. Prefer the explanation — it is smaller,
it extrapolates, and it can be checked against the game rather than against itself.

**But only where it reproduces the table exactly.** Not to six figures, not to a tolerance: every
row, exact equality. A curve that is right to twelve digits and wrong in the last one still prices
a level wrong, and a wrong price is the defect this package keeps producing — a plausible number on
a page that renders perfectly.

### Replacing a table with a formula

1. The formula comes from the game — the oracle, the wiki, or the extraction — **never from
   curve-fitting the table**. `AGENTS.md` already says it: the repo's data says what a number is,
   the wiki says what it means. Inferring a mechanic from a table's shape is how a wrong formula
   gets written that agrees with the data it was fitted to and with nothing else.
2. The table stays in the repository as a fixture.
3. A test asserts the formula reproduces every row of that fixture exactly, and names the rows it
   cannot.
4. Only then does the table stop being the runtime source.

### What is already known not to be formulaic

**Workshop coin costs are not.** `oracle_traps('workshop')` records that every curve steps at level
17 — the per-level ratio runs 1.07 to 1.33 through level 16, roughly doubles into 17, then settles
at 1.6–1.9 — and steepens again through the low 200s, peaking near 1.14 around level 205 before
falling back to 1.04 by 250. Knockback Force is not even monotonic: it dips at level 30. A fitted
multiplier understates the middle of every ladder.

**Workshop stat values often are.** 26 of the 48 curves are exactly `base + step x level`. Those
are provable and should become formulas under the procedure above. The other 22, including the
non-monotonic one, stay tables.

So the rule is not "formulas everywhere". It is: **a formula must be derived and proven, never
fitted, and where neither is possible the table is the honest answer.**

---

## Enforcement

```bash
npm run lint:organization       # every rule above; runs inside npm run verify
npm run lint:organization -- --json
```

Existing violations are recorded in `.organization-baseline.json` with a count per rule. **The
baseline may only shrink.** The checker fails if any count rises, and fails if a rule's count
reaches zero without the entry being removed — an exemption nobody needs is an exemption that
stops being read.

The baseline is a debt register, not permission. Every entry in it is a file this contract says is
in the wrong place.
