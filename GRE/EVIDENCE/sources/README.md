# Source Registry

This directory records the sources consulted during GRE Evidence Expansion.

## Required source record fields

- Stable source ID
- Source title/name
- Author, maintainer, or organization (if known)
- Source type (SDK, repository, wiki, spreadsheet, test, user-provided, etc.)
- Exact URL or repository path/ref
- Publication/update date (or unknown)
- Access date
- Game version/build scope (or unknown)
- SDK package/version (if relevant)
- GRE metadata format version (if relevant)
- License and attribution requirements
- What the source actually supports
- Limitations, missing context, and access restrictions

Use [SOURCE_TEMPLATE.md](../templates/SOURCE_TEMPLATE.md) for new records.

## Rules

- Do not treat SDK version as game version.
- Do not treat metadata format v39 as a game release.
- Keep source authority separate from recency.
- Preserve fanmade/community provenance.
- Do not call a source official unless it is an actual developer-controlled source.
- Do not replace a source record when a newer version appears; add a versioned record and mark the old one superseded only when justified.

- [SRC-GRE-METADATA-V39](SRC-GRE-METADATA-V39.md) — GRE metadata export v39 and its extraction limitations.
