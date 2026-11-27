/**
 * Samantha GKB — SDK import manifest and drift detector.
 * Produces a review candidate; it never updates the approved baseline.
 */
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME = path.join(ROOT, 'runtime');
const SDK_ROOT = path.join(RUNTIME, 'node_modules/thetowersdk');
const BASELINE_PATH = path.join(ROOT, 'sources/sdk-import-baseline.json');
const CANDIDATE_PATH = path.join(ROOT, 'staging/sdk-import-manifest.json');
const REPORT_PATH = path.join(ROOT, 'reports/sdk-import-drift-report.json');

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const countOrigins = root => {
  const counts = {};
  const walk = value => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'origin') {
        const name = typeof child === 'string' ? child : String(child);
        counts[name] = (counts[name] ?? 0) + 1;
      }
      walk(child);
    }
  };
  walk(root);
  return counts;
};

export function buildSdkImportManifest({ packageJson, graph, graphBytes, schema, schemaBytes, retrievedAt }) {
  if (!packageJson || typeof packageJson.version !== 'string') throw new TypeError('SDK package version is required');
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) throw new TypeError('Unsupported SDK graph shape');
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw new TypeError('SDK schema object is required');
  if (!Buffer.isBuffer(graphBytes) || !Buffer.isBuffer(schemaBytes)) throw new TypeError('Raw SDK file bytes are required for checksum calculation');
  if (typeof retrievedAt !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(retrievedAt) || Number.isNaN(new Date(retrievedAt + 'T00:00:00.000Z').getTime()) || new Date(retrievedAt + 'T00:00:00.000Z').toISOString().slice(0, 10) !== retrievedAt) throw new TypeError('retrievedAt must be a valid YYYY-MM-DD calendar date');
  const assertions = graph.nodes.reduce((n, node) => n + (Array.isArray(node.assertions) ? node.assertions.length : 0), 0);
  return {
    manifestVersion: '1.0.0',
    sdk: { package: packageJson.name, version: packageJson.version, license: packageJson.license ?? null, engines: packageJson.engines ?? null },
    retrieval: { retrievedAt, sourceReference: 'thetowersdk/knowledge-graph.json' },
    graph: {
      schemaVersion: graph.schemaVersion ?? null,
      graphVersion: graph.graphVersion ?? null,
      generatedFor: graph.generatedFor ?? null,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      assertionCount: assertions,
      originCounts: countOrigins(graph)
    },
    artifacts: {
      knowledgeGraph: { path: 'thetowersdk/knowledge-graph.json', sha256: sha256(graphBytes), byteLength: graphBytes.length },
      knowledgeSchema: { path: 'thetowersdk/knowledge.schema.json', sha256: sha256(schemaBytes), byteLength: schemaBytes.length }
    },
    limitations: [
      'Candidate manifest only; it is not an approved or automatically updated baseline.',
      'Checksums identify exact package artifact bytes and do not establish factual correctness.',
      'SDK graph and schema incompatibilities remain preserved as source conditions.'
    ]
  };
}

export function compareSdkImportManifests(baseline, candidate) {
  if (!baseline || !candidate) return { status: 'BASELINE_NOT_FOUND', baselinePresent: Boolean(baseline), changes: [] };
  const paths = [
    'sdk.package','sdk.version','graph.schemaVersion','graph.graphVersion','graph.generatedFor',
    'graph.nodeCount','graph.edgeCount','graph.assertionCount',
    'artifacts.knowledgeGraph.sha256','artifacts.knowledgeSchema.sha256'
  ];
  const read = (object, dotted) => dotted.split('.').reduce((value, key) => value?.[key], object);
  const changes = paths.flatMap(field => {
    const before = read(baseline, field), after = read(candidate, field);
    return Object.is(before, after) ? [] : [{ field, baselineValue: before ?? null, candidateValue: after ?? null }];
  });
  const originNames = new Set([
    ...Object.keys(baseline.graph?.originCounts ?? {}),
    ...Object.keys(candidate.graph?.originCounts ?? {})
  ]);
  for (const origin of [...originNames].sort()) {
    const before = baseline.graph?.originCounts?.[origin] ?? 0;
    const after = candidate.graph?.originCounts?.[origin] ?? 0;
    if (before !== after) changes.push({ field: `graph.originCounts.${origin}`, baselineValue: before, candidateValue: after });
  }
  return { status: changes.length ? 'DRIFT_DETECTED' : 'NO_DRIFT', baselinePresent: true, changes };
}

async function main() {
  const packageBytes = await readFile(path.join(SDK_ROOT, 'package.json'));
  const graphBytes = await readFile(path.join(SDK_ROOT, 'knowledge-graph.json'));
  const schemaBytes = await readFile(path.join(SDK_ROOT, 'knowledge.schema.json'));
  const packageJson = JSON.parse(packageBytes.toString('utf8'));
  const graph = JSON.parse(graphBytes.toString('utf8'));
  const schema = JSON.parse(schemaBytes.toString('utf8'));
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const candidate = buildSdkImportManifest({ packageJson, graph, graphBytes, schema, schemaBytes, retrievedAt });
  let baseline = null;
  try { baseline = JSON.parse(await readFile(BASELINE_PATH, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const drift = compareSdkImportManifests(baseline, candidate);
  await mkdir(path.dirname(CANDIDATE_PATH), { recursive: true });
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(CANDIDATE_PATH, JSON.stringify(candidate, null, 2) + '\\n', 'utf8');
  await writeFile(REPORT_PATH, JSON.stringify({
    test: 'Samantha GKB SDK Import Manifest Drift',
    status: drift.status,
    sdkVersion: candidate.sdk.version,
    retrievedAt,
    baselineReference: baseline ? 'GKB/sources/sdk-import-baseline.json' : null,
    changes: drift.changes,
    policy: { baselineUpdated: false, sourceDataModified: false, canonicalImportPerformed: false },
    limitations: ['Drift is a change signal, not a correctness verdict.', 'A baseline must be reviewed and committed explicitly.']
  }, null, 2) + '\\n', 'utf8');
  console.log(JSON.stringify({ status: drift.status, sdkVersion: candidate.sdk.version, graph: candidate.graph, artifacts: candidate.artifacts, changes: drift.changes }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(JSON.stringify({ status: 'FAILED', error: error.message }, null, 2)); process.exitCode = 1; });
}
