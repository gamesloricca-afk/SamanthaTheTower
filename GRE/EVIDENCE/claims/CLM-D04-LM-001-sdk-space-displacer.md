# Claim — SDK Space Displacer conversion model

- Claim ID: `CLM-D04-LM-001`
- Domain: 04 — Combat Mechanics
- Subject: Space Displacer converts some Workshop Land Mines into Inner Land Mines
- Claim type: `OBJECTIVE`
- Verification status: `VERIFIED` (SDK catalog statement only; not native runtime verification)
- Game version/build: UNKNOWN in inspected SDK source
- SDK version: `thetowersdk@0.14.1`
- Source ID: `SRC-SDK-THETOWERSDK-0141`
- Source ref: commit `9a95672578fa064d71ddd54fad2ce5027a310b3a`
- Source date: 2026-11-06
- Access date: 2026-11-27

## Claim content

The SDK's Space Displacer module template describes a chance for landmines to spawn as Inner Land Mines instead of normal mines. The described rarity chances are Epic 15%, Legendary 20%, Mythic 25%, and Ancestral 30%; the description states a 20-mine cap and that the converted mines move and organize around the tower.

## Evidence

- File: `src/data/modules/templates.ts`
- Module template ID: `space-displacer`
- Fields: Armor, unique, rarity bonuses and description.
- The SDK's `src/mechanics/effective-paths/edamage-compute.ts` models extra ILM detonations per second from enemy spawn rate × Land Mine Chance × Space Displacer unique effect.

## Limitations

- Catalog and effective-path calculator are SDK models, not native game method bodies.
- The SDK's effective-path estimate is not a simulation of each individual mine's movement, collision, or stun.
- Game build represented by the inspected code is not established here.

## Related claims

- `CLM-D04-LM-002`
- `CLM-D04-LM-003`
