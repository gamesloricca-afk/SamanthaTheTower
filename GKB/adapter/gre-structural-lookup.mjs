import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_SNAPSHOT = new URL('../staging/gre-source-snapshot/TestAccount-62ae508f/', import.meta.url);
const norm = value => String(value ?? '').normalize('NFKC').replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const readLines = file => fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const jsonl = values => values.map(value => JSON.stringify(value)).join('\n') + '\n';

export function buildGreMethodSearchIndex(methods, memberships) {
  const domains = new Map();
  for (const item of memberships) {
    const values = domains.get(item.typeIndex) ?? [];
    values.push(item.domain);
    domains.set(item.typeIndex, values);
  }
  return methods.map(method => ({
    recordKind: 'GRE_METHOD_SEARCH_ENTRY',
    sourceCommit: method.commit,
    methodIndex: method.index,
    methodName: method.name,
    normalizedName: norm(method.name),
    methodToken: method.token,
    methodOffset: method.offset,
    ownerTypeIndex: method.ownerType?.index ?? null,
    ownerTypeName: method.ownerType?.name ?? null,
    ownerNamespace: method.ownerType?.namespace ?? null,
    domainMemberships: [...new Set(domains.get(method.ownerType?.index) ?? [])].sort(),
    parameterNames: (method.parameters ?? []).map(item => item.name).filter(Boolean),
    evidenceClass: method.evidenceClass,
    verificationStatus: method.verificationStatus
  }));
}

export function searchGreMethods(index, { query = '', domain = '', limit = 50 } = {}) {
  const q = norm(query), d = norm(domain);
  return index.filter(item => {
    const searchable = norm([item.methodName, item.ownerTypeName, item.ownerNamespace, item.methodToken, item.parameterNames.join(' ')].join(' '));
    return (!q || searchable.includes(q)) && (!d || item.domainMemberships.some(value => norm(value).includes(d)));
  }).slice(0, Math.max(1, Math.min(500, Number(limit) || 50)));
}

export function linkGreClaimsToMethods({ methods, snapshotDir = DEFAULT_SNAPSHOT }) {
  const byToken = new Map(methods.map(item => [String(item.token).toLowerCase(), item]));
  const byName = new Map();
  for (const method of methods) {
    const key = norm(method.name), values = byName.get(key) ?? [];
    values.push(method); byName.set(key, values);
  }
  const claimsDir = path.resolve(snapshotDir instanceof URL ? snapshotDir.pathname : snapshotDir, 'claims');
  const links = [], unresolved = [];
  for (const fileName of fs.readdirSync(claimsDir).filter(name => name.endsWith('.md')).sort()) {
    const text = fs.readFileSync(path.join(claimsDir, fileName), 'utf8');
    const claimId = text.match(/^\s*-\s*Claim ID:\s*[\x60]?([A-Z0-9-]+)[\x60]?/mi)?.[1] ?? fileName.replace(/\.md$/, '');
    const tokens = [...new Set((text.match(/\b0x060[0-9a-f]{5}\b/gi) ?? []).map(value => value.toLowerCase()))];
    const names = [...new Set([...text.matchAll(/[\x60]([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g)].map(match => match[1]))];
    const matched = new Map();
    for (const token of tokens) {
      const method = byToken.get(token);
      if (method) matched.set(token, { method, matchKind: 'EXACT_METHOD_TOKEN' });
      else unresolved.push({ claimId, identifier: token, reason: 'METHOD_TOKEN_NOT_FOUND' });
    }
    for (const name of names) {
      const candidates = byName.get(norm(name)) ?? [];
      if (candidates.length === 1) matched.set(String(candidates[0].token).toLowerCase(), { method: candidates[0], matchKind: 'EXACT_METHOD_NAME_UNIQUE' });
      else if (candidates.length > 1) {
        const exact = candidates.filter(item => tokens.includes(String(item.token).toLowerCase()));
        if (exact.length === 1) matched.set(String(exact[0].token).toLowerCase(), { method: exact[0], matchKind: 'EXACT_NAME_AND_TOKEN' });
        else unresolved.push({ claimId, identifier: name, reason: 'METHOD_NAME_AMBIGUOUS', candidateCount: candidates.length });
      } else unresolved.push({ claimId, identifier: name, reason: 'METHOD_NAME_NOT_FOUND' });
    }
    for (const { method, matchKind } of matched.values()) links.push({
      recordKind: 'GRE_CLAIM_METHOD_REFERENCE', claimId,
      methodIndex: method.index, methodName: method.name, methodToken: method.token, methodOffset: method.offset,
      ownerTypeIndex: method.ownerType?.index ?? null, ownerTypeName: method.ownerType?.name ?? null,
      sourceCommit: method.commit, sourceClaimPath: 'claims/' + fileName, sourceMethodPath: method.sourceFile ?? null,
      matchKind, relationship: 'REFERENCES_STRUCTURAL_DECLARATION',
      verificationStatus: 'EXTERNAL-UNVERIFIED', semanticRelationshipInferred: false
    });
  }
  return { links, unresolved };
}

export function buildGreStructuralLookup({ inventoryDir, snapshotDir = DEFAULT_SNAPSHOT }) {
  const methods = readLines(path.join(inventoryDir, 'gre-methods.jsonl'));
  const memberships = readLines(path.join(inventoryDir, 'gre-domain-memberships.jsonl'));
  const index = buildGreMethodSearchIndex(methods, memberships);
  const { links, unresolved } = linkGreClaimsToMethods({ methods, snapshotDir });
  fs.writeFileSync(path.join(inventoryDir, 'gre-method-search-index.jsonl'), jsonl(index));
  fs.writeFileSync(path.join(inventoryDir, 'gre-claim-method-links.jsonl'), jsonl(links));
  const report = {
    format: 'SAMANTHA_GKB_GRE_STRUCTURAL_LOOKUP', formatVersion: 1, status: 'PASSED',
    sourceCommit: methods[0]?.commit ?? null, indexedMethodCount: index.length,
    claimMethodReferenceCount: links.length, unresolvedIdentifierCount: unresolved.length,
    unresolvedIdentifiers: unresolved, semanticRelationshipInferred: false,
    canonicalClaimsCreated: 0, automaticApprovals: 0, canonicalWrites: 0,
    limitations: [
      'Search entries are navigation aids over structural declarations, not mechanics claims.',
      'Links use exact method tokens or exact method names in pinned claim text.',
      'Ambiguous names are reported, not guessed.',
      'A reference does not prove execution, data flow, call order, or mechanic behavior.'
    ]
  };
  fs.writeFileSync(path.join(inventoryDir, 'gre-structural-lookup-report.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}

function main() {
  const [command, inventoryDir, query, domain, snapshotDir] = process.argv.slice(2);
  if (command === 'search') {
    console.log(JSON.stringify(searchGreMethods(readLines(path.join(inventoryDir, 'gre-method-search-index.jsonl')), { query, domain }), null, 2));
  } else if (command === 'build' && inventoryDir) {
    console.log(JSON.stringify(buildGreStructuralLookup({ inventoryDir, snapshotDir: snapshotDir ?? DEFAULT_SNAPSHOT }), null, 2));
  } else throw new Error('Usage: build <inventoryDir> [snapshotDir] | search <inventoryDir> <query> [domain]');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) { console.error(JSON.stringify({ status: 'FAILED', error: error.message }, null, 2)); process.exitCode = 1; }
}