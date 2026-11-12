
# Samantha — TheTowerData

## 1. Purpose

TheTowerData is Samantha's upstream preservation and external game-data
repository for The Tower: Idle Tower Defense.

Its purpose is to preserve traceable, versioned source artifacts and
selected data snapshots while maintaining compatibility with external
knowledge providers.

TheTowerData is not a fork of TheTowerSDK.

## 2. Architecture

TheTowerData uses a hybrid preservation model.

- TheTowerSDK remains an external dependency.
- Upstream source archives preserve historical SDK versions.
- Data snapshots preserve selected SDK outputs.
- Samantha GKB independently owns normalization, validation,
  provenance, and conflict management.

## 3. Upstream Dependency

Current target:

- Package: thetowersdk
- Version: 0.14.1
- Repository: https://github.com/TmRxJD/TheTowerSDK
- Upstream commit:
  9a95672578fa064d71ddd54fad2ce5027a310b3a
- Package license: MIT
- Node.js requirement: >=20

The dependency must be pinned to an exact version.

## 4. Preservation Policy

Every upstream archive must preserve:

- Original source structure.
- Original LICENSE.
- Original NOTICE.
- Upstream commit SHA.
- SDK version.
- Retrieval date.
- SHA-256 checksum.
- Archive manifest.
- Third-party attribution.

Upstream files must not be silently modified.

Samantha-specific adapters and modifications must remain separate.

Historical archives must never be silently overwritten.

## 5. Licensing Restrictions

The SDK declares an MIT license.

However, its NOTICE identifies third-party contributions
that require separate consideration.

Outstanding licensing reviews:

1. Effective Paths community spreadsheet-derived content.
2. Material and extraction work attributed to Florent Castelli (Orphis).

Do not redistribute material with unresolved permissions
until the applicable rights are clarified.

Game artwork and proprietary game assets must not be included
without independently established redistribution rights.

## 6. Snapshot Policy

Snapshots may include:

- Knowledge graphs.
- Game catalogs.
- Mechanics.
- Wiki content.
- Chart data.

Each snapshot must preserve its original source and version information.

Imported claims are classified as EXTERNAL-UNVERIFIED
until assessed by Samantha.

## 7. Version Separation

These values must remain separate:

- Game version.
- SDK package version.
- Upstream commit SHA.
- Snapshot creation date.
- Source publication date.

An SDK update does not automatically establish
a change in game mechanics.

## 8. Relationship with GKB

TheTowerData is a source and preservation layer.

GKB is responsible for:

- Claim classification.
- Verification status.
- Evidence assessment.
- Conflict detection.
- Version compatibility.
- Knowledge normalization.

TheTowerData must not directly promote unverified information
into verified universal game knowledge.

## 9. Current Status

- [x] SDK package metadata inspected.
- [x] SDK LICENSE inspected.
- [x] SDK NOTICE inspected.
- [x] Public exports inspected.
- [ ] Third-party redistribution permissions clarified.
- [ ] Initial upstream archive created.
- [ ] Archive checksum verified.
- [ ] SDK dependency installation tested.
- [ ] Selected data snapshots imported.
- [ ] Snapshot validation implemented.

## 10. References

https://github.com/TmRxJD/TheTowerSDK

Pinned upstream commit:

https://github.com/TmRxJD/TheTowerSDK/tree/9a95672578fa064d71ddd54fad2ce5027a310b3a

