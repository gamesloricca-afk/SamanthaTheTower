# Contributing

Contributions are welcome â€” this is meant to be the community's SDK, not one person's.

## Getting set up

```bash
npm install
npm run verify   # lint, conventions, types, build, tests â€” what CI runs
```

Or individually: `npm run lint`, `npm run lint:conventions`, `npm run type-check`,
`npm test`, `npm run build`. Any package manager works; the scripts do not assume one.

Node 20+. The only runtime dependency is `zod`.

There's also an MCP server (`npm run mcp`) if you work with an AI agent â€” see
[mcp/README.md](mcp/README.md) and [AGENTS.md](AGENTS.md).

## What's most useful

**Extractors for save fields that aren't covered yet.** The save root is a plain object, so if you
work out what a field means, an extractor is usually a small addition. See any file in `src/save/`
for the shape.

**Data corrections.** Include evidence â€” a save file, or a screenshot of the value in game. A number
without evidence is hard to act on.

**Examples.** If you built something with this, an example others can learn from is valuable.

**Bug reports.** A save file that reproduces the problem is worth more than a description. Strip
anything you consider private first.

## Layout

```
src/
  data/         game tables â€” costs, levels, effects, catalogs
  save/         reading a save file
    catalogs/   save indices -> named entities
  node/         the save decoder (needs Node)
  formatting/   number formatting matching the game's display
  mechanics/    formulas (approximate â€” see README)
```

Public entry points are declared in `package.json`; each domain exports its API through its
`index.ts` barrel. If you add a module, export it from the matching barrel â€”
otherwise nobody can import it.

There is no `src/internal/`. A module belongs to a domain and is exported from it, or it is
application code and belongs in the consumer â€” see `docs/ORGANIZATION_CONTRACT.md`.

## Conventions

- **File names** are kebab-case. Inside `data/` and `save/` the directory already gives the context,
  so name the file after the thing: `save/labs.ts`, not `save/labs-from-save.ts`.
- **Save readers** are `read<Thing>FromSaveRoot(root)` and return `null` when the save has no data
  for that feature. Never throw on an old or partial save.
- **Report what you couldn't read** with a `warnings: string[]` on the result rather than silently
  dropping it.
- **Don't mutate the save root.** Callers run many extractors over the same object.
- **No side effects on import.** Importing a module must not do I/O or mutate global state.
- **Comments explain behaviour**, not history. Say what a value does and what breaks if it changes,
  not where it came from or what it used to be.
- **Use the game's names.** Look a term up with `lookupGlossary()` before writing it down; several
  acronyms mean more than one thing, and a confident wrong name is worse than no name. If you add
  data that introduces names, run `npm run glossary` so the glossary covers them.
- **Nothing outside the package.** Fixtures and test data live in the package, so a fork works.

## Tests

Tests live next to the code as `*.test.ts` and run under Vitest. Anything that decodes or maps save
data should have one â€” index-mapping bugs are silent and misreport a player's data rather than
failing.

Use a synthetic fixture rather than a real save. `src/save/fixtures/` has an example. Tests that
genuinely need a real save read `TOWER_TEST_SAVE` and skip when it is unset, so they never block
a contributor who does not have one â€” and no one's save data ends up in the repository.

## Pull requests

Keep them focused; one concern per PR is much easier to review. Run `npm run verify` before
opening â€” it is exactly what CI runs.

## Third-party work

If you contribute code adapted from another project, say so in the PR and add the project and its
license to `NOTICE`. Credit costs nothing and keeps this usable by everyone.

By contributing you agree your work is licensed under the MIT license of this project.
