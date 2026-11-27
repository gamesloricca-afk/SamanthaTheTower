/**
 * Samantha GKB — SDK Contradiction Staging Adapter
 * Preserves SDK contradiction records and ranking metadata without selecting a winner.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GKB_ROOT = path.resolve(HERE, '..');
const require = createRequire(path.join(GKB_ROOT, 'runtime/package.json'));
const Ajv2020 = require('ajv/dist/2020.js').default;
const REGISTRY_PATH = path.join(GKB_ROOT, 'sources/origin-registry.json');
const SCHEMA_PATH = path.join(GKB_ROOT, 'schema/sdk-contradiction-staging.schema.json');
const OUTPUT_PATH = path.join(GKB_ROOT, 'staging/sdk-contradictions.json');
const EXPECTED_VERSION = '0.14.1';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const clone = value => JSON.parse(JSON.stringify(value));

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function collectRawOrigins(root) {
  const found = [];
  function walk(value, currentPath) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${currentPath}[${index}]`));
      return;
    }
    if (!isObject(value)) return;
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${currentPath}.${key}`;
      if (key === 'origin') found.push({ path: childPath, value: clone(child) });
      walk(child, childPath);
    }
  }
  walk(root, '$');
  return found;
}

function getOriginMappingStatus(rawOrigins) {
  if (!rawOrigins.length || rawOrigins.some(item => typeof item.value !== 'string' || item.value.length === 0)) {
    return 'INVALID_OR_MISSING';
  }
  if (rawOrigins.some(item => item.value === 'game')) return 'UNRESOLVED';
  return 'UNMAPPED_REQUIRES_REVIEW';
}

export function stageKnowledgeGraphContradictions(graph, sdkContradictions, {
  sdkVersion,
  registry,
  retrievedAt,
  sourceReference = 'thetowersdk/knowledge-graph.json'
} = {}) {
  if (!isObject(graph) || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new TypeError('A valid SDK knowledge graph is required');
  }
  if (!Array.isArray(sdkContradictions)) {
    throw new TypeError('sdkContradictions must be an array');
  }
  if (!isObject(registry) || !Array.isArray(registry.sources)) {
    throw new TypeError('A valid Samantha Origin Registry is required');
  }
  if (registry.sdk?.package !== 'thetowersdk' || registry.sdk?.version !== sdkVersion) {
    throw new Error('Origin Registry SDK identity/version mismatch');
  }
  if (sdkVersion !== EXPECTED_VERSION) {
    throw new Error(`Expected thetowersdk@${EXPECTED_VERSION}, got ${sdkVersion}`);
  }
  if (!registry.sources.some(item => item.id === 'sdk-knowledge-graph')) {
    throw new Error('Origin Registry is missing sdk-knowledge-graph');
  }
  if (!isValidDate(retrievedAt)) {
    throw new TypeError('retrievedAt must be a valid YYYY-MM-DD calendar date');
  }

  const originCounts = {};
  const records = sdkContradictions.map((item, index) => {
    if (!isObject(item)) throw new TypeError(`sdkContradictions[${index}] must be an object`);
    const claims = Array.isArray(item.claims) ? item.claims : [];
    const rawOrigins = collectRawOrigins(claims);
    const originMappingStatus = getOriginMappingStatus(rawOrigins);
    for (const origin of rawOrigins) {
      const key = String(origin.value);
      originCounts[key] = (originCounts[key] ?? 0) + 1;
    }

    const graphRecord = Array.isArray(graph.contradictions) ? graph.contradictions[index] ?? null : null;
    return {
      stagingVersion: '1.0.0',
      stagingId: `sdk-graph-contradiction-${String(index + 1).padStart(6, '0')}`,
      recordKind: 'SDK_CONTRADICTION_ENVELOPE',
      sourceContradictionIndex: index,
      sourceSubject: Object.hasOwn(item, 'subject') ? clone(item.subject) : null,
      sourcePredicate: Object.hasOwn(item, 'predicate') ? clone(item.predicate) : null,
      sourceLikelyValue: Object.hasOwn(item, 'likelyValue') ? clone(item.likelyValue) : null,
      sourceClaims: clone(claims),
      sourceClaimCount: claims.length,
      sourceCrossSource: Object.hasOwn(item, 'crossSource') ? clone(item.crossSource) : null,
      likelyValueTreatment: 'SDK_HINT_ONLY_NOT_FACTUAL_WINNER',
      conflictStatus: 'UNRESOLVED',
      verificationStatus: 'EXTERNAL-UNVERIFIED',
      reviewStatus: 'PENDING_REVIEW',
      provenance: {
        sourceId: 'sdk-knowledge-graph',
        sourceName: 'TheTowerSDK Knowledge Graph',
        sourceReference,
        sdkPackage: 'thetowersdk',
        sdkVersion,
        registryVersion: registry.registryVersion,
        sdkGraphVersion: graph.graphVersion,
        sdkSchemaVersion: graph.schemaVersion,
        sdkGraphGeneratedFor: graph.generatedFor ?? null,
        retrievedAt,
        rawOrigins,
        originMappingStatus
      },
      sourceRecord: {
        graphRecord: graphRecord === null ? null : clone(graphRecord),
        sdkAnalysis: clone(item)
      },
      limitations: [
        'SDK contradiction staging only; not a canonical GKB conflict record.',
        'SDK likelyValue and authorityRank are preserved as SDK analysis metadata only.',
        'No likelyValue is selected as a factual winner.',
        'Source-specific claims remain separate and unverified.',
        'No Samantha conflict status is resolved automatically.',
        'No canonical claim or conflict group is created.'
      ]
    };
  });

  const schema = JSON.parse(require('node:fs').readFileSync(SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: false });
  const validate = ajv.compile(schema);
  const invalid = records.flatMap(record =>
    validate(record) ? [] : (validate.errors ?? []).map(error => ({
      stagingId: record.stagingId,
      instancePath: error.instancePath,
      keyword: error.keyword,
      message: error.message
    }))
  );
  if (invalid.length) {
    const error = new Error('Contradiction staging schema validation failed');
    error.validationErrors = invalid;
    throw error;
  }

  return {
    report: {
      test: 'Samantha GKB SDK Contradiction Staging',
      adapterVersion: '1.0.0',
      status: 'PASSED',
      sdkVersion,
      registryVersion: registry.registryVersion,
      retrievedAt,
      sdkContradictionCount: sdkContradictions.length,
      graphContradictionRecordCount: Array.isArray(graph.contradictions) ? graph.contradictions.length : 0,
      stagedRecordCount: records.length,
      sourceClaimCount: records.reduce((sum, record) => sum + record.sourceClaimCount, 0),
      originCounts,
      likelyValuePreserved: true,
      likelyValueUsedAsWinner: false,
      authorityRankPreservedOnly: true,
      conflictResolved: false,
      canonicalConflictCreated: false,
      gkbImportPerformed: false
    },
    records
  };
}

async function main() {
  const manifest = JSON.parse(await readFile(
    path.join(GKB_ROOT, 'runtime/node_modules/thetowersdk/package.json'), 'utf8'
  ));
  const registry = JSON.parse(await readFile(REGISTRY_PATH, 'utf8'));
  if (manifest.version !== EXPECTED_VERSION) {
    throw new Error(`Expected thetowersdk@${EXPECTED_VERSION}, got ${manifest.version}`);
  }
  const graph = require('thetowersdk/knowledge-graph.json');
  const knowledge = await import(pathToFileURL(require.resolve('thetowersdk/knowledge')).href);
  const sdkContradictions = knowledge.findContradictions();
  const result = stageKnowledgeGraphContradictions(graph, sdkContradictions, {
    sdkVersion: manifest.version,
    registry,
    retrievedAt: new Date().toISOString().slice(0, 10)
  });

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    report: result.report,
    records: result.records
  }, null, 2) + '\n', 'utf8');

  console.log(JSON.stringify({
    ...result.report,
    preview: result.records.slice(0, 3)
  }, null, 2));
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  main().catch(error => {
    console.error(JSON.stringify({
      test: 'Samantha GKB SDK Contradiction Staging',
      status: 'FAILED',
      error: error.message,
      validationErrors: error.validationErrors ?? []
    }, null, 2));
    process.exitCode = 1;
  });
}
