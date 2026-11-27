# Claim — Workshop Land Mine Stun and ILM stun are separate

- Claim ID: `CLM-D04-LM-002`
- Domain: 04 — Combat Mechanics
- Subject: Land Mine Stun card versus Inner Land Mine stun lab
- Claim type: `OBJECTIVE` (source statements)
- Verification status: `EXTERNAL-UNVERIFIED`
- Game version/build: NOT STATED by the 2024 and 2026 Reddit threads
- Source IDs:
  - `SRC-REDDIT-SD-LMS-2026-11-13`
  - `SRC-REDDIT-SD-LMS-2024-03-21`
- Access date: 2026-11-27

## Claim content

Both Reddit discussions state that Space Displacer-generated Inner Land Mines are not stunned by the ordinary Land Mine Stun card. The replies attribute ILM stun to the separate ILM stun lab. The 2024 thread also states that Space Displacer mines count as ILMs for an ILM mission.

## Evidence

- 2026 thread: https://www.reddit.com/r/TheTowerGame/comments/1t1rmxm/space_displacer_question/
- 2024 thread: https://www.reddit.com/r/TheTowerGame/comments/1bk73p3/

## Limitations

- Community replies, not official game documentation.
- Neither thread supplies a reproducible test protocol or game version.
- The inspected SDK code contains module and ILM calculator models, but no inspected native LandMine runtime method body or Land Mine Stun implementation that independently verifies this interaction.
- A separate June 2025 Reddit post describes using both the regular Land Mine Stun card and ILM stun with Space Displacer; that wording is compatible with two separate mine types/effects and is not proof that the card stuns ILMs.

## Samantha interpretation

Keep Workshop Land Mines and Inner Land Mines as separate subjects. Do not model Space Displacer as merely a visual change to an ordinary mine.

## Related claims

- `CLM-D04-LM-001`
- `CLM-D04-LM-003`
