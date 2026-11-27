import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateSourceComparison } from '../adapter/source-comparison-validator.mjs';

const fixture = JSON.parse(await readFile(new URL('../validation/fixtures/coin-source-comparison.fixture.json', import.meta.url), 'utf8'));
const report = await validateSourceComparison(fixture);

assert.equal(report.status, 'PASSED', JSON.stringify(report.errors));
assert.equal(report.claimCount, 8);
assert.equal(report.conflictGroupCount, 3);
assert.equal(report.sourceRecordsRemainSeparate, true);
assert.equal(report.winnerSelected, false);
assert.equal(report.conflictGroups.find(group => group.conflictId === 'GKB-CONFLICT-CBE-CAP-001').claimIds.length, 5);
assert.equal(report.conflictGroups.find(group => group.conflictId === 'GKB-CONFLICT-FETCH-CPM-WINDOW-001').claimIds.length, 2);
assert.equal(report.conflictGroups.find(group => group.conflictId === 'GKB-FETCH-OBSERVED-SHARE-SCOPE-001').status, 'NOT_COMPARABLE');
assert.ok(report.provenanceWarningCount > 0);
assert.ok(report.provenanceWarnings.some(item => item.field === 'provenance.publicationDate'));
assert.ok(report.provenanceWarnings.some(item => item.field === 'applicableGameVersion'));

const broken = structuredClone(fixture);
broken.claims[0].provenance[0].sourceName = '';
const brokenReport = await validateSourceComparison(broken);
assert.equal(brokenReport.status, 'FAILED');

const missingReference = structuredClone(fixture);
missingReference.claims[0].conflict.relatedClaimIds.push('GKB-CLAIM-DOES-NOT-EXIST');
const missingReferenceReport = await validateSourceComparison(missingReference);
assert.equal(missingReferenceReport.status, 'FAILED');
assert.ok(missingReferenceReport.errors.some(error => error.includes('related claim not found')));

console.log(JSON.stringify({
  test: 'Samantha GKB Minimal Source Comparison Validator',
  status: 'PASSED',
  cases: 14,
  claimsValidatedAgainstCanonicalSchema: report.claimCount,
  conflictGroupsPreserved: report.conflictGroupCount,
  noWinnerSelected: report.winnerSelected,
  missingProvenanceReported: true,
  danglingConflictReferencesRejected: true
}, null, 2));
