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
  if (typeof retrievedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(retrievedAt) ||
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
        sourcePath: catalog.sourcePath,
        targetType: catalog.targetType ?? 'CANONICAL'
      };
    });
  });

  const canonicalIds = canonical.filter(item => item.targetType === 'CANONICAL').map(item => item.id);
  if (new Set(canonicalIds).size !== canonicalIds.length) {
    throw new Error('Duplicate canonical IDs across supplied catalogs; mapping would be ambiguous');
  }
  const targetKeys = canonical.map(item => `${item.targetType}:${item.id}`);
  if (new Set(targetKeys).size !== targetKeys.length) {
    throw new Error('Duplicate target IDs within the same target type');
  }

  const records = graph.nodes.map((node, index) => {
    if (!isObject(node)) throw new TypeError(`graph.nodes[${index}] must be an object`);
    const sdkNodeId = typeof node.id === 'string' ? node.id : null;
    const sdkLabel = typeof node.label === 'string' ? node.label : null;
    const idMatches = sdkNodeId ? canonical.filter(item => item.targetType === 'CANONICAL' && item.id === sdkNodeId) : [];
    const nameMatches = sdkLabel ? canonical.filter(item => item.name === sdkLabel) : [];
    const candidates = [...new Map([...idMatches, ...nameMatches].map(item => [`${item.targetType}:${item.id}`, item])).values()];
    const candidateIds = candidates.map(item => item.id);
    let status = 'UNMATCHED';
    let matchMethod = 'NONE';
    if (candidates.length > 1) {
      status = 'AMBIGUOUS';
      matchMethod = idMatches.length && nameMatches.length ? 'ID_AND_NAME_DISAGREE' : 'MULTIPLE_EXACT_NAME_MATCHES';
    } else if (idMatches.length === 1) {
      status = 'EXACT_ID_MATCH';
      matchMethod = 'EXACT_ID';
    } else if (nameMatches.length === 1 && nameMatches[0].targetType === 'DOCUMENT_REFERENCE') {
      status = 'DOCUMENT_REFERENCE_CANDIDATE';
      matchMethod = 'EXACT_DOCUMENT_HEADING_ONLY';
    } else if (nameMatches.length === 1) {
      status = 'NAME_CANDIDATE';
      matchMethod = 'EXACT_NAME_ONLY';
    }
    const candidate = candidates.length === 1 ? candidates[0] : null;
    return {
      sdkNodeId,
      sdkLabel,
      sdkKind: typeof node.kind === 'string' ? node.kind : null,
      status,
      matchMethod,
      candidateTargetType: candidate?.targetType ?? null,
      candidateTargetId: candidate?.id ?? null,
      candidateCanonicalId: candidate?.targetType === 'CANONICAL' ? candidate.id : null,
      candidateReferenceId: candidate?.targetType === 'DOCUMENT_REFERENCE' ? candidate.id : null,
      candidateCanonicalName: candidate?.name ?? null,
      candidateDomain: candidate?.domain ?? null,
      candidateSourcePath: candidate?.sourcePath ?? null,
      candidateCanonicalIds: candidates.filter(item => item.targetType === 'CANONICAL').map(item => item.id),
      candidateReferenceIds: candidates.filter(item => item.targetType === 'DOCUMENT_REFERENCE').map(item => item.id),
      mappingApproved: false
    };
  });

  const statusCounts = Object.fromEntries(
    ['EXACT_ID_MATCH', 'NAME_CANDIDATE', 'DOCUMENT_REFERENCE_CANDIDATE', 'AMBIGUOUS', 'UNMATCHED']
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
      targetCatalogs: catalogs.map(item => ({
        domain: item.domain,
        sourcePath: item.sourcePath,
        targetType: item.targetType ?? 'CANONICAL',
        recordCount: item.records.length
      })),
      canonicalRecordCount: canonical.filter(item => item.targetType === 'CANONICAL').length,
      documentReferenceCount: canonical.filter(item => item.targetType === 'DOCUMENT_REFERENCE').length,
      targetRecordCount: canonical.length,
      matchingPolicy: [
        'Only exact ID equality is reported as EXACT_ID_MATCH.',
        'Exact name equality without ID equality is a candidate, not an identity decision.',
        'Matches to prose headings are DOCUMENT_REFERENCE_CANDIDATE, never canonical identity matches.',
        'Multiple or disagreeing candidates remain AMBIGUOUS.',
        'No fuzzy, substring, normalized, or inferred matching is performed.'
      ]
    },
    summary: {
      ...statusCounts,
      total: records.length,
      mappedOrCandidateCount: records.filter(item => item.candidateTargetId !== null).length,
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
      'Coverage is limited to the canonical catalogs and document references listed in scope; unmatched does not mean the game entity is unknown to Samantha.',
      'An exact ID or name match is an identifier candidate only, not proof that two records have equivalent meaning.',
      'Document heading references are navigation anchors, not canonical GKB entity records or stable semantic identifiers.',
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
  const uwDoc = await readFile(path.join(ROOT, 'ULTIMATE_WEAPONS_MECHANICS.md'), 'utf8');
  const enemyDoc = await readFile(path.join(ROOT, 'ENEMY_MECHANICS.md'), 'utf8');
  const headingRecords = (document, prefix, domain) => {
    const records = [];
    for (const line of document.split(/\r?\n/)) {
      const match = line.match(/^\d+(?:\.\d+)*\s+(.+?)\s*$/);
      if (!match) continue;
      const name = match[1].replace(/\s+\([A-Z0-9+ -]+\)$/, '').trim();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!slug) continue;
      records.push({ id: `${prefix}#${slug}`, name });
    }
    return records;
  };
  const uwReferences = headingRecords(uwDoc, 'GKB-UW-001', 'Ultimate Weapons');
  const enemyReferences = headingRecords(enemyDoc, 'GKB-ENEMY-001', 'Enemies');
  const report = buildIdentifierMappingReport({
    graph,
    catalogs: [
      {
        domain: 'Modules — Unique',
        sourcePath: 'GKB/domains/modules-unique.json',
        targetType: 'CANONICAL',
        records: modules.modules
      },
      {
        domain: 'Ultimate Weapons — document headings',
        sourcePath: 'GKB/ULTIMATE_WEAPONS_MECHANICS.md',
        targetType: 'DOCUMENT_REFERENCE',
        records: uwReferences
      },
      {
        domain: 'Enemies — document headings',
        sourcePath: 'GKB/ENEMY_MECHANICS.md',
        targetType: 'DOCUMENT_REFERENCE',
        records: enemyReferences
      }
    ],
    sdkVersion: manifest.version,
    retrievedAt: new Date().toISOString().slice(0, 10)
  });
  report.scope.domainCoverage = [
    { domain: 'Modules — Unique', status: 'CANONICAL_CATALOG', recordCount: modules.modules.length },
    { domain: 'Ultimate Weapons', status: 'DOCUMENT_REFERENCE_ONLY', recordCount: uwReferences.length },
    { domain: 'Enemies', status: 'DOCUMENT_REFERENCE_ONLY', recordCount: enemyReferences.length },
    { domain: 'Research', status: 'NO_CANONICAL_CATALOG', recordCount: 0 },
    { domain: 'Workshop', status: 'NO_CANONICAL_CATALOG', recordCount: 0 },
    { domain: 'Cards and Masteries', status: 'NO_CANONICAL_CATALOG', recordCount: 0 },
    { domain: 'Perks', status: 'NO_CANONICAL_CATALOG', recordCount: 0 }
  ];
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
