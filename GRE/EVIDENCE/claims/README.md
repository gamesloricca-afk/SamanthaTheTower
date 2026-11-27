# Claim Registry

Store atomic, source-linked claims here. A claim should express one proposition only.

## Required fields

- Claim ID
- Domain and subject
- Claim content, preserving source meaning
- Claim type: `OBJECTIVE` or `SENTIMENT`
- Verification status
- Applicable game version/build (or unknown)
- Source ID(s), source version/ref, and date
- Exact evidence location (file, section, line, method/member, offset, or test record)
- Supporting observation
- Limitations and uncertainty
- Related claims and conflict IDs

Use [CLAIM_TEMPLATE.md](../templates/CLAIM_TEMPLATE.md).

## Rules

- One claim per proposition; split unrelated statements.
- A source statement and Samantha's inference must be separate.
- Multiple sources may support different or contradictory claims.
- Do not merge contradictory values into one averaged value.
- Keep user save/test observations sample-specific.
- Do not promote claims to GKB from this directory automatically.
