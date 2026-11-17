# Effective Paths reference fixtures

Snapshots of the community [Effective Paths spreadsheet][sheet], used to check
our game data against an independent reference. The sheet's author obtains
values from the developers; these snapshots preserve the spreadsheet comparison
used by the SDK's data tests.

**These are references, not sources.** Nothing in the SDK is generated from
them. Where the reference disagrees with us the answer is to look, not to copy —
several of the disagreements found so far were faults in the comparison rather
than in either dataset.

Refresh them all with:

```bash
node scripts/refresh-effective-paths-reference.mjs
```

Then run the tests. A diff is either a game balance change to absorb or a real
error in our tables, and both are worth looking at deliberately.

| Fixture | Tab | Covers | Test |
|---|---|---|---|
| `effective-paths-labs.json` | DVT_Laboratory | 191 labs, 5543 level rows | `lab-reference.test.ts` |
| `effective-paths-lab-unlocks.json` | DVT_Laboratory_Unlock | 203 lab tier/wave unlocks | `lab-unlock-reference.test.ts` |
| `effective-paths-module-base-stats.json` | Module Base Stat | 15 rarities x 4 module types | `module-reference.test.ts` |
| `effective-paths-bots.json` | DVT_Bot | 5 bots, 25 upgrades | `bot-reference.test.ts` |
| `effective-paths-guardians.json` | DVT_Guardians | 5 groups, 414 levels | `guardian-reference.test.ts` |
| `effective-paths-ultimate-weapons.json` | DVT_UWs | 9 weapons, 36 stats | `ultimate-weapon-reference.test.ts` |
| `effective-paths-workshop.json` | DVT_Workshop | 6 stats, 23286 values | `workshop-reference.test.ts` |

## Things that bit, so they do not bite again

**Tabs are selected by gid and nothing else.** The `sheet=` query parameter is
ignored by both the export and the gviz endpoints, which silently return the
*first* tab instead — so a stale gid yields the changelog rather than an error.
Every builder asserts on its tab's header before writing. To find a gid, open
the sheet, click the tab, and read `gid=` out of the address bar.

**`Number('')` is 0.** A blank level cell read as level 0, so every empty row
past a bot's or guardian's cap piled onto that one level: Guardian ATTACK came
out with 101 rows for 90 levels. Blank must parse as NaN.

**The lab tab ends each lab with a row numbered 999** holding the cumulative
cost to max it. It is a total, not a level.

**Notation differs on both sides.** `x1.1` against `1.1x`, `120s` against
`120.0s`, `30°` against `30`, `Unlock` against `0`. Compare the number, not the
spelling, or hundreds of rows read as mismatches and the real faults hide among
them.

**The sheet quotes three significant figures** (`5.88E+00` for our `5.877`), so
value comparisons need a relative tolerance, not equality.

**Each test asserts how many comparisons it made.** A check that silently skips
everything passes exactly as loudly as one that works — the lab duration check
was quietly skipping all 1110 static-lab durations until it started counting.

[sheet]: https://docs.google.com/spreadsheets/d/1YwZtKP6B4WYhRba5T6APJ1YxKNdfnIGQnprgnxmO7zc/edit
