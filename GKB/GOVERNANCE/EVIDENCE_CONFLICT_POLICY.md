SAMANTHA EVIDENCE GOVERNANCE

Conflicting Claims Management Standard

Applies to: All Samantha databases, including GKB, GMB, PER, and future knowledge databases.

1. One Claim ID = One Proposition

Every Claim ID must represent exactly one factual proposition.

Different values, interpretations, or conclusions must never be merged into one Claim ID.

2. Separate entries for competing claims

When two sources report different propositions about the same mechanic, create separate Claim IDs.

Example:

Claim ID| Proposition| Status
ENM-PRO-005| Protector cap is 8| Conflict
ENM-PRO-006| Protector cap is 10| Conflict

Each entry must independently record:

- Proposition.
- Source ID.
- Source type.
- Evidence status.
- Confidence.
- Applicable game version and conditions.
- Source publication/update date.
- Samantha review date.
- Limitations.
- Related Conflict ID.

3. Evidence status rules

Conflict
Use when credible evidence directly supports incompatible propositions under comparable conditions.

All competing claims receive their own entries and are linked through one Conflict ID.

Unverified
Use when evidence is insufficient to establish a proposition, but there is no demonstrated direct contradiction.

Source-Reported
Use when a source reports a proposition, but the evidence has not been independently validated.

Supported
Use when credible evidence supports a proposition, but verification remains incomplete.

Verified
Use only when evidence is sufficiently strong, directly applicable, and properly scoped.

Never use "Unverified / Conflict" as a combined status. Select the correct status based on the evidence.

4. Conflict Register

Every Conflict must have a unique Conflict ID.

The Conflict Register must contain:

- Conflict ID.
- Subject.
- Related Claim IDs.
- Competing propositions.
- Sources supporting each proposition.
- Whether the sources are independent.
- Game version and test conditions.
- Nature of the disagreement.
- Current resolution status.
- Evidence required to resolve it.
- Resolution history.

5. Non-comparable evidence

Different numbers are not automatically contradictory.

Before declaring Conflict, check whether the claims use:

- Different definitions.
- Different game versions.
- Different tiers or waves.
- Different upgrade levels.
- Different measurement methods.
- Different experimental conditions.

If the conditions differ, preserve the separate claims and document the scope difference. Do not manufacture a conflict.

6. Conflict resolution

When a conflict is resolved:

- Preserve both original Claim IDs.
- Update their evidence status appropriately.
- Record the new evidence.
- Link the resolution to the Conflict ID.
- Maintain the historical record.
- Never silently delete the losing proposition.

7. Samantha response behavior

When a player asks about an unresolved mechanic, Samantha must:

1. State that the evidence is conflicting or insufficient.
2. Present each competing proposition separately.
3. Identify the source and its credibility.
4. Explain relevant conditions and limitations.
5. State that no definitive conclusion has been established.
6. Avoid selecting a value merely because it is more popular or repeated more frequently.

8. Governing principle

Samantha stores claims, evidence, provenance, and uncertainty—not merely numbers.

An unresolved conflict is valid database information and must not be hidden or prematurely resolved.

Core Principle: Optimize Decisions, Not Popularity.
