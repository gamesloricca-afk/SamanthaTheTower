import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateGreStructuralData, PINNED_SOURCE, DOMAIN_FILES } from '../adapter/gre-structural-inventory.mjs';

const expected = { gameTypes: 1, gameMethods: 1, gameFields: 0, gameProperties: 0, gameParameters: 0, domainMemberships: 1, domainUniqueTypes: 1 };
const manifest = {
  metadata_version: 39, source: 'DOC-20261127-WA0002.bin',
  game_types: 1, game_methods: 1, game_fields: 0, game_properties: 0,
  game_parameters: 0, domain_unique_types: 1,
  domain_counts: Object.fromEntries(DOMAIN_FILES.map(([domain], index) => [domain, index === 0 ? 1 : 0]))
};
const types = [{
  index: 0, name: 'Enemy', namespace: '', token: '0x02000001', offset: 100,
  raw_type_record_hex: 'abcd', customTypeField: { keep: true },
  methods: [{ index: 0, name: 'Attack', token: '0x06000001', offset: 200, parameters: [], raw_record_hex: '0102', customMethodField: 'keep-me' }],
  fields: [], properties: []
}];
const domains = DOMAIN_FILES.map(([domain], index) => ({
  domain, type_indices: index === 0 ? [0] : [], types: index === 0 ? [{ index: 0 }] : []
}));
const valid = validateGreStructuralData({
  manifest, types, domains, expectedSourceCommit: PINNED_SOURCE.commit, expected
});
assert.equal(valid.valid, true, JSON.stringify(valid.errors));
assert.deepEqual(valid.counts, {
  gameTypes: 1, gameMethods: 1, gameFields: 0, gameProperties: 0,
  gameParameters: 0, domainCount: 20, domainMemberships: 1, domainUniqueTypes: 1
});

const brokenToken = structuredClone(types);
brokenToken[0].methods[0].token = '0x02000001';
const invalid = validateGreStructuralData({
  manifest, types: brokenToken, domains, expectedSourceCommit: PINNED_SOURCE.commit, expected
});
assert.equal(invalid.valid, false);
assert.ok(invalid.errors.includes('METHOD_TOKEN_TAG_INVALID'));

const duplicateMethod = structuredClone(types);
duplicateMethod[0].methods.push({ ...duplicateMethod[0].methods[0] });
const duplicate = validateGreStructuralData({
  manifest: { ...manifest, game_methods: 2 }, types: duplicateMethod, domains,
  expectedSourceCommit: PINNED_SOURCE.commit,
  expected: { ...expected, gameMethods: 2 }
});
assert.ok(duplicate.errors.includes('DUPLICATE_METHOD_INDEX'));

const wrongCommit = validateGreStructuralData({
  manifest, types, domains, expectedSourceCommit: 'not-pinned', expected
});
assert.ok(wrongCommit.errors.includes('SOURCE_COMMIT_NOT_PINNED'));

console.log(JSON.stringify({
  test: 'GRE structural metadata inventory validation',
  status: 'PASSED',
  domains: 20,
  validatesTypeMethodFieldPropertyParameterCounts: true,
  detectsDuplicateMethodIndices: true,
  detectsInvalidMethodTokenTags: true,
  pinsSourceCommit: true
}, null, 2));
