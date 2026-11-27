import Ajv2020 from 'ajv/dist/2020.js';
import { readFile } from 'node:fs/promises';

const dateFormat = {
  type: 'string',
  validate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
};

export async function validateSourceComparison(fixture, schemaPath = new URL('../schema/claim.schema.json', import.meta.url)) {
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
  ajv.addFormat('date', dateFormat);
  const validateClaim = ajv.compile(schema);
  const errors = [];
  const warnings = [];
  const ids = new Set();

  if (!Array.isArray(fixture?.claims) || fixture.claims.length === 0) {
    return { status: 'FAILED', errors: ['fixture.claims must be a non-empty array'], warnings: [] };
  }

  for (const claim of fixture.claims) {
    if (ids.has(claim.claimId)) errors.push(`duplicate claimId: ${claim.claimId}`);
    ids.add(claim.claimId);
    if (!validateClaim(claim)) {
      errors.push(`${claim.claimId}: ${ajv.errorsText(validateClaim.errors)}`);
    }
    const provenance = claim.provenance?.[0];
    for (const field of ['sourceReference', 'sourceVersion', 'publicationDate', 'retrievedAt']) {
      if (provenance?.[field] === null || provenance?.[field] === undefined || provenance?.[field] === '') {
        warnings.push({ claimId: claim.claimId, field: `provenance.${field}`, issue: 'MISSING_OR_UNKNOWN' });
      }
    }
    if (claim.applicableGameVersion === null || claim.applicableGameVersion === undefined || claim.applicableGameVersion === '') {
      warnings.push({ claimId: claim.claimId, field: 'applicableGameVersion', issue: 'MISSING_OR_UNKNOWN' });
    }
  }

  const byConflict = new Map();
  for (const claim of fixture.claims) {
    if (!claim.conflict?.conflictId) continue;
    const group = byConflict.get(claim.conflict.conflictId) ?? [];
    group.push(claim);
    byConflict.set(claim.conflict.conflictId, group);
    for (const relatedId of claim.conflict.relatedClaimIds ?? []) {
      if (!fixture.claims.some(item => item.claimId === relatedId)) {
        errors.push(`${claim.claimId}: related claim not found: ${relatedId}`);
      }
    }
  }

  const conflictGroups = [];
  for (const [conflictId, claims] of byConflict) {
    const statuses = [...new Set(claims.map(claim => claim.conflict.status))];
    if (statuses.length !== 1) errors.push(`${conflictId}: inconsistent conflict statuses`);
    if (claims.length > 1 && new Set(claims.map(claim => claim.claim)).size < 2) {
      errors.push(`${conflictId}: multiple records do not contain distinct claims`);
    }
    conflictGroups.push({
      conflictId,
      claimIds: claims.map(claim => claim.claimId),
      status: statuses[0] ?? 'UNKNOWN',
      distinctClaimCount: new Set(claims.map(claim => claim.claim)).size
    });
  }

  return {
    status: errors.length ? 'FAILED' : 'PASSED',
    claimCount: fixture.claims.length,
    conflictGroupCount: conflictGroups.length,
    conflictGroups,
    sourceRecordsRemainSeparate: new Set(fixture.claims.map(claim => claim.claimId)).size === fixture.claims.length,
    winnerSelected: false,
    provenanceWarningCount: warnings.length,
    provenanceWarnings: warnings,
    errors
  };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const fixturePath = new URL('../validation/fixtures/coin-source-comparison.fixture.json', import.meta.url);
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
  const report = await validateSourceComparison(fixture);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== 'PASSED') process.exitCode = 1;
}
