/**
 * Samantha GKB — SDK knowledge graph shape inspector
 * Read-only structural inspection; no claims are promoted or rewritten.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'runtime/package.json'));
const manifest = JSON.parse(require('node:fs').readFileSync(path.join(ROOT, 'runtime/node_modules/thetowersdk/package.json'), 'utf8'));
assert.equal(manifest.version, '0.14.1');

const graph = require('thetowersdk/knowledge-graph.json');
const schema = require('thetowersdk/knowledge.schema.json');
assert.ok(graph && Array.isArray(graph.nodes) && Array.isArray(graph.edges));

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const keys = value => isObject(value) ? Object.keys(value).sort() : [];
const countBy = (items, getter) => {
  const counts = {};
  for (const item of items) {
    const value = getter(item);
    if (typeof value === 'string') counts[value] = (counts[value] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a],[b]) => a.localeCompare(b)));
};
const assertions = graph.nodes.flatMap(node => Array.isArray(node.assertions) ? node.assertions : []);
const sources = graph.nodes.flatMap(node => Array.isArray(node.sources) ? node.sources : []);
const originCounts = {};
const walk = value => {
  if (Array.isArray(value)) return value.forEach(walk);
  if (!isObject(value)) return;
  if (Object.hasOwn(value, 'origin')) {
    const key = String(value.origin);
    originCounts[key] = (originCounts[key] ?? 0) + 1;
  }
  Object.values(value).forEach(walk);
};
walk(graph);

const nodeSchema = schema.properties?.nodes?.items ?? {};
const edgeSchema = schema.properties?.edges?.items ?? {};
const assertionSchema = nodeSchema.properties?.assertions?.items ?? {};
const provenanceSchema = assertionSchema.properties?.provenance ?? {};
const report = {
  test: 'Samantha GKB SDK Knowledge Graph Shape Inspection',
  status: 'PASSED',
  sdkVersion: manifest.version,
  graph: {
    topLevelKeys: keys(graph),
    schemaVersion: graph.schemaVersion ?? null,
    graphVersion: graph.graphVersion ?? null,
    generatedFor: graph.generatedFor ?? null,
    compartmentCount: Array.isArray(graph.compartments) ? graph.compartments.length : null,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    totalAssertions: assertions.length,
    totalNodeSources: sources.length
  },
  node: {
    observedKeys: keys(graph.nodes[0]),
    schemaProperties: Object.keys(nodeSchema.properties ?? {}).sort()
  },
  assertion: {
    observedKeys: keys(assertions[0]),
    schemaProperties: Object.keys(assertionSchema.properties ?? {}).sort(),
    claimTypeCounts: countBy(assertions, item => item.claimType),
    verificationCounts: countBy(assertions, item => item.verification),
    provenanceKeys: keys(assertions.find(item => isObject(item.provenance))?.provenance)
  },
  source: {
    observedKeys: keys(sources[0]),
    originCounts
  },
  edge: {
    observedKeys: keys(graph.edges[0]),
    schemaProperties: Object.keys(edgeSchema.properties ?? {}).sort(),
    typeCounts: countBy(graph.edges, item => item.type ?? item.relationship ?? item.kind)
  },
  schema: {
    title: schema.title ?? null,
    dialect: schema.$schema ?? null,
    nodeProperties: Object.keys(nodeSchema.properties ?? {}).sort(),
    assertionProperties: Object.keys(assertionSchema.properties ?? {}).sort(),
    provenanceProperties: Object.keys(provenanceSchema.properties ?? {}).sort(),
    edgeProperties: Object.keys(edgeSchema.properties ?? {}).sort()
  },
  limitations: [
    'Structural inspection only; claim meaning and truth are not assessed.',
    'No source origin is normalized.',
    'No claim is promoted into canonical GKB.',
    'Sample keys describe the installed package version only.'
  ]
};
console.log(JSON.stringify(report, null, 2));
