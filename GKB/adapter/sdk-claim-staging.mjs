/**
 * Samantha GKB — SDK Claim Staging Adapter
 * Version: 1.0.0
 *
 * Converts SDK graph nodes into review-only staging envelopes.
 * It does not normalize, validate game mechanics, promote, or import claims.
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
const SCHEMA_PATH = path.join(GKB_ROOT, 'schema/sdk-claim-staging.schema.json');
const OUTPUT_PATH = path.join(GKB_ROOT, 'staging/sdk-claims.json');

const clone = value => JSON.parse(JSON.stringify(value));

function optionalString(value) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Intentionally conservative: only obvious string fields are exposed as
 * display hints. The complete source node remains unchanged in sourceRecord.
 */
function collectRawOrigins(root) {
  const found = [];
  function walk(value, currentPath) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${currentPath}[${index}]`));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${currentPath}.${key}`;
      if (key === 'origin') found.push({ path: childPath, value: clone(child) });
      walk(child, childPath);
    }
  }
  walk(root, '$');
  return found;
}

/**
 * Intentionally conservative: only obvious string fields are exposed as
 * display hints. Summary is a final fallback, not a verified claim.
 * The complete source node remains unchanged in sourceRecord.
 */
function getDisplayHints(node) {
  const subject = optionalString(node.subject) ??
    optionalString(node.title) ??
    optionalString(node.name) ??
    optionalString(node.id);
  const claim = optionalString(node.claim) ??
    optionalString(node.description) ??
    optionalString(node.text) ??
    optionalString(node.content) ??
    optionalString(node.summary);
  return { subject, claim };
}

export function stageKnowledgeGraph(graph, {
  sdkVersion,
  registry,
  retrievedAt,
  sourceReference = 'thetowersdk/knowledge-graph.json'
} = {}) {
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) {
    throw new TypeError('graph must be an object');
  }
  if (!Array.isArray(graph.nodes)) {
    throw new TypeError('graph.nodes must be an array; unsupported graph shape is not guessed');
  }
  if (!registry || !Array.isArray(registry.sources)) {
    throw new TypeError('A valid Samantha Origin Registry is required');
  }
  if (registry.sdk?.package !== 'thetowersdk' ||
      registry.sdk?.version !== sdkVersion) {
    throw new Error('Origin Registry SDK identity/version mismatch');
  }
  const source = registry.sources.find(item => item.id === 'sdk-knowledge-graph');
  if (!source) throw new Error('Origin Registry is missing sdk-knowledge-graph');
  if (typeof retrievedAt !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(retrievedAt) ||
      new Date(`${retrievedAt}T00:00:00.000Z`).toISOString().slice(0, 10) !== retrievedAt) {
    throw new TypeError('retrievedAt must be a valid YYYY-MM-DD calendar date');
  }

  const records = graph.nodes.map((node, index) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      throw new TypeError(`graph.nodes[${index}] must be an object`);
    }
    const rawOrigins = collectRawOrigins(node);
    const rawOrigin = rawOrigins.length === 1 ? rawOrigins[0].value : null;
    const originIsUsable = rawOrigins.length > 0 && rawOrigins.every(item => typeof item.value === 'string' && item.value.length > 0);
    const hasUnresolvedGameOrigin = rawOrigins.some(item => item.value === 'game');
    const hints = getDisplayHints(node);

    return {
      stagingVersion: '1.0.0',
      stagingId: `sdk-graph-node-${String(index + 1).padStart(6, '0')}`,
      recordKind: 'SDK_GRAPH_NODE_ENVELOPE',
      // The upstream node semantics are not inferred from its shape.
      classification: null,
      verificationStatus: 'EXTERNAL-UNVERIFIED',
      reviewStatus: 'PENDING_REVIEW',
      subject: hints.subject,
      claim: hints.claim,
      provenance: {
        sourceId: 'sdk-knowledge-graph',
        sourceReference,
        sourceName: 'TheTowerSDK Knowledge Graph',
        sdkPackage: 'thetowersdk',
        sdkVersion,
        registryVersion: registry.registryVersion,
        gameVersion: registry.gameVersion ?? null,
        sdkGraphVersion: graph.graphVersion ?? null,
        sdkSchemaVersion: graph.schemaVersion ?? null,
        sdkGraphGeneratedFor: graph.generatedFor ?? null,
        retrievedAt,
        rawOrigin,
        rawOrigins,
        originMappingStatus: !originIsUsable
          ? 'INVALID_OR_MISSING'
          : hasUnresolvedGameOrigin ? 'UNRESOLVED' : 'UNMAPPED_REQUIRES_REVIEW'
      },
      sourceRecord: clone(node),
      limitations: [
        'Staging envelope only; not a canonical GKB claim.',
        'Claim classification is pending semantic review.',
        'SDK content is external fan-made knowledge and remains unverified.',
        'Raw origin is preserved; no origin mapping or semantic equivalence is assumed.',
        'Game version is unknown unless explicitly supplied by the registry.',
        'No mechanics, numerical values, or relationships are independently verified.'
      ]
    };
  });

  const schema = JSON.parse(require('node:fs').readFileSync(SCHEMA_PATH, 'utf8'));
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  const invalid = records.flatMap((record, index) =>
    validate(record) ? [] : (validate.errors ?? []).map(error => ({
      stagingId: record.stagingId,
      instancePath: error.instancePath,
      keyword: error.keyword,
      message: error.message
    }))
  );
  if (invalid.length) {
    const error = new Error('Staging schema validation failed');
    error.validationErrors = invalid;
    throw error;
  }

  return {
    report: {
      test: 'Samantha GKB SDK Claim Staging',
      adapterVersion: '1.0.0',
      status: 'PASSED',
      sourceReference,
      sdkVersion,
      registryVersion: registry.registryVersion,
      sdkGraphVersion: graph.graphVersion ?? null,
      sdkSchemaVersion: graph.schemaVersion ?? null,
      sdkGraphGeneratedFor: graph.generatedFor ?? null,
      retrievedAt,
      inputNodeCount: graph.nodes.length,
      stagedRecordCount: records.length,
      pendingReviewCount: records.length,
      classifiedCount: records.filter(record => record.classification !== null).length,
      rawOriginPreservedCount: records.filter(record =>
        record.provenance.rawOrigins.length > 0
      ).length,
      rawOriginOccurrenceCount: records.reduce((total, record) => total + record.provenance.rawOrigins.length, 0),
      automaticMapping: false,
      promotionPerformed: false,
      gkbImportPerformed: false
    },
    records
  };
}

async function main() {
  const sdkManifest = JSON.parse(await readFile(
    path.join(GKB_ROOT, 'runtime/node_modules/thetowersdk/package.json'), 'utf8'
  ));
  const registry = JSON.parse(await readFile(REGISTRY_PATH, 'utf8'));
  if (sdkManifest.version !== '0.14.1') {
    throw new Error(`Expected thetowersdk@0.14.1, got ${sdkManifest.version}`);
  }

  const graph = require('thetowersdk/knowledge-graph.json');
  const result = stageKnowledgeGraph(graph, {
    sdkVersion: sdkManifest.version,
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
    reviewPreview: result.records.slice(0, 10)
  }, null, 2));
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  main().catch(error => {
    console.error(JSON.stringify({
      test: 'Samantha GKB SDK Claim Staging',
      status: 'FAILED',
      error: error.message,
      validationErrors: error.validationErrors ?? []
    }, null, 2));
    process.exitCode = 1;
  });
}
