# Save-format enums

How the game stores each catalog in `playerInfo.dat`: the index → name order of
labs, relics, cards, modules, bots, guardians, ultimate weapons, vault nodes,
themes, workshop and player fields, including the reserved slots that occupy an
index but hold nothing.

Contributed by **Bisse**, from the game's own save format.

## Why this is the strongest authority here

Everywhere else in this package an index → name mapping is *inferred* — from a
catalog's array order, from a display name, from what a save happens to
contain. This states it. A save array is positional, so an off-by-one or a
mis-ordered tail does not throw; it reads as a plausible wrong value, which is
the failure mode this package is least able to detect on its own.

`save-format-enums.test.ts` holds the shipped catalogs to these files. The known
divergences are listed there explicitly, so a **new** one fails the suite.

## Same rule as the Effective Paths fixtures

**These are references, not sources.** Nothing is generated from them. Where a
reference disagrees with us, look — do not copy. Two of the first six
disagreements found here were faults in the comparison itself: reading a
catalog from the wrong entry point, and comparing vault nodes by name when the
two sides use different naming conventions for the same node.

A disagreement in a *name* is usually cosmetic. A disagreement in an **index**
is not: it means two datasets disagree about which entity a save slot refers
to, and one of them is feeding wrong numbers to somebody.
