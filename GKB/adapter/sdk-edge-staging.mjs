/**
 * Samantha GKB — SDK Edge Staging Adapter
 * Version: 1.0.0
 *
 * Stages graph edges as unverified relationship candidates.
 * Only relationship names are mapped syntactically; source semantics are retained.
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
const SCHEMA_PATH = path.join(GKB_ROOT, 'schema/sdk-edge-staging.schema.json');
const OUTPUT_PATH = path.join(GKB_ROOT, 'staging/sdk-edges.json');
const EXPECTED_VERSION = '0.14.1';

const RELATIONSHIP_MAP = Object.freeze({
  gates: 'GATES',
  scales: 'SCALES',
  caps: 'CAPS',
  independentOf: 'INDEPENDENT_OF',
  separatePurchaseFrom: 'SEPARATE_PURCHASE_FROM',
  derivedFrom: 'DERIVED_FROM',
  memberOf: 'MEMBER_OF',
  appliedBefore: 'APPLIED_BEFORE'
});

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

function getNodeStagingId(nodeIndex) {
  return `sdk-graph-node-${String(nodeIndex + 1).padStart(6, '0')}`;
}

export function stageKnowledgeGraphEdges(graph, {
  sdkVersion,
  registry,
  retrievedAt,
  sourceReference = 'thetowersdk/knowledge-graph.json'
} = {}) {
  if (!isObject(graph) || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new TypeError('graph.nodes and graph.edges must be arrays; unsupported graph shape is not guessed');
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

  const nodeStagingIds = new Map();
  graph.nodes.forEach((node, index) => {
    if (!isObject(node) || typeof node.id !== 'string' || node.id.length === 0) {
      throw new TypeError(`graph.nodes[${index}] must have a non-empty string id`);
    }
    if (nodeStagingIds.has(node.id)) throw new Error(`Duplicate SDK node id: ${node.id}`);
    nodeStagingIds.set(node.id, getNodeStagingId(index));
  });

  const relationshipCandidateCounts = {};
  const originCounts = {};
  let unresolvedEndpointCount = 0;
  let unknownKindCount = 0;

  const records = graph.edges.map((edge, index) => {
    if (!isObject(edge)) throw new TypeError(`graph.edges[${index}] must be an object`);
    if (typeof edge.from !== 'string' || edge.from.length === 0 ||
        typeof edge.to !== 'string' || edge.to.length === 0) {
      throw new TypeError(`graph.edges[${index}] must have string from/to endpoints`);
    }
    if (typeof edge.kind !== 'string' || edge.kind.length === 0) {
      throw new TypeError(`graph.edges[${index}] must have a non-empty string kind`);
    }

    const fromStagingId = nodeStagingIds.get(edge.from) ?? null;
    const toStagingId = nodeStagingIds.get(edge.to) ?? null;
    const endpointMappingStatus = fromStagingId && toStagingId ? 'LINKED' : 'UNRESOLVED_ENDPOINT';
    if (endpointMappingStatus !== 'LINKED') unresolvedEndpointCount++;

    const relationshipCandidate = RELATIONSHIP_MAP[edge.kind] ?? null;
    const relationshipMappingStatus = relationshipCandidate ? 'MAPPED_SYNTAX_ONLY' : 'UNMAPPED_UNKNOWN_KIND';
    if (!relationshipCandidate) unknownKindCount++;
    else relationshipCandidateCounts[relationshipCandidate] = (relationshipCandidateCounts[relationshipCandidate] ?? 0) + 1;

    const rawOrigins = collectRawOrigins(edge.sources ?? []);
    const originMappingStatus = getOriginMappingStatus(rawOrigins);
    for (const origin of rawOrigins) {
      const key = String(origin.value);
      originCounts[key] = (originCounts[key] ?? 0) + 1;
    }

    return {
      stagingVersion: '1.0.0',
      stagingId: `sdk-graph-edge-${String(index + 1).padStart(6, '0')}`,
      recordKind: 'SDK_GRAPH_EDGE_ENVELOPE',
      sourceEdgeIndex: index,
      from: edge.from,
      to: edge.to,
      sourceNodeFromStagingId: fromStagingId,
      sourceNodeToStagingId: toStagingId,
      endpointMappingStatus,
      sourceKind: edge.kind,
      relationshipCandidate,
      relationshipMappingStatus,
      sourceClaimType: Object.hasOwn(edge, 'claimType') ? clone(edge.claimType) : null,
      sourceCompartment: Object.hasOwn(edge, 'compartment') ? clone(edge.compartment) : null,
      sourceNote: Object.hasOwn(edge, 'note') ? clone(edge.note) : null,
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
      sourceRecord: clone(edge),
      limitations: [
        'Edge staging only; not a canonical GKB relationship.',
        'Relationship candidate is a reversible name mapping only.',
        'Relationship verification remains EXTERNAL-UNVERIFIED.',
        'Source endpoints are linked to node staging envelopes when possible.',
        'Raw edge and source records are preserved without interpretation.',
        'No relationship is promoted, and no canonical claim is created.'
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
    const error = new Error('Edge staging schema validation failed');
    error.validationErrors = invalid;
    throw error;
  }

  return {
    report: {
      test: 'Samantha GKB SDK Edge Staging',
      adapterVersion: '1.0.0',
      status: 'PASSED',
      sdkVersion,
      registryVersion: registry.registryVersion,
      retrievedAt,
      inputNodeCount: graph.nodes.length,
      inputEdgeCount: graph.edges.length,
      stagedRecordCount: records.length,
      relationshipCandidateCounts,
      originCounts,
      unresolvedEndpointCount,
      unknownKindCount,
      automaticSemanticInference: false,
      relationshipVerificationMapped: false,
      canonicalRelationshipsCreated: false,
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
    throw new Error(`Expected thetowersdk@${EXPECTED_VERSION}, got ${manifest.version}`);
  }
  const graph = require('thetowersdk/knowledge-graph.json');
  const result = stageKnowledgeGraphEdges(graph, {
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
    preview: result.records.slice(0, 5)
  }, null, 2));
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  main().catch(error => {
    console.error(JSON.stringify({
      test: 'Samantha GKB SDK Edge Staging',
      status: 'FAILED',
      error: error.message,
      validationErrors: error.validationErrors ?? []
    }, null, 2));
    process.exitCode = 1;
  });
}
