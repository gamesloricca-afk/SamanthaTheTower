/**
 * Samantha GKB — GRE structural metadata inventory adapter.
 *
 * Preserves declaration metadata only. It does not infer runtime behavior,
 * produce canonical claims, or mark mechanics VERIFIED.
 * Node.js >=20; built-in modules only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PINNED_SOURCE = Object.freeze({
  repository: 'gamesloricca-afk/SamanthaTheTower',
  branch: 'TestAccount',
  commit: '62ae508f3473231b81d27903bdf63e899bb739be',
  metadataVersion: 39,
  expected: Object.freeze({
    gameTypes: 1617,
    gameMethods: 14641,
    gameFields: 15513,
    gameProperties: 2678,
    gameParameters: 8374,
    domainMemberships: 1059,
    domainUniqueTypes: 475
  })
});

export const DOMAIN_FILES = Object.freeze([
  ['01_game_fundamentals','GRE/1/01_game_fundamentals.json'],
  ['02_enemies','GRE/1/02_enemies.json'],
  ['03_battle_conditions','GRE/1/03_battle_conditions.json'],
  ['04_combat_mechanics','GRE/1/04_combat_mechanics.json'],
  ['05_ultimate_weapons','GRE/1/05_ultimate_weapons.json'],
  ['06_workshop','GRE/1/06_workshop.json'],
  ['07_workshop_enhancements','GRE/1/07_workshop_enhancements.json'],
  ['08_research','GRE/1/08_research.json'],
  ['09_modules','GRE/1/09_modules.json'],
  ['10_cards_masteries','GRE/1/10_cards_masteries.json'],
  ['11_bots','GRE/2/11_bots.json'],
  ['12_guardians','GRE/2/12_guardians.json'],
  ['13_perks','GRE/2/13_perks.json'],
  ['14_relics','GRE/2/14_relics.json'],
  ['15_vault','GRE/2/15_vault.json'],
  ['16_economy_progression','GRE/2/16_economy_progression.json'],
  ['17_formulas_calculations','GRE/2/17_formulas_calculations.json'],
  ['18_strategy_interactions','GRE/3/18_strategy_interactions.json'],
  ['19_version_history','GRE/3/19_version_history.json'],
  ['20_experimental_community','GRE/3/20_experimental_community.json']
]);

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const line = value => JSON.stringify(value) + '\n';

export function validateGreStructuralData({ manifest, types, domains, expectedSourceCommit = PINNED_SOURCE.commit, expected = PINNED_SOURCE.expected }) {
  const errors = [];
  if (!isObject(manifest)) errors.push('MANIFEST_NOT_OBJECT');
  if (manifest?.metadata_version !== PINNED_SOURCE.metadataVersion) errors.push('METADATA_VERSION_MISMATCH');
  if (manifest?.source !== 'DOC-20261127-WA0002.bin') errors.push('SOURCE_FILENAME_MISMATCH');
  if (manifest?.game_types !== expected.gameTypes) errors.push('MANIFEST_GAME_TYPE_COUNT_MISMATCH');
  if (manifest?.game_methods !== expected.gameMethods) errors.push('MANIFEST_GAME_METHOD_COUNT_MISMATCH');
  if (manifest?.game_fields !== expected.gameFields) errors.push('MANIFEST_GAME_FIELD_COUNT_MISMATCH');
  if (manifest?.game_properties !== expected.gameProperties) errors.push('MANIFEST_GAME_PROPERTY_COUNT_MISMATCH');
  if (manifest?.game_parameters !== expected.gameParameters) errors.push('MANIFEST_GAME_PARAMETER_COUNT_MISMATCH');
  if (!Array.isArray(types)) errors.push('GAME_TYPES_NOT_ARRAY');
  if (!Array.isArray(domains) || domains.length !== DOMAIN_FILES.length) errors.push('DOMAIN_INVENTORY_COUNT_MISMATCH');
  if (errors.length) return { valid: false, errors };

  if (types.length !== expected.gameTypes) errors.push('GAME_TYPE_ARRAY_COUNT_MISMATCH');
  const typeByIndex = new Map();
  let methodCount = 0, fieldCount = 0, propertyCount = 0, parameterCount = 0;
  const methodIndices = new Set();
  for (const type of types) {
    if (!isObject(type) || !Number.isInteger(type.index) || typeof type.name !== 'string') {
      errors.push('INVALID_TYPE_RECORD');
      continue;
    }
    if (typeByIndex.has(type.index)) errors.push('DUPLICATE_TYPE_INDEX');
    typeByIndex.set(type.index, type);
    for (const key of ['methods','fields','properties']) {
      if (!Array.isArray(type[key])) errors.push('TYPE_' + key.toUpperCase() + '_NOT_ARRAY');
    }
    if (!Array.isArray(type.methods) || !Array.isArray(type.fields) || !Array.isArray(type.properties)) continue;
    methodCount += type.methods.length;
    fieldCount += type.fields.length;
    propertyCount += type.properties.length;
    for (const method of type.methods) {
      if (!isObject(method) || !Number.isInteger(method.index) || typeof method.name !== 'string' ||
          typeof method.token !== 'string' || !Number.isInteger(method.offset) || !Array.isArray(method.parameters)) {
        errors.push('INVALID_METHOD_RECORD');
        continue;
      }
      if (methodIndices.has(method.index)) errors.push('DUPLICATE_METHOD_INDEX');
      methodIndices.add(method.index);
      if (!/^0x06[0-9a-f]{6}$/i.test(method.token)) errors.push('METHOD_TOKEN_TAG_INVALID');
      parameterCount += method.parameters.length;
    }
  }
  if (methodCount !== expected.gameMethods) errors.push('GAME_METHOD_COUNT_MISMATCH');
  if (fieldCount !== expected.gameFields) errors.push('GAME_FIELD_COUNT_MISMATCH');
  if (propertyCount !== expected.gameProperties) errors.push('GAME_PROPERTY_COUNT_MISMATCH');
  if (parameterCount !== expected.gameParameters) errors.push('GAME_PARAMETER_COUNT_MISMATCH');

  let memberships = 0;
  const domainTypeIndices = new Set();
  const domainNames = new Set();
  for (const domain of domains) {
    if (!isObject(domain) || typeof domain.domain !== 'string' ||
        !Array.isArray(domain.type_indices) || !Array.isArray(domain.types)) {
      errors.push('INVALID_DOMAIN_INVENTORY');
      continue;
    }
    if (domainNames.has(domain.domain)) errors.push('DUPLICATE_DOMAIN_NAME');
    domainNames.add(domain.domain);
    if (domain.type_indices.length !== domain.types.length) errors.push('DOMAIN_TYPE_ARRAY_LENGTH_MISMATCH');
    const seen = new Set();
    for (let i = 0; i < domain.type_indices.length; i++) {
      const index = domain.type_indices[i];
      if (!Number.isInteger(index) || seen.has(index)) errors.push('INVALID_OR_DUPLICATE_DOMAIN_TYPE_INDEX');
      seen.add(index);
      memberships++;
      domainTypeIndices.add(index);
      if (!typeByIndex.has(index)) errors.push('DOMAIN_TYPE_INDEX_NOT_IN_GLOBAL_INVENTORY');
      if (domain.types[i]?.index !== index) errors.push('DOMAIN_TYPE_INDEX_ALIGNMENT_MISMATCH');
    }
    if (domain.domain !== domain.domain.replace(/^\d{2}_/, '')) {
      // The source's domain field is the canonical numbered filename stem.
      if (!/^\d{2}_[a-z0-9_]+$/.test(domain.domain)) errors.push('DOMAIN_IDENTIFIER_FORMAT_INVALID');
    }
  }
  if (memberships !== expected.domainMemberships) errors.push('DOMAIN_MEMBERSHIP_COUNT_MISMATCH');
  if (domainTypeIndices.size !== expected.domainUniqueTypes) errors.push('DOMAIN_UNIQUE_TYPE_COUNT_MISMATCH');
  if (manifest?.domain_unique_types !== expected.domainUniqueTypes) errors.push('MANIFEST_DOMAIN_UNIQUE_TYPE_COUNT_MISMATCH');
  if (expectedSourceCommit !== PINNED_SOURCE.commit) errors.push('SOURCE_COMMIT_NOT_PINNED');

  return {
    valid: errors.length === 0,
    errors,
    counts: {
      gameTypes: typeByIndex.size,
      gameMethods: methodCount,
      gameFields: fieldCount,
      gameProperties: propertyCount,
      gameParameters: parameterCount,
      domainCount: domains.length,
      domainMemberships: memberships,
      domainUniqueTypes: domainTypeIndices.size
    }
  };
}

export function buildGreStructuralInventory({ sourceRoot, outputDir, sourceCommit = PINNED_SOURCE.commit }) {
  if (!sourceRoot || !outputDir) throw new Error('sourceRoot and outputDir are required');
  const gre3 = path.join(sourceRoot, 'GRE/3');
  const manifest = readJson(path.join(gre3, 'manifest.json'));
  const types = readJson(path.join(gre3, 'all_game_types.json'));
  const domains = DOMAIN_FILES.map(([domain, relativePath]) => {
    const record = readJson(path.join(sourceRoot, relativePath));
    if (record.domain !== domain) throw new Error('Domain identity mismatch: ' + relativePath);
    return record;
  });
  const validation = validateGreStructuralData({ manifest, types, domains, expectedSourceCommit: sourceCommit });
  if (!validation.valid) throw new Error('GRE structural inventory validation failed: ' + validation.errors.join(', '));

  const output = path.resolve(outputDir);
  fs.mkdirSync(output, { recursive: true });
  const source = {
    repository: PINNED_SOURCE.repository,
    branch: PINNED_SOURCE.branch,
    commit: sourceCommit,
    sourceFile: manifest.source,
    sourceBinarySha256: manifest.sha256,
    sourceBinarySize: manifest.size,
    metadataFormatVersion: manifest.metadata_version,
    gameReleaseVersion: null,
    evidenceClass: 'DIRECT_METADATA_DECLARATION',
    verificationStatus: 'EXTERNAL-UNVERIFIED'
  };

  const typeLines = [];
  const methodLines = [];
  for (const type of types) {
    const { methods, ...typeWithoutMethods } = type;
    typeLines.push(line({
      recordKind: 'GRE_TYPE_DECLARATION',
      ...source,
      ...typeWithoutMethods,
      methodCount: methods.length
    }));
    for (const method of methods) {
      methodLines.push(line({
        recordKind: 'GRE_METHOD_DECLARATION',
        ...source,
        ownerType: {
          index: type.index,
          name: type.name,
          namespace: type.namespace,
          token: type.token,
          offset: type.offset
        },
        ...method
      }));
    }
  }

  const domainLines = [];
  for (const domain of domains) {
    for (const index of domain.type_indices) {
      domainLines.push(line({
        recordKind: 'GRE_DOMAIN_MEMBERSHIP',
        ...source,
        domain: domain.domain,
        typeIndex: index
      }));
    }
  }

  fs.writeFileSync(path.join(output, 'gre-types.jsonl'), typeLines.join(''));
  fs.writeFileSync(path.join(output, 'gre-methods.jsonl'), methodLines.join(''));
  fs.writeFileSync(path.join(output, 'gre-domain-memberships.jsonl'), domainLines.join(''));
  const report = {
    format: 'SAMANTHA_GKB_GRE_STRUCTURAL_INVENTORY',
    formatVersion: 1,
    status: 'PASSED',
    generatedAt: new Date().toISOString(),
    source,
    counts: validation.counts,
    methodRecordPreservation: 'ALL_METHOD_RECORDS_WRITTEN_AS_JSONL',
    unknownFields: 'Preserved by spreading complete source type and method records; no field allowlist is used.',
    semanticInterpretation: 'NOT_PERFORMED',
    runtimeBehaviorVerified: false,
    canonicalClaimsCreated: 0,
    automaticApprovals: 0,
    canonicalWrites: 0,
    limitations: [
      'Metadata format version 39 is not a game release version.',
      'Method declarations do not prove method bodies, call order, runtime execution, formulas, or game behavior.',
      'Domain classification is heuristic and overlapping; repeated memberships are not independent evidence.',
      'The original source binary is absent from this checked-in snapshot; its recorded SHA-256 was not independently recomputed by this workflow.'
    ]
  };
  fs.writeFileSync(path.join(output, 'gre-structural-inventory-report.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}

function main() {
  const sourceRoot = process.argv[2];
  const outputDir = process.argv[3];
  const report = buildGreStructuralInventory({ sourceRoot, outputDir });
  console.log(JSON.stringify(report, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) {
    console.error(JSON.stringify({ status: 'FAILED', error: error.message }, null, 2));
    process.exitCode = 1;
  }
}
