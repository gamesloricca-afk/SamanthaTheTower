/**
 * Samantha GKB — conservative SDK identifier mapping report.
 *
 * Compares SDK graph node IDs/labels with identifiers in Samantha's currently
 * available canonical catalogs. Exact ID and exact label matches are reported
 * separately. Nothing is approved, rewritten, or imported automatically.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME = path.join(ROOT, 'runtime');
const OUTPUT = path.join(ROOT, 'reports/sdk-identifier-mapping-report.json');
const require = createRequire(path.join(RUNTIME, 'package.json'));

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function buildIdentifierMappingReport({ graph, catalogs, sdkVersion, retrievedAt }) {
  if (!isObject(graph) || !Array.isArray(graph.nodes)) {
    throw new TypeError('graph.nodes must be an array');
  }
  if (!Array.isArray(catalogs) || catalogs.length === 0) {
    throw new TypeError('At least one canonical catalog is required');
  }
  if (typeof sdkVersion !== 'string' || !sdkVersion) {
    throw new TypeError('sdkVersion is required');
  }
  if (typeof retrievedAt !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(retrievedAt) ||
      Number.isNaN(new Date(retrievedAt + 'T00:00:00.000Z').getTime()) ||
      new Date(retrievedAt + 'T00:00:00.000Z').toISOString().slice(0, 10) !== retrievedAt) {
    throw new TypeError('retrievedAt must be a valid YYYY-MM-DD date');
  }

  const canonical = catalogs.flatMap(catalog => {
    if (!isObject(catalog) || !Array.isArray(catalog.records)) {
      throw new TypeError('Each catalog must contain a records array');
    }
    return catalog.records.map(record => {
      if (!isObject(record) || typeof record.id !== 'string' || !record.id ||
          typeof record.name !== 'string' || !record.name) {
        throw new TypeError('Canonical records require non-empty id and name');
      }
      return {
        id: record.id,
        name: record.name,
        domain: catalog.domain,
        sourcePath: catalog.sourcePath
      };
    });
  });

  const canonicalIds = canonical.map(item => item.id);
  if (new Set(canonicalIds).size !== canonicalIds.length) {
    throw new Error('Duplicate canonical IDs across supplied catalogs; mapping would be ambiguous');
  }

  const records = graph.nodes.map((node, index) => {
    if (!isObject(node)) throw new TypeError(`graph.nodes[${index}] must be an object`);
    const sdkNodeId = typeof node.id === 'string' ? node.id : null;
    const sdkLabel = typeof node.label === 'string' ? node.label : null;
    const idMatches = sdkNodeId ? canonical.filter(item => item.id === sdkNodeId) : [];
    const nameMatches = sdkLabel ? canonical.filter(item => item.name === sdkLabel) : [];
    const candidateIds = [...new Set([...idMatches, ...nameMatches].map(item => item.id))];
    let status = 'UNMATCHED';
    let matchMethod = 'NONE';
    if (candidateIds.length > 1) {
      status = 'AMBIGUOUS';
      matchMethod = idMatches.length && nameMatches.length ? 'ID_AND_NAME_DISAGREE' : 'MULTIPLE_EXACT_NAME_MATCHES';
    } else if (idMatches.length === 1) {
      status = 'EXACT_ID_MATCH';
      matchMethod = 'EXACT_ID';
    } else if (nameMatches.length === 1) {
      status = 'NAME_CANDIDATE';
      matchMethod = 'EXACT_NAME_ONLY';
    }
    const candidate = candidateIds.length === 1
      ? canonical.find(item => item.id === candidateIds[0])
      : null;
    return {
      sdkNodeId,
      sdkLabel,
      sdkKind: typeof node.kind === 'string' ? node.kind : null,
      status,
      matchMethod,
      candidateCanonicalId: candidate?.id ?? null,
      candidateCanonicalName: candidate?.name ?? null,
      candidateDomain: candidate?.domain ?? null,
      candidateSourcePath: candidate?.sourcePath ?? null,
      candidateCanonicalIds: candidateIds,
      mappingApproved: false
    };
  });

  const statusCounts = Object.fromEntries(
    ['EXACT_ID_MATCH', 'NAME_CANDIDATE', 'AMBIGUOUS', 'UNMATCHED']
      .map(status => [status, records.filter(item => item.status === status).length])
  );
  return {
    reportVersion: '1.0.0',
    test: 'Samantha GKB SDK Identifier Mapping',
    status: 'PASSED',
    sdkPackage: 'thetowersdk',
    sdkVersion,
    retrievedAt,
    scope: {
      graphNodeCount: graph.nodes.length,
      canonicalCatalogs: catalogs.map(item => ({
        domain: item.domain,
        sourcePath: item.sourcePath,
        recordCount: item.records.length
      })),
      canonicalRecordCount: canonical.length,
      matchingPolicy: [
        'Only exact ID equality is reported as EXACT_ID_MATCH.',
        'Exact name equality without ID equality is a NAME_CANDIDATE, not an identity decision.',
        'Multiple or disagreeing candidates remain AMBIGUOUS.',
        'No fuzzy, substring, normalized, or inferred matching is performed.'
      ]
    },
    summary: {
      ...statusCounts,
      total: records.length,
      mappedOrCandidateCount: records.filter(item => item.candidateCanonicalId !== null).length,
      mappingApprovedCount: 0
    },
    records,
    policy: {
      automaticMapping: false,
      mappingApproved: false,
      sourceDataModified: false,
      canonicalClaimsCreated: false,
      canonicalImportPerformed: false
    },
    limitations: [
      'Coverage is limited to the canonical catalogs listed in scope; unmatched does not mean the game entity is unknown to Samantha.',
      'An exact ID or name match is an identifier candidate only, not proof that two records have equivalent meaning.',
      'SDK graph content remains EXTERNAL-UNVERIFIED.',
      'No claim, relationship, source origin, or verification status is promoted.'
    ]
  };
}

async function main() {
  const manifest = JSON.parse(await readFile(path.join(RUNTIME, 'node_modules/thetowersdk/package.json'), 'utf8'));
  if (manifest.version !== '0.14.1') throw new Error(`Expected thetowersdk@0.14.1, got ${manifest.version}`);
  const graph = require('thetowersdk/knowledge-graph.json');
  const modules = JSON.parse(await readFile(path.join(ROOT, 'domains/modules-unique.json'), 'utf8'));
  const report = buildIdentifierMappingReport({
    graph,
    catalogs: [{
      domain: 'Modules — Unique',
      sourcePath: 'GKB/domains/modules-unique.json',
      records: modules.modules
    }],
    sdkVersion: manifest.version,
    retrievedAt: new Date().toISOString().slice(0, 10)
  });
  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ ...report, records: undefined }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(JSON.stringify({ test: 'Samantha GKB SDK Identifier Mapping', status: 'FAILED', error: error.message }, null, 2));
    process.exitCode = 1;
  });
}
