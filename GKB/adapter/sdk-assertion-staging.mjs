/**
 * Samantha GKB — SDK Assertion Staging Adapter
 * Version: 1.0.0
 *
 * One review envelope per SDK assertion. This is not canonical import.
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
const SCHEMA_PATH = path.join(GKB_ROOT, 'schema/sdk-assertion-staging.schema.json');
const OUTPUT_PATH = path.join(GKB_ROOT, 'staging/sdk-assertions.json');
const EXPECTED_PACKAGE = 'thetowersdk';
const EXPECTED_VERSION = '0.14.1';

const clone = value => JSON.parse(JSON.stringify(value));
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

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

function getClassificationCandidate(claimType) {
  if (claimType === 'objective') return 'OBJECTIVE';
  if (claimType === 'sentiment') return 'SENTIMENT';
  return null;
}

function getParentStagingId(nodeIndex) {
  return `sdk-graph-node-${String(nodeIndex + 1).padStart(6, '0')}`;
}

export function stageKnowledgeGraphAssertions(graph, {
  sdkVersion,
  registry,
  retrievedAt,
  sourceReference = 'thetowersdk/knowledge-graph.json'
} = {}) {
  if (!isObject(graph) || !Array.isArray(graph.nodes)) {
    throw new TypeError('graph.nodes must be an array; unsupported graph shape is not guessed');
  }
  if (!isObject(registry) || !Array.isArray(registry.sources)) {
    throw new TypeError('A valid Samantha Origin Registry is required');
  }
  if (registry.sdk?.package !== EXPECTED_PACKAGE || registry.sdk?.version !== sdkVersion) {
    throw new Error('Origin Registry SDK identity/version mismatch');
  }
  if (sdkVersion !== EXPECTED_VERSION) {
    throw new Error(`Expected ${EXPECTED_PACKAGE}@${EXPECTED_VERSION}, got ${sdkVersion}`);
  }
  if (!registry.sources.some(item => item.id === 'sdk-knowledge-graph')) {
    throw new Error('Origin Registry is missing sdk-knowledge-graph');
  }
  if (!isValidDate(retrievedAt)) {
    throw new TypeError('retrievedAt must be a valid YYYY-MM-DD calendar date');
  }

  const seenNodeIds = new Set();
  const records = [];
  const sourceVerificationCounts = {};
  const originCounts = {};
  let missingAssertionVerificationCount = 0;
  let invalidOriginRecordCount = 0;
  let unresolvedOriginRecordCount = 0;

  graph.nodes.forEach((node, nodeIndex) => {
    if (!isObject(node) || typeof node.id !== 'string' || node.id.length === 0) {
      throw new TypeError(`graph.nodes[${nodeIndex}] must have a non-empty string id`);
    }
    if (seenNodeIds.has(node.id)) {
      throw new Error(`Duplicate SDK node id: ${node.id}`);
    }
    seenNodeIds.add(node.id);

    if (node.assertions === undefined) return;
    if (!Array.isArray(node.assertions)) {
      throw new TypeError(`graph.nodes[${nodeIndex}].assertions must be an array`);
    }

    node.assertions.forEach((assertion, assertionIndex) => {
      if (!isObject(assertion)) {
        throw new TypeError(`graph.nodes[${nodeIndex}].assertions[${assertionIndex}] must be an object`);
      }
      if (typeof assertion.subject !== 'string' || assertion.subject.length === 0) {
        throw new TypeError(`Assertion ${node.id}[${assertionIndex}] has no string subject`);
      }
      if (typeof assertion.predicate !== 'string' || assertion.predicate.length === 0) {
        throw new TypeError(`Assertion ${node.id}[${assertionIndex}] has no string predicate`);
      }
      if (!Object.hasOwn(assertion, 'value')) {
        throw new TypeError(`Assertion ${node.id}[${assertionIndex}] has no value field`);
      }

      const provenance = isObject(assertion.provenance) ? assertion.provenance : {};
      const rawOrigins = collectRawOrigins(provenance);
      const rawOrigin = rawOrigins.length === 1 ? clone(rawOrigins[0].value) : null;
      const originMappingStatus = getOriginMappingStatus(rawOrigins);
      const sourceVerificationPresent = Object.hasOwn(assertion, 'verification');
      const sourceVerification = sourceVerificationPresent ? clone(assertion.verification) : null;
      const nodeVerification = Object.hasOwn(node, 'verification') ? clone(node.verification) : null;

      for (const origin of rawOrigins) {
        const key = String(origin.value);
        originCounts[key] = (originCounts[key] ?? 0) + 1;
      }
      if (!sourceVerificationPresent) missingAssertionVerificationCount++;
      else {
        const key = String(assertion.verification);
        sourceVerificationCounts[key] = (sourceVerificationCounts[key] ?? 0) + 1;
      }
      if (originMappingStatus === 'INVALID_OR_MISSING') invalidOriginRecordCount++;
      if (originMappingStatus === 'UNRESOLVED') unresolvedOriginRecordCount++;

      const parentStagingId = getParentStagingId(nodeIndex);
      const stagingId = `${parentStagingId}-assertion-${String(assertionIndex + 1).padStart(3, '0')}`;
      const claimPreview = `${assertion.predicate} = ${JSON.stringify(assertion.value)}`;

      records.push({
        stagingVersion: '1.0.0',
        stagingId,
        recordKind: 'SDK_GRAPH_ASSERTION_ENVELOPE',
        sourceNodeStagingId: parentStagingId,
        sourceNodeId: node.id,
        sourceAssertionIndex: assertionIndex,
        subject: assertion.subject,
        predicate: assertion.predicate,
        value: clone(assertion.value),
        claimPreview,
        classificationCandidate: getClassificationCandidate(node.claimType),
        sourceNodeClaimType: Object.hasOwn(node, 'claimType') ? clone(node.claimType) : null,
        sourceVerification,
        sourceVerificationPresent,
        sourceNodeVerification: nodeVerification,
        verificationStatus: 'EXTERNAL-UNVERIFIED',
        reviewStatus: 'PENDING_REVIEW',
        provenance: {
          sourceId: 'sdk-knowledge-graph',
          sourceName: 'TheTowerSDK Knowledge Graph',
          sourceReference,
          sdkPackage: EXPECTED_PACKAGE,
          sdkVersion,
          registryVersion: registry.registryVersion,
          sdkGraphVersion: graph.graphVersion ?? null,
          sdkSchemaVersion: graph.schemaVersion ?? null,
          sdkGraphGeneratedFor: graph.generatedFor ?? null,
          registryGameVersion: registry.gameVersion ?? null,
          retrievedAt,
          sdkSourceReference: provenance.ref ?? null,
          sdkReadAgainstVersion: provenance.readAgainstVersion ?? null,
          sdkVerifiedAt: provenance.verifiedAt ?? null,
          rawOrigin,
          rawOrigins,
          originMappingStatus
        },
        sourceRecord: clone(assertion),
        limitations: [
          'Assertion staging only; not a canonical GKB claim.',
          'The complete source assertion is preserved in sourceRecord.',
          'Parent node context is linked by sourceNodeStagingId; the parent node envelope retains the complete node.',
          'SDK verification is retained as source metadata and is not mapped to Samantha verificationStatus.',
          'Missing assertion verification is not inherited from the parent node.',
          'readAgainstVersion is preserved as an SDK field and is not automatically mapped to applicableGameVersion.',
          'verifiedAt is not interpreted as publicationDate or Samantha lastReviewedAt.',
          'Raw source origin is preserved; no source type mapping is performed.',
          'No mechanics, values, or relationships are independently verified.'
        ]
      });
    });
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
    const error = new Error('Assertion staging schema validation failed');
    error.validationErrors = invalid;
    throw error;
  }

  const classificationCandidateCounts = records.reduce((counts, record) => {
    const key = record.classificationCandidate ?? 'UNMAPPED';
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  return {
    report: {
      test: 'Samantha GKB SDK Assertion Staging',
      adapterVersion: '1.0.0',
      status: 'PASSED',
      sdkVersion,
      registryVersion: registry.registryVersion,
      retrievedAt,
      inputNodeCount: graph.nodes.length,
      inputAssertionCount: records.length,
      stagedRecordCount: records.length,
      sourceVerificationCounts,
      missingAssertionVerificationCount,
      classificationCandidateCounts,
      originCounts,
      invalidOriginRecordCount,
      unresolvedOriginRecordCount,
      sourceRecordPreserved: true,
      automaticOriginMapping: false,
      sdkVerificationMapped: false,
      canonicalClaimsCreated: false,
      promotionPerformed: false,
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
    throw new Error(`Expected ${EXPECTED_PACKAGE}@${EXPECTED_VERSION}, got ${manifest.version}`);
  }
  const graph = require('thetowersdk/knowledge-graph.json');
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const result = stageKnowledgeGraphAssertions(graph, {
    sdkVersion: manifest.version,
    registry,
    retrievedAt
  });

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    report: result.report,
    records: result.records
  }, null, 2) + '\n', 'utf8');

  console.log(JSON.stringify({
    ...result.report,
    preview: result.records.slice(0, 5)
  }, null, 2));
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  main().catch(error => {
    console.error(JSON.stringify({
      test: 'Samantha GKB SDK Assertion Staging',
      status: 'FAILED',
      error: error.message,
      validationErrors: error.validationErrors ?? []
    }, null, 2));
    process.exitCode = 1;
  });
}
